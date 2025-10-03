// src/modules/inventory/inventory.service.ts
// Inventory service: stock queries, atomic reservations, releases, and simple availability checks.
// Uses DB stock on product_variants.stock and transactional updates for correctness.
// Backorders can be enabled via env.INVENTORY_ALLOW_BACKORDER (default: false).

import { prisma } from "../../infrastructure/db/prismaClient.js";
import { AppError } from "../../common/errors/AppError.js";
import { logger } from "../../config/logger.js";
import { eventBus } from "../../events/eventBus";
import { env } from "../../config/env.js";

const ALLOW_BACKORDER = String(env.INVENTORY_ALLOW_BACKORDER || "false") === "true";

export type ReserveLine = { variantId: string; quantity: number };
export type ReserveResult = {
  reserved: ReserveLine[];
  failures: { variantId: string; requested: number; available?: number; reason: "OUT_OF_STOCK" | "NOT_FOUND" }[];
};

export class InventoryService {
  // ---------- Low-level stock ops ----------

  async getStock(variantId: string): Promise<number> {
    const v = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });
    if (!v) throw new AppError("واریانت یافت نشد.", 404, "VARIANT_NOT_FOUND");
    return v.stock ?? 0;
  }

  async setStock(variantId: string, stock: number): Promise<number> {
    if (!Number.isInteger(stock) || stock < 0) throw new AppError("مقدار موجودی نامعتبر است.", 400, "BAD_STOCK");
    const v = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
      select: { stock: true },
    });
    eventBus.emit("inventory.stock.set", { variantId, stock: v.stock });
    return v.stock ?? 0;
  }

  async adjustStock(variantId: string, delta: number): Promise<number> {
    if (!Number.isInteger(delta)) throw new AppError("تغییر موجودی باید عدد صحیح باشد.", 400, "BAD_STOCK");
    // If backorder is disabled and this would cause negative, block
    if (!ALLOW_BACKORDER && delta < 0) {
      const current = await this.getStock(variantId);
      if (current + delta < 0) throw new AppError("موجودی کافی نیست.", 409, "OUT_OF_STOCK");
    }
    const v = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: delta } },
      select: { stock: true },
    });
    eventBus.emit("inventory.stock.adjusted", { variantId, delta, stock: v.stock });
    return v.stock ?? 0;
  }

  // ---------- Atomic reservation helpers (single line) ----------

  private async reserveOne(tx: typeof prisma, variantId: string, qty: number): Promise<void> {
    if (qty <= 0) throw new AppError("تعداد نامعتبر است.", 400, "BAD_QTY");

    if (ALLOW_BACKORDER) {
      // Allow negative stock; just decrement
      await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { decrement: qty } },
      });
      return;
    }

    // Decrement only if enough stock (atomic via updateMany)
    const res = await tx.productVariant.updateMany({
      where: { id: variantId, stock: { gte: qty } },
      data: { stock: { decrement: qty } },
    });
    if (res.count === 0) {
      // Inspect current stock for more informative error
      const v = await tx.productVariant.findUnique({ where: { id: variantId }, select: { stock: true } });
      const available = v?.stock ?? 0;
      const err = new AppError("موجودی کافی نیست.", 409, "OUT_OF_STOCK");
      (err as any).meta = { variantId, requested: qty, available };
      throw err;
    }
  }

  private async releaseOne(tx: typeof prisma, variantId: string, qty: number): Promise<void> {
    if (qty <= 0) throw new AppError("تعداد نامعتبر است.", 400, "BAD_QTY");
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: qty } },
    });
  }

  // ---------- Batch reservations ----------

  /**
   * Try to reserve a set of variant quantities atomically.
   * If ALLOW_BACKORDER=false, the operation is all-or-nothing (transaction).
   * If any line cannot be reserved, the transaction is rolled back and an error is thrown.
   */
  async reserve(lines: ReserveLine[]): Promise<ReserveResult> {
    if (!lines?.length) return { reserved: [], failures: [] };

    // Deduplicate by variantId by summing requested quantities
    const merged = new Map<string, number>();
    for (const l of lines) {
      merged.set(l.variantId, (merged.get(l.variantId) || 0) + (l.quantity || 0));
    }
    const compact = Array.from(merged.entries()).map(([variantId, quantity]) => ({ variantId, quantity }));

    try {
      await prisma.$transaction(async (tx) => {
        for (const { variantId, quantity } of compact) {
          // Ensure variant exists
          const exists = await tx.productVariant.findUnique({
            where: { id: variantId },
            select: { id: true },
          });
          if (!exists) {
            const err = new AppError("واریانت یافت نشد.", 404, "VARIANT_NOT_FOUND");
            (err as any).meta = { variantId };
            throw err;
          }
        }
        // Apply decrements
        for (const { variantId, quantity } of compact) {
          await this.reserveOne(tx, variantId, quantity);
        }
      });

      eventBus.emit("inventory.reserved", { lines: compact });
      return { reserved: compact, failures: [] };
    } catch (e: any) {
      // Collect failure details if available
      const failures: ReserveResult["failures"] = [];
      if (e?.code === "P2025") {
        failures.push({ variantId: "unknown", requested: 0, reason: "NOT_FOUND" });
      } else if (e?.code === "OUT_OF_STOCK" || e?.message?.includes("موجودی کافی نیست")) {
        const meta = (e as any).meta;
        if (meta?.variantId) {
          failures.push({
            variantId: meta.variantId,
            requested: meta.requested ?? 0,
            available: meta.available,
            reason: "OUT_OF_STOCK",
          });
        }
      }
      if (!failures.length) {
        logger.warn({ err: e }, "inventory.reserve failed");
      }
      throw e instanceof AppError ? e : new AppError("عدم امکان رزرو موجودی.", 409, "RESERVE_FAILED");
    }
  }

  /**
   * Release a set of variant quantities (e.g., on order cancellation).
   * Always increments back stock per line, in a transaction.
   */
  async release(lines: ReserveLine[]): Promise<void> {
    if (!lines?.length) return;

    // Merge by variant
    const merged = new Map<string, number>();
    for (const l of lines) merged.set(l.variantId, (merged.get(l.variantId) || 0) + (l.quantity || 0));
    const compact = Array.from(merged.entries()).map(([variantId, quantity]) => ({ variantId, quantity }));

    await prisma.$transaction(async (tx) => {
      for (const { variantId, quantity } of compact) {
        await this.releaseOne(tx, variantId, quantity);
      }
    });

    eventBus.emit("inventory.released", { lines: compact });
  }

  // ---------- Order-oriented helpers ----------

  /**
   * Reserve inventory for all order items (order_items) with a variantId.
   * Throws if any item cannot be reserved (and rolls back).
   */
  async reserveForOrder(orderId: string): Promise<ReserveResult> {
    const items = await prisma.orderItem.findMany({
      where: { orderId },
      select: { id: true, variantId: true, quantity: true, title: true },
    });

    if (!items.length) return { reserved: [], failures: [] };

    const lines: ReserveLine[] = [];
    const skipped: string[] = [];

    for (const it of items) {
      if (!it.variantId) {
        // No variantId on item; inventory not tracked for this line
        skipped.push(it.id);
        continue;
      }
      lines.push({ variantId: it.variantId, quantity: it.quantity });
    }

    const result = await this.reserve(lines);
    if (skipped.length) {
      logger.warn(
        { orderId, skippedCount: skipped.length },
        "reserveForOrder: some order_items have no variantId; skipped inventory reservation"
      );
    }
    return result;
  }

  /**
   * Release inventory for all order items (e.g., on cancellation/return).
   */
  async releaseForOrder(orderId: string): Promise<void> {
    const items = await prisma.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true },
    });
    const lines = items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId as string, quantity: i.quantity }));
    if (!lines.length) return;
    await this.release(lines);
  }

  // ---------- Cart/availability helpers ----------

  /**
   * Check if a cart's items are available right now (without reserving).
   * Returns per-line availability and overall ok flag.
   */
  async verifyCartAvailability(cartId: string): Promise<{
    ok: boolean;
    lines: { cartItemId: string; variantId?: string | null; requested: number; available: number; ok: boolean }[];
    unavailableCount: number;
    missingVariantCount: number;
  }> {
    const items = await prisma.cartItem.findMany({
      where: { cartId },
      select: { id: true, variantId: true, quantity: true },
    });
    if (!items.length) return { ok: true, lines: [], unavailableCount: 0, missingVariantCount: 0 };

    // Group quantities per variant
    const grouped = new Map<string, number>();
    for (const it of items) {
      if (!it.variantId) continue;
      grouped.set(it.variantId, (grouped.get(it.variantId) || 0) + it.quantity);
    }

    // Load stocks
    const stocks = new Map<string, number>();
    if (grouped.size) {
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: Array.from(grouped.keys()) } },
        select: { id: true, stock: true },
      });
      for (const v of variants) stocks.set(v.id, v.stock ?? 0);
    }

    let unavailableCount = 0;
    let missingVariantCount = 0;
    const lines = items.map((it) => {
      if (!it.variantId) {
        missingVariantCount += 1;
        return { cartItemId: it.id, variantId: null, requested: it.quantity, available: 0, ok: true };
      }
      const available = stocks.has(it.variantId) ? (stocks.get(it.variantId) as number) : 0;
      const requestedTotal = grouped.get(it.variantId) || it.quantity;
      // If backorder allowed, ok=true regardless
      const ok = ALLOW_BACKORDER ? true : available >= requestedTotal;
      if (!ok) unavailableCount += 1;
      return { cartItemId: it.id, variantId: it.variantId, requested: it.quantity, available, ok };
    });

    const ok = ALLOW_BACKORDER ? true : unavailableCount === 0;
    return { ok, lines, unavailableCount, missingVariantCount };
  }

  /**
   * Reserve inventory for a given cart (decrement stock). All-or-nothing.
   * Useful when creating an order from a cart right before payment authorization.
   */
  async reserveForCart(cartId: string): Promise<ReserveResult> {
    const items = await prisma.cartItem.findMany({
      where: { cartId },
      select: { id: true, variantId: true, quantity: true },
    });
    const lines: ReserveLine[] = [];
    for (const it of items) {
      if (!it.variantId) continue;
      lines.push({ variantId: it.variantId, quantity: it.quantity });
    }
    if (!lines.length) return { reserved: [], failures: [] };
    return this.reserve(lines);
  }
}

export const inventoryService = new InventoryService();