// src/modules/orders/order.service.ts
// Orders domain service: fetch, list, state transitions, and payment state updates.
// Integrates with inventory reservations (release on cancel) and coupon redemptions on payment success.

import { prisma } from "../../infrastructure/db/prismaClient.js";
import { AppError } from "../../common/errors/AppError.js";
import { logger } from "../../config/logger.js";
import { eventBus } from "../../events/eventBus.js";
import {
  emitOrderStatusChanged,
  emitOrderCancelled,
  emitPaymentSucceeded,
  emitPaymentFailed,
  type OrderCreatedEvent,
} from "./order.events.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { normalizeCouponCode } from "../pricing/coupon.entity.js";

// ---- Types ----

export type OrderStatus =
  | "draft"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface Paginated<T> {
  items: T[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

export interface ListOrdersQuery {
  page?: number;
  perPage?: number;
  status?: OrderStatus | OrderStatus[];
  userId?: string; // admin filter
  from?: string | Date;
  to?: string | Date;
  search?: string; // matches orderNumber (exact/contains)
}

// ---- Helpers ----

const includeOrderDetail = {
  items: { orderBy: { position: "asc" as const } },
  payments: { orderBy: { createdAt: "desc" as const } },
} as const;

function toPagination(q?: { page?: number; perPage?: number }) {
  const page = Math.max(1, Math.floor(q?.page ?? 1));
  const perPage = Math.max(1, Math.min(100, Math.floor(q?.perPage ?? 12)));
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

function toDate(v: string | Date | undefined): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [], // terminal
  returned: [], // terminal
};

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---- Mapping (minimal DTOs) ----

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  total: number;
  currencyCode: string;
  placedAt: Date;
  itemsCount: number;
  firstItem?: {  // ← Add this
    title: string;
    imageUrl: string | null;
  } | null;
}

function mapSummary(row: any): OrderSummary {
  const statusLabels: Record<OrderStatus, string> = {
    draft: "پیش‌نویس",
    awaiting_payment: "در انتظار پرداخت",
    paid: "پرداخت شده",
    processing: "در حال پردازش",
    shipped: "ارسال شده",
    delivered: "تحویل داده شده",
    cancelled: "لغو شده",
    returned: "مرجوع شده",
  };

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status as OrderStatus,
    statusLabel: statusLabels[row.status as OrderStatus] || row.status,
    total: row.total,
    currencyCode: row.currencyCode,
    placedAt: row.placedAt,
    itemsCount: row._count?.items ?? row.itemsCount ?? 0,
    firstItem: row.items?.[0] ? {
      title: row.items[0].title,
      imageUrl: row.items[0].imageUrl,
    } : null,
  };
}

// ---- Service ----

