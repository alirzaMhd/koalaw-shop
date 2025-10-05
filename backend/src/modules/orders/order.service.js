// src/modules/orders/order.service.ts
// Orders domain service: fetch, list, state transitions, and payment state updates.
// Integrates with inventory reservations (release on cancel) and coupon redemptions on payment success.
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { AppError } from "../../common/errors/AppError.js";
import { logger } from "../../config/logger.js";
import { eventBus } from "../../events/eventBus.js";
import { emitOrderStatusChanged, emitOrderCancelled, emitPaymentSucceeded, emitPaymentFailed, } from "./order.events.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { normalizeCouponCode } from "../pricing/coupon.entity.js";
// ---- Helpers ----
const includeOrderDetail = {
    items: { orderBy: { position: "asc" } },
    payments: { orderBy: { createdAt: "desc" } },
};
function toPagination(q) {
    const page = Math.max(1, Math.floor(q?.page ?? 1));
    const perPage = Math.max(1, Math.min(100, Math.floor(q?.perPage ?? 12)));
    return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}
function toDate(v) {
    if (!v)
        return undefined;
    if (v instanceof Date)
        return v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
}
const ALLOWED_TRANSITIONS = {
    draft: ["awaiting_payment", "cancelled"],
    awaiting_payment: ["paid", "cancelled"],
    paid: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered", "returned"],
    delivered: ["returned"],
    cancelled: [], // terminal
    returned: [], // terminal
};
function canTransition(from, to) {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
function mapSummary(row) {
    return {
        id: row.id,
        orderNumber: row.orderNumber,
        status: row.status,
        total: row.total,
        currencyCode: row.currencyCode,
        placedAt: row.placedAt,
        itemsCount: row._count?.items ?? row.itemsCount ?? 0,
    };
}
// ---- Service ----
class OrderService {
    // Fetch a single order (admin or owner)
    async getById(orderId) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: includeOrderDetail,
        });
        if (!order)
            throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
        return order;
    }
    async getByNumber(orderNumber) {
        const order = await prisma.order.findUnique({
            where: { orderNumber },
            include: includeOrderDetail,
        });
        if (!order)
            throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
        return order;
    }
    // Ensure the order belongs to the user; throws otherwise
    async getForUser(orderId, userId) {
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId },
            include: includeOrderDetail,
        });
        if (!order)
            throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
        return order;
    }
    // List orders for a user (self)
    async listForUser(userId, query) {
        const { page, perPage, skip, take } = toPagination(query);
        const where = { userId };
        if (query?.status) {
            const arr = Array.isArray(query.status) ? query.status : [query.status];
            where.status = { in: arr };
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
                },
            }),
        ]);
        return {
            items: rows.map(mapSummary),
            meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
        };
    }
    // Admin list with filters
    async listAll(query) {
        const { page, perPage, skip, take } = toPagination(query);
        const where = {};
        if (query?.userId)
            where.userId = query.userId;
        if (query?.status) {
            const arr = Array.isArray(query.status) ? query.status : [query.status];
            where.status = { in: arr };
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
                },
            }),
        ]);
        return {
            items: rows.map(mapSummary),
            meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
        };
    }
    // Status transitions
    async updateStatus(orderId, to) {
        const prev = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, orderNumber: true },
        });
        if (!prev)
            throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
        const from = prev.status;
        if (!canTransition(from, to)) {
            throw new AppError(`تغییر وضعیت از ${from} به ${to} مجاز نیست.`, 409, "BAD_STATUS");
        }
        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { status: to.toUpperCase() },
            include: includeOrderDetail,
        });
        emitOrderStatusChanged({ orderId, from, to, at: new Date().toISOString() });
        return updated;
    }
    // Cancel an order (releases stock; does not refund automatically)
    async cancelOrder(orderId, reason) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, orderNumber: true },
        });
        if (!order)
            throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
        if (!canTransition(order.status, "cancelled")) {
            throw new AppError("لغو سفارش در وضعیت فعلی مجاز نیست.", 409, "BAD_STATUS");
        }
        const updated = await prisma.$transaction(async (tx) => {
            const o = await tx.order.update({
                where: { id: orderId },
                data: { status: "cancelled".toUpperCase() },
                include: includeOrderDetail,
            });
            // Release inventory for order items with variants
            try {
                await inventoryService.releaseForOrder(orderId);
            }
            catch (e) {
                logger.warn({ err: e, orderId }, "Failed to release inventory on cancel");
            }
            return o;
        });
        emitOrderCancelled({ orderId, orderNumber: updated.orderNumber, reason: reason ?? null, userId: updated.userId ?? null });
        emitOrderStatusChanged({ orderId, from: order.status, to: "cancelled", at: new Date().toISOString() });
        return updated;
    }
    // Payment success handler (called from payment webhook/handler)
    async markPaymentSucceeded(args) {
        const { orderId, paymentId, transactionRef, authority } = args;
        const updated = await prisma.$transaction(async (tx) => {
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
            if (!orderPrev)
                throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
            let order = orderPrev;
            let statusChanged = false;
            if (String(orderPrev.status).toUpperCase() === "AWAITING_PAYMENT") {
                order = await tx.order.update({ where: { id: orderId }, data: { status: "paid".toUpperCase() } });
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
                    }
                    catch (e) {
                        // Unique (couponId, orderId) may conflict on retries; ignore
                        if (e?.code !== "P2002")
                            logger.warn({ err: e }, "Failed to record coupon redemption");
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
    async markPaymentFailed(args) {
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
    // Reorder: create a new cart populated from a previous order (returns new cart id)
    async createCartFromOrder(orderId, userId) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order)
            throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
        // Create a new active cart for user (or anonymous)
        const cart = await prisma.cart.create({
            data: {
                userId: userId || null,
                status: "ACTIVE",
            },
        });
        if (order.items.length) {
            // Build data while omitting undefined fields so the resulting objects match Prisma's expected types
            const itemsData = order.items.map((it) => {
                const base = {
                    cartId: cart.id,
                    title: it.title,
                    variantName: it.variantName ?? null,
                    unitPrice: it.unitPrice,
                    quantity: it.quantity,
                    lineTotal: it.lineTotal,
                    currencyCode: it.currencyCode ?? order.currencyCode,
                    imageUrl: it.imageUrl ?? null,
                };
                if (it.productId)
                    base.productId = it.productId;
                if (it.variantId)
                    base.variantId = it.variantId;
                return base;
            });
            await prisma.cartItem.createMany({
                data: itemsData,
            });
        }
        return { cartId: cart.id };
    }
}
export const orderService = new OrderService();
//# sourceMappingURL=order.service.js.map