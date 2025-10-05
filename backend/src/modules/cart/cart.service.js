// src/modules/cart/cart.service.ts
// Server-side cart service: create/get cart (user/guest), add/update/remove items,
// merge guest cart on login, and compute quotes via pricing.service.
// Uses snapshot fields on cart_items (title, variant_name, unit_price, image_url, currency_code).
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { AppError } from "../../common/errors/AppError.js";
import { eventBus } from "../../events/eventBus.js";
import { logger } from "../../config/logger.js";
import { pricingService } from "../pricing/pricing.service.js";
function mapCart(row) {
    return {
        id: row.id,
        userId: row.userId ?? row.user_id ?? null,
        anonymousId: row.anonymousId ?? row.anonymous_id ?? null,
        status: row.status ?? "active",
        createdAt: row.createdAt ?? row.created_at,
        updatedAt: row.updatedAt ?? row.updated_at,
    };
}
function mapItem(row) {
    return {
        id: row.id,
        cartId: row.cartId ?? row.cart_id,
        productId: row.productId ?? row.product_id,
        variantId: row.variantId ?? row.variant_id ?? null,
        title: row.title,
        variantName: row.variantName ?? row.variant_name ?? null,
        unitPrice: row.unitPrice ?? row.unit_price,
        quantity: row.quantity,
        lineTotal: row.lineTotal ?? row.line_total,
        currencyCode: row.currencyCode ?? row.currency_code ?? "IRR",
        imageUrl: row.imageUrl ?? row.image_url ?? null,
        createdAt: row.createdAt ?? row.created_at,
        updatedAt: row.updatedAt ?? row.updated_at,
    };
}
async function primaryImageUrl(productId) {
    const p = await prisma.product.findUnique({
        where: { id: productId },
        select: { heroImageUrl: true },
    });
    if (p?.heroImageUrl)
        return p.heroImageUrl;
    const img = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { position: "asc" },
        select: { url: true },
    });
    return img?.url ?? null;
}
async function resolveSnapshot(args) {
    const product = await prisma.product.findUnique({
        where: { id: args.productId },
        select: {
            id: true,
            title: true,
            price: true,
            currencyCode: true,
            isActive: true,
        },
    });
    if (!product || !product.isActive) {
        throw new AppError("محصول یافت نشد یا غیرفعال است.", 404, "PRODUCT_NOT_FOUND");
    }
    let unitPrice = product.price;
    let variantName = null;
    if (args.variantId) {
        const variant = await prisma.productVariant.findFirst({
            where: { id: args.variantId, productId: args.productId, isActive: true },
            select: { id: true, variantName: true, price: true, isActive: true },
        });
        if (!variant || !variant.isActive) {
            throw new AppError("واریانت یافت نشد یا غیرفعال است.", 404, "VARIANT_NOT_FOUND");
        }
        variantName = variant.variantName;
        if (typeof variant.price === "number" && variant.price > 0) {
            unitPrice = variant.price;
        }
    }
    const imageUrl = await primaryImageUrl(args.productId);
    return {
        title: product.title,
        variantName,
        unitPrice,
        currencyCode: product.currencyCode || "IRR",
        imageUrl,
    };
}
function lineTotal(unitPrice, qty) {
    return Math.max(0, Math.floor(unitPrice) * Math.max(1, Math.floor(qty)));
}
class CartService {
    // ---------------- Core cart retrieval/creation ----------------
    async getById(cartId) {
        const cart = await prisma.cart.findUnique({ where: { id: cartId } });
        if (!cart)
            throw new AppError("سبد خرید یافت نشد.", 404, "CART_NOT_FOUND");
        const items = await prisma.cartItem.findMany({
            where: { cartId },
            orderBy: { createdAt: "asc" },
        });
        return { ...mapCart(cart), items: items.map(mapItem) };
    }
    async getOrCreateForUser(userId) {
        // Try to find an active cart
        let cart = await prisma.cart.findFirst({
            where: { userId, status: "ACTIVE" },
        });
        if (!cart) {
            try {
                cart = await prisma.cart.create({
                    data: { userId, status: "ACTIVE" },
                });
                eventBus.emit("cart.created", { userId, cartId: cart.id, type: "user" });
            }
            catch (e) {
                // Handle race: unique partial index might cause conflict
                cart = await prisma.cart.findFirst({
                    where: { userId, status: "ACTIVE" },
                });
                if (!cart)
                    throw e;
            }
        }
        const items = await prisma.cartItem.findMany({ where: { cartId: cart.id }, orderBy: { createdAt: "asc" } });
        return { ...mapCart(cart), items: items.map(mapItem) };
    }
    async getOrCreateForAnonymous(anonymousId) {
        let cart = await prisma.cart.findFirst({ where: { anonymousId } });
        if (!cart) {
            try {
                cart = await prisma.cart.create({
                    data: { anonymousId, status: "ACTIVE" },
                });
                eventBus.emit("cart.created", { anonymousId, cartId: cart.id, type: "guest" });
            }
            catch (e) {
                // Unique anonymous_id may conflict in race; fallback to find
                cart = await prisma.cart.findFirst({ where: { anonymousId } });
                if (!cart)
                    throw e;
            }
        }
        if (cart.status !== "ACTIVE") {
            // Reactivate if needed
            cart = await prisma.cart.update({ where: { id: cart.id }, data: { status: "ACTIVE" } });
        }
        const items = await prisma.cartItem.findMany({ where: { cartId: cart.id }, orderBy: { createdAt: "asc" } });
        return { ...mapCart(cart), items: items.map(mapItem) };
    }
    // ---------------- Item operations ----------------
    async addItem(cartId, input) {
        const qty = Math.max(1, Math.floor(input.quantity || 1));
        // Ensure cart exists and active
        const cart = await prisma.cart.findUnique({ where: { id: cartId } });
        if (!cart)
            throw new AppError("سبد خرید یافت نشد.", 404, "CART_NOT_FOUND");
        if (cart.status !== "ACTIVE")
            throw new AppError("سبد خرید فعال نیست.", 400, "CART_INACTIVE");
        const snap = await resolveSnapshot({ productId: input.productId, variantId: input.variantId || null });
        // Merge with existing same (productId, variantId)
        const item = await prisma.$transaction(async (tx) => {
            const existing = await tx.cartItem.findFirst({
                where: {
                    cartId,
                    productId: input.productId,
                    variantId: input.variantId || null,
                },
            });
            if (existing) {
                const newQty = existing.quantity + qty;
                const updated = await tx.cartItem.update({
                    where: { id: existing.id },
                    data: {
                        quantity: newQty,
                        unitPrice: snap.unitPrice, // keep unitPrice in sync with latest snapshot
                        lineTotal: lineTotal(snap.unitPrice, newQty),
                        title: snap.title,
                        variantName: snap.variantName,
                        imageUrl: snap.imageUrl,
                        currencyCode: snap.currencyCode,
                    },
                });
                return updated;
            }
            else {
                const created = await tx.cartItem.create({
                    data: {
                        cartId,
                        productId: input.productId,
                        variantId: input.variantId || null,
                        title: snap.title,
                        variantName: snap.variantName,
                        unitPrice: snap.unitPrice,
                        quantity: qty,
                        lineTotal: lineTotal(snap.unitPrice, qty),
                        currencyCode: snap.currencyCode,
                        imageUrl: snap.imageUrl,
                    },
                });
                return created;
            }
        });
        eventBus.emit("cart.item.added", {
            cartId,
            itemId: item.id,
            productId: input.productId,
            variantId: input.variantId || null,
            quantity: qty,
        });
        return mapItem(item);
    }
    async updateItem(cartId, itemId, input) {
        const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
        if (!item || item.cartId !== cartId)
            throw new AppError("آیتم سبد یافت نشد.", 404, "ITEM_NOT_FOUND");
        const qty = typeof input.quantity === "number" ? Math.floor(input.quantity) : item.quantity;
        if (qty <= 0) {
            await prisma.cartItem.delete({ where: { id: itemId } });
            eventBus.emit("cart.item.removed", { cartId, itemId });
            return { deleted: true };
        }
        const updated = await prisma.cartItem.update({
            where: { id: itemId },
            data: {
                quantity: qty,
                lineTotal: lineTotal(item.unitPrice, qty),
            },
        });
        eventBus.emit("cart.item.updated", { cartId, itemId, quantity: qty });
        return mapItem(updated);
    }
    async removeItem(cartId, itemId) {
        const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
        if (!item || item.cartId !== cartId)
            throw new AppError("آیتم سبد یافت نشد.", 404, "ITEM_NOT_FOUND");
        await prisma.cartItem.delete({ where: { id: itemId } });
        eventBus.emit("cart.item.removed", { cartId, itemId });
        return { deleted: true };
    }
    async clear(cartId) {
        const count = await prisma.cartItem.deleteMany({ where: { cartId } });
        eventBus.emit("cart.cleared", { cartId, count: count.count });
        return { cleared: count.count };
    }
    // ---------------- Quotes (no persistence) ----------------
    async quote(cartId, opts = {}) {
        // Delegates to pricing service which reads snapshot lines
        return pricingService.quoteCart(cartId, opts);
    }
    // ---------------- Merge flows ----------------
    /**
     * Merge a guest (anonymous) cart into a user's active cart on login.
     * - If no guest cart found, returns user's cart.
     * - Sums quantities for identical (productId, variantId).
     * - Deletes the guest cart after merging.
     */
    async mergeAnonymousIntoUser(userId, anonymousId) {
        const guest = await prisma.cart.findFirst({ where: { anonymousId, status: "ACTIVE" } });
        // Ensure user cart exists
        const userCart = await this.getOrCreateForUser(userId);
        if (!guest || guest.id === userCart.id) {
            return userCart;
        }
        await prisma.$transaction(async (tx) => {
            const guestItems = await tx.cartItem.findMany({ where: { cartId: guest.id } });
            if (guestItems.length) {
                // Prepare map for user cart items to merge quantities
                const existing = await tx.cartItem.findMany({ where: { cartId: userCart.id } });
                const key = (p, v) => `${p}::${v ?? "null"}`;
                const idx = new Map(existing.map((it) => [key(it.productId, it.variantId), it]));
                for (const gi of guestItems) {
                    const k = key(gi.productId, gi.variantId);
                    if (idx.has(k)) {
                        const cur = idx.get(k);
                        const newQty = cur.quantity + gi.quantity;
                        await tx.cartItem.update({
                            where: { id: cur.id },
                            data: {
                                quantity: newQty,
                                // keep cur.unitPrice (snapshot at time of cur add), recompute lineTotal
                                lineTotal: lineTotal(cur.unitPrice, newQty),
                            },
                        });
                    }
                    else {
                        // Move the item to user cart (re-parent)
                        await tx.cartItem.update({
                            where: { id: gi.id },
                            data: {
                                cartId: userCart.id,
                                // keep snapshot fields as-is
                            },
                        });
                    }
                }
            }
            // Mark/delete guest cart
            await tx.cart.delete({ where: { id: guest.id } });
        });
        eventBus.emit("cart.merged", {
            userId,
            anonymousId,
            targetCartId: userCart.id,
            sourceCartId: guest.id,
        });
        // Return fresh user cart
        return this.getOrCreateForUser(userId);
    }
    // ---------------- Status helpers ----------------
    async setStatus(cartId, status) {
        const cart = await prisma.cart.update({ where: { id: cartId }, data: { status } });
        eventBus.emit("cart.status.changed", { cartId, status });
        return mapCart(cart);
    }
}
export const cartService = new CartService();
//# sourceMappingURL=cart.service.js.map