class OrderService {
  // Fetch a single order (admin or owner)
  async getById(orderId: string): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: includeOrderDetail,
    });
    if (!order) throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
    return order;
  }

  async getByNumber(orderNumber: string): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: includeOrderDetail,
    });
    if (!order) throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
    return order;
  }

  // Ensure the order belongs to the user; throws otherwise
  async getForUser(orderId: string, userId: string): Promise<any> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: includeOrderDetail,
    });
    if (!order) throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
    return order;
  }

  // List orders for a user (self)
  async listForUser(userId: string, query?: Partial<ListOrdersQuery>): Promise<Paginated<OrderSummary>> {
    const { page, perPage, skip, take } = toPagination(query);
    const where: any = { userId };

    if (query?.status) {
      const arr = Array.isArray(query.status) ? query.status : [query.status];
      where.status = { in: arr as OrderStatus[] };
    }
    if (query?.from || query?.to) {
      const gte = toDate(query.from);
      const lte = toDate(query.to);
      where.placedAt = { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
    }
    if (query?.search) {
      where.orderNumber = { contains: String(query.search).trim(), mode: "insensitive" };
    }

    const [total, rows] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { placedAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          currencyCode: true,
          placedAt: true,
          _count: { select: { items: true } },
          items: {
            take: 1,
            orderBy: { position: "asc" as const },
            select: {
              title: true,
              imageUrl: true,
            },
          },
        },
      }),
    ]);

    return {
      items: rows.map(mapSummary),
      meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
    };
  }

  // Admin list with filters
  async listAll(query?: Partial<ListOrdersQuery>): Promise<Paginated<OrderSummary>> {
    const { page, perPage, skip, take } = toPagination(query);
    const where: any = {};

    if (query?.userId) where.userId = query.userId;
    if (query?.status) {
      const arr = Array.isArray(query.status) ? query.status : [query.status];
      where.status = { in: arr as OrderStatus[] };
    }
    if (query?.from || query?.to) {
      const gte = toDate(query.from);
      const lte = toDate(query.to);
      where.placedAt = { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
    }
    if (query?.search) {
      where.orderNumber = { contains: String(query.search).trim(), mode: "insensitive" };
    }

    const [total, rows] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { placedAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          currencyCode: true,
          placedAt: true,
          _count: { select: { items: true } },
          items: {
            take: 1,
            orderBy: { position: "asc" as const },
            select: {
              title: true,
              imageUrl: true,
            },
          },
        },
      }),
    ]);

    return {
      items: rows.map(mapSummary),
      meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
    };
  }

  // Status transitions
  async updateStatus(orderId: string, to: OrderStatus): Promise<any> {
    const prev = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, orderNumber: true },
    });
    if (!prev) throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");

    const from = prev.status as OrderStatus;
    if (!canTransition(from, to)) {
      throw new AppError(`تغییر وضعیت از ${from} به ${to} مجاز نیست.`, 409, "BAD_STATUS");
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: (to as string).toUpperCase() as any },
      include: includeOrderDetail,
    });

    emitOrderStatusChanged({ orderId, from, to, at: new Date().toISOString() });
    return updated;
  }

  // Cancel an order (releases stock; does not refund automatically)
  async cancelOrder(orderId: string, reason?: string): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, orderNumber: true },
    });
    if (!order) throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");

    if (!canTransition(order.status as OrderStatus, "cancelled")) {
      throw new AppError("لغو سفارش در وضعیت فعلی مجاز نیست.", 409, "BAD_STATUS");
    }

    const updated = await prisma.$transaction(async (tx: { order: { update: (arg0: { where: { id: string; }; data: { status: any; }; include: { readonly items: { readonly orderBy: { readonly position: "asc"; }; }; readonly payments: { readonly orderBy: { readonly createdAt: "desc"; }; }; }; }) => any; }; }) => {
      const o = await tx.order.update({
        where: { id: orderId },
        data: { status: ("cancelled".toUpperCase() as any) },
        include: includeOrderDetail,
      });

      // Release inventory for order items with variants
      try {
        await inventoryService.releaseForOrder(orderId);
      } catch (e) {
        logger.warn({ err: e, orderId }, "Failed to release inventory on cancel");
      }

      return o;
    });

    emitOrderCancelled({ orderId, orderNumber: updated.orderNumber, reason: reason ?? null, userId: updated.userId ?? null });
    emitOrderStatusChanged({ orderId, from: order.status as OrderStatus, to: "cancelled", at: new Date().toISOString() });

    return updated;
  }

  // Payment success handler (called from payment webhook/handler)
  async markPaymentSucceeded(args: {
    orderId: string;
    paymentId: string;
    transactionRef?: string | null;
    authority?: string | null;
  }): Promise<any> {
    const { orderId, paymentId, transactionRef, authority } = args;

    const updated = await prisma.$transaction(async (tx: { payment: { update: (arg0: { where: { id: string; }; data: { status: string; transactionRef: string | null; authority: string | null; paidAt: Date; }; select: { id: boolean; orderId: boolean; amount: boolean; currencyCode: boolean; status: boolean; }; }) => any; }; order: { findUnique: (arg0: { where: { id: string; }; select: { id: boolean; status: boolean; couponCode: boolean; userId: boolean; orderNumber: boolean; total: boolean; currencyCode: boolean; }; }) => any; update: (arg0: { where: { id: string; }; data: { status: any; }; }) => any; }; coupon: { findFirst: (arg0: { where: { code: { equals: string; mode: string; }; }; select: { id: boolean; }; }) => any; }; couponRedemption: { create: (arg0: { data: { couponId: any; userId: any; orderId: string; }; }) => any; }; }) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: "PAID", transactionRef: transactionRef ?? null, authority: authority ?? null, paidAt: new Date() },
        select: { id: true, orderId: true, amount: true, currencyCode: true, status: true },
      });

      // Update order to 'paid' if it was awaiting_payment
      const orderPrev = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, couponCode: true, userId: true, orderNumber: true, total: true, currencyCode: true },
      });
      if (!orderPrev) throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");

      let order = orderPrev as any;
      let statusChanged = false;
      if (String(orderPrev.status).toUpperCase() === "AWAITING_PAYMENT") {
        order = await tx.order.update({ where: { id: orderId }, data: { status: ("paid".toUpperCase() as any) } });
        statusChanged = true;
      }

      // Record coupon redemption if any
      if (orderPrev.couponCode) {
        const code = normalizeCouponCode(orderPrev.couponCode);
        const coupon = await tx.coupon.findFirst({ where: { code: { equals: code, mode: "insensitive" } }, select: { id: true } });
        if (coupon) {
          try {
            await tx.couponRedemption.create({
              data: {
                couponId: coupon.id,
                userId: orderPrev.userId ?? null,
                orderId: orderId,
              },
            });
          } catch (e: any) {
            // Unique (couponId, orderId) may conflict on retries; ignore
            if (e?.code !== "P2002") logger.warn({ err: e }, "Failed to record coupon redemption");
          }
        }
      }

      return { payment, order: orderPrev, statusChanged };
    });

    if (updated.statusChanged) {
      emitOrderStatusChanged({ orderId, from: "awaiting_payment", to: "paid", at: new Date().toISOString() });
    }
    emitPaymentSucceeded({
      orderId,
      paymentId,
      method: "gateway",
      amount: updated.order.total,
      currencyCode: updated.order.currencyCode,
      authority: authority ?? null,
      transactionRef: transactionRef ?? null,
    });

    // Note: stock reservation is expected in order.created handler; fulfillment in payment.succeeded handler.

    return this.getById(orderId);
  }

  // Payment failure handler
  async markPaymentFailed(args: {
    orderId: string;
    paymentId: string;
    reason?: string | null;
    transactionRef?: string | null;
    authority?: string | null;
  }): Promise<any> {
    const { orderId, paymentId, reason, transactionRef, authority } = args;
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "FAILED",
        transactionRef: transactionRef ?? null,
        authority: authority ?? null,
      },
      select: { id: true, amount: true, currencyCode: true },
    });

    emitPaymentFailed({
      orderId,
      paymentId,
      method: "gateway",
      amount: payment.amount,
      currencyCode: payment.currencyCode,
      reason: reason ?? null,
    });

    return this.getById(orderId);
  }

  // Reorder: put ONLY the items from the specific order into the user's cart
  async createCartFromOrder(orderId: string, userId?: string | null): Promise<{ cartId: string; itemsAdded: number }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");

    // Use user's active cart if exists; otherwise create one
    let cart = null as any;
    if (userId) {
      cart = await prisma.cart.findFirst({ where: { userId, status: "ACTIVE" } });
    }
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: userId || null, status: "ACTIVE" } });
    }

    if (!order.items.length) {
      // Nothing to add; clear anyway to enforce "only from this order"
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      return { cartId: cart.id, itemsAdded: 0 };
    }

    // Helper normalizer
    const norm = (s?: string | null) =>
      (s || "")
        .toString()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .toLowerCase();

    const urlPath = (u?: string | null) => {
      if (!u) return null;
      try {
        const parsed = new URL(u, "http://dummy.local");
        return parsed.pathname + (parsed.search || "");
      } catch {
        return u.startsWith("/") ? u : `/${u}`;
      }
    };

    const pickKeyword = (title: string) => {
      const tokens = norm(title)
        .split(/\s+/)
        .filter((t) => t.length >= 3)
        .sort((a, b) => b.length - a.length);
      return tokens[0] || norm(title).slice(0, 24);
    };

    async function resolveProductForItem(it: {
      title: string;
      variantName?: string | null;
      unitPrice: number;
      imageUrl?: string | null;
    }): Promise<{ productId: string; variantId: string | null } | null> {
      const titleN = norm(it.title);
      const variantN = norm(it.variantName);

      // Exact title + variant (no isActive filter to allow archived reorder)
      if (titleN) {
        const vExact = await prisma.productVariant.findFirst({
          where: {
            ...(it.variantName ? { variantName: { equals: it.variantName, mode: "insensitive" } } : {}),
            product: { title: { equals: it.title, mode: "insensitive" } },
          },
          select: { id: true, productId: true },
        });
        if (vExact) return { productId: vExact.productId, variantId: vExact.id };

        const pExact = await prisma.product.findFirst({
          where: { title: { equals: it.title, mode: "insensitive" } },
          select: { id: true, variants: { select: { id: true, variantName: true } } },
        });
        if (pExact) {
          let vId: string | null = null;
          if (variantN && pExact.variants.length) {
            const v = pExact.variants.find((vv: { id: string; variantName: string }) => norm(vv.variantName) === variantN);
            vId = v ? v.id : null;
          }
          return { productId: pExact.id, variantId: vId };
        }

        // Contains (looser)
        const keyword = pickKeyword(it.title);
        const pContains = await prisma.product.findFirst({
          where: { title: { contains: keyword, mode: "insensitive" } },
          select: { id: true, variants: { select: { id: true, variantName: true } } },
        });
        if (pContains) {
          let vId: string | null = null;
          if (variantN && pContains.variants.length) {
            const v = pContains.variants.find((vv: { id: string; variantName: string }) => norm(vv.variantName) === variantN);
            vId = v ? v.id : null;
          }
          return { productId: pContains.id, variantId: vId };
        }
      }

      // Image path match
      const path = urlPath(it.imageUrl);
      if (path) {
        const pByHero = await prisma.product.findFirst({
          where: { OR: [{ heroImageUrl: { equals: path } }, { heroImageUrl: { endsWith: path } }] },
          select: { id: true },
        });
        if (pByHero) return { productId: pByHero.id, variantId: null };

        const img = await prisma.productImage.findFirst({
          where: { OR: [{ url: { equals: path } }, { url: { endsWith: path } }] },
          select: { productId: true },
        });
        if (img) return { productId: img.productId, variantId: null };
      }

      // Price-based fallbacks (IRR/IRT)
      const candidates = [
        Math.floor(it.unitPrice),
        Math.floor(it.unitPrice * 10),
        Math.floor(it.unitPrice / 10),
      ].filter((v, i, arr) => Number.isFinite(v) && v > 0 && arr.indexOf(v) === i);

      for (const amt of candidates) {
        const vByPrice = await prisma.productVariant.findFirst({
          where: { price: amt, product: {} },
          select: { id: true, productId: true },
        });
        if (vByPrice) return { productId: vByPrice.productId, variantId: vByPrice.id };
      }
      for (const amt of candidates) {
        const pByPrice = await prisma.product.findFirst({
          where: { price: amt },
          select: { id: true },
        });
        if (pByPrice) return { productId: pByPrice.id, variantId: null };
      }

      return null;
    }

    // Resolve items; prefer existing refs
    const prepared = await Promise.all(
      order.items.map(async (it: any) => {
        if (it.productId) {
          return { it, productId: it.productId as string, variantId: (it.variantId as string) || null };
        }
        const resolved = await resolveProductForItem({
          title: it.title,
          variantName: it.variantName ?? null,
          unitPrice: it.unitPrice,
          imageUrl: it.imageUrl ?? null,
        });
        return resolved ? { it, ...resolved } : null;
      })
    );

    const valid = prepared.filter(Boolean) as Array<{ it: any; productId: string; variantId: string | null }>;
    if (!valid.length) {
      throw new AppError("این سفارش شامل محصولات قابل خرید مجدد نیست.", 400, "NO_REORDERABLE_ITEMS");
    }

    // IMPORTANT: Replace existing cart contents with ONLY these items
    await prisma.$transaction(async (tx: any) => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cartItem.createMany({
        data: valid.map(({ it, productId, variantId }) => ({
          cartId: cart.id,
          productId,
          variantId,
          title: it.title,
          variantName: it.variantName ?? null,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          lineTotal: it.unitPrice * it.quantity,
          currencyCode: it.currencyCode ?? order.currencyCode,
          imageUrl: it.imageUrl ?? null,
        })),
      });
    });

    return { cartId: cart.id, itemsAdded: valid.length };
  }
}

export const orderService = new OrderService();