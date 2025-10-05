// src/modules/pricing/pricing.service.ts
// Pricing service: compute quotes for carts or ad-hoc line items, with coupon rules and shipping logic.
// Mirrors frontend constants and supports DB coupons (with optional sample fallbacks).
//
// Shipping rules (default; override via env):
// - Free shipping threshold: PRICING_FREE_SHIP_THRESHOLD (default 1,000,000)
// - Base shipping (standard): PRICING_BASE_SHIPPING (default 45,000)
// - Express surcharge: PRICING_EXPRESS_SURCHARGE (default 30,000)
// - Gift wrap: PRICING_GIFT_WRAP_PRICE (default 20,000)
//
// Coupon rules:
// - Reads coupons from DB by code (case-insensitive).
// - Validates window/usage/minSubtotal via evaluateCoupon.
// - Applies subtotal discount and/or shipping discount (free_shipping).
//   Note: shipping discount applies to the base shipping only (not the express surcharge).
//
// Totals formula:
//   subtotal = sum(unitPrice * qty)
//   discount = coupon subtotal discount (clamped to subtotal)
//   postSubtotal = subtotal - discount
//   shippingBase = postSubtotal >= freeShipThreshold ? 0 : baseShipping
//   shippingDiscount = min(shippingBase, coupon shipping discount)
//   shipping = (shippingBase - shippingDiscount) + (shippingMethod === "express" ? expressSurcharge : 0)
//   giftWrap = giftWrap ? giftWrapPrice : 0
//   tax = 0 (placeholder; integrate tax.service later if needed)
//   total = postSubtotal + shipping + giftWrap + tax
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { normalizeCouponCode, mapDbCouponToEntity, evaluateCoupon, isCouponActive, } from "./coupon.entity.js";
// Config from env
const FREE_SHIP_THRESHOLD = Number(env.PRICING_FREE_SHIP_THRESHOLD ?? 1_000_000);
const BASE_SHIPPING = Number(env.PRICING_BASE_SHIPPING ?? 45_000);
const EXPRESS_SURCHARGE = Number(env.PRICING_EXPRESS_SURCHARGE ?? 30_000);
const GIFT_WRAP_PRICE = Number(env.PRICING_GIFT_WRAP_PRICE ?? 20_000);
const DEFAULT_CURRENCY = String(env.CURRENCY_DEFAULT ?? "IRR");
const ENABLE_SAMPLE_COUPONS = String(env.PRICING_ENABLE_SAMPLE_COUPONS ?? "true") === "true";
// ---------- Sample fallback coupons (used if DB has none and feature enabled) ----------
function sampleCoupon(code) {
    const upper = normalizeCouponCode(code);
    const now = new Date();
    const base = {
        minSubtotal: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        startsAt: null,
        endsAt: null,
    };
    if (upper === "KOALAW10") {
        return {
            id: "sample-KOALAW10",
            code: upper,
            type: "percent",
            percentValue: 10,
            amountValue: null,
            minSubtotal: 0,
            maxUses: null,
            maxUsesPerUser: null,
            startsAt: null,
            endsAt: null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            ...base,
        };
    }
    if (upper === "WELCOME15") {
        return {
            id: "sample-WELCOME15",
            code: upper,
            type: "percent",
            percentValue: 15,
            amountValue: null,
            minSubtotal: 400_000,
            maxUses: null,
            maxUsesPerUser: null,
            startsAt: null,
            endsAt: null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            ...base,
        };
    }
    if (upper === "FREESHIP") {
        return {
            id: "sample-FREESHIP",
            code: upper,
            type: "free_shipping",
            percentValue: null,
            amountValue: null,
            minSubtotal: 0,
            maxUses: null,
            maxUsesPerUser: null,
            startsAt: null,
            endsAt: null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            ...base,
        };
    }
    return null;
}
// ---------- Helpers ----------
function sum(a, b) {
    return (a || 0) + (b || 0);
}
function pickCurrency(lines, fallback) {
    const fromLine = lines.find((l) => l.currencyCode)?.currencyCode;
    return fromLine || fallback || DEFAULT_CURRENCY;
}
async function loadCouponByCode(code) {
    const upper = normalizeCouponCode(code);
    const row = await prisma.coupon.findFirst({
        where: { code: { equals: upper, mode: "insensitive" } },
    });
    return row ? mapDbCouponToEntity(row) : null;
}
async function countCouponRedemptions(couponId, userId) {
    const [global, user] = await Promise.all([
        prisma.couponRedemption.count({ where: { couponId } }),
        userId ? prisma.couponRedemption.count({ where: { couponId, userId } }) : Promise.resolve(0),
    ]);
    return { global, user };
}
function normalizeMethod(method) {
    return method === "express" ? "express" : "standard";
}
// ---------- Core computation ----------
function computeFromLines(rawLines, opts, couponEffect) {
    const lines = rawLines.map((l) => ({
        ...l,
        unitPrice: Math.max(0, Math.floor(l.unitPrice || 0)),
        quantity: Math.max(1, Math.floor(l.quantity || 1)),
        lineTotal: Math.max(0, Math.floor(l.unitPrice || 0) * Math.max(1, Math.floor(l.quantity || 1))),
    }));
    const subtotal = lines.reduce((acc, l) => acc + l.lineTotal, 0);
    // Coupon subtotal discount (if any)
    const discount = Math.min(subtotal, Math.max(0, Math.floor(couponEffect?.discount || 0)));
    const postSubtotal = Math.max(0, subtotal - discount);
    // Shipping base after discount (threshold applies to postSubtotal)
    const shippingBase = postSubtotal >= FREE_SHIP_THRESHOLD ? 0 : BASE_SHIPPING;
    // Coupon shipping discount (only base shipping; surcharge unaffected)
    const shippingDiscount = Math.min(shippingBase, Math.max(0, Math.floor(couponEffect?.shippingDiscount || 0)));
    const method = normalizeMethod(opts.shippingMethod);
    const shipping = Math.max(0, shippingBase - shippingDiscount) + (method === "express" ? EXPRESS_SURCHARGE : 0);
    const giftWrap = opts.giftWrap ? GIFT_WRAP_PRICE : 0;
    const tax = 0; // integrate tax.service if needed
    const total = Math.max(0, postSubtotal + shipping + giftWrap + tax);
    return {
        lines,
        subtotal,
        discount,
        postSubtotal,
        shippingBase,
        shippingDiscount,
        shipping,
        giftWrap,
        tax,
        total,
        currencyCode: pickCurrency(lines, opts.currencyCode),
        freeShippingThreshold: FREE_SHIP_THRESHOLD,
        shippingMethod: method,
    };
}
// ---------- Service ----------
class PricingService {
    /**
     * Build a quote from a cart in DB.
     * Reads cart_items snapshot fields (title, variant_name, unit_price, image_url).
     */
    async quoteCart(cartId, opts = {}) {
        const items = await prisma.cartItem.findMany({
            where: { cartId },
            select: {
                id: true,
                productId: true,
                variantId: true,
                title: true,
                variantName: true,
                unitPrice: true,
                quantity: true,
                imageUrl: true,
                currencyCode: true,
            },
            orderBy: { createdAt: "asc" },
        });
        const lines = items.map((it) => ({
            id: it.id,
            productId: it.productId,
            variantId: it.variantId,
            title: it.title,
            variantName: it.variantName ?? null,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            lineTotal: it.unitPrice * it.quantity,
            imageUrl: it.imageUrl ?? null,
            currencyCode: it.currencyCode ?? undefined,
        }));
        return this.quoteLines(lines, opts);
    }
    /**
     * Build a quote from ad-hoc lines (e.g., direct checkout).
     */
    async quoteLines(lines, opts = {}) {
        let appliedCoupon;
        let effect;
        if (opts.couponCode) {
            const upper = normalizeCouponCode(opts.couponCode);
            let coupon = await loadCouponByCode(upper);
            if (!coupon && ENABLE_SAMPLE_COUPONS) {
                coupon = sampleCoupon(upper);
            }
            if (coupon && isCouponActive(coupon)) {
                // Evaluate against current subtotal and base shipping after discount
                const subtotal = lines.reduce((acc, l) => acc + Math.max(0, Math.floor(l.unitPrice || 0)) * Math.max(1, Math.floor(l.quantity || 1)), 0);
                // For shipping we pass current base shipping estimate (before knowing discount); we will recompute exact in computeFromLines
                // The evaluateCoupon just needs a shipping placeholder; we use BASE_SHIPPING or 0 based on threshold after discount.
                // We don't know discount yet; for conservative estimate, pass current base shipping by threshold on current subtotal (close enough).
                const prelimShippingBase = subtotal >= FREE_SHIP_THRESHOLD ? 0 : BASE_SHIPPING;
                const counts = coupon.id.startsWith("sample-")
                    ? { global: 0, user: 0 }
                    : await countCouponRedemptions(coupon.id, opts.userId || undefined);
                const evalRes = evaluateCoupon(coupon, {
                    subtotal,
                    shipping: prelimShippingBase,
                    globalRedemptions: counts.global,
                    userRedemptions: counts.user,
                });
                if (evalRes.ok) {
                    effect = { ...evalRes.effect };
                    appliedCoupon = { code: upper, ok: true, effect: { ...evalRes.effect }, id: coupon.id };
                }
                else {
                    if (evalRes.reason) {
                        appliedCoupon = { code: upper, ok: false, reason: evalRes.reason, id: coupon.id };
                    }
                    else {
                        appliedCoupon = { code: upper, ok: false, id: coupon.id };
                    }
                }
            }
            else if (coupon) {
                appliedCoupon = { code: upper, ok: false, reason: "INACTIVE", id: coupon.id };
            }
            else {
                appliedCoupon = { code: upper, ok: false, reason: "INVALID" };
            }
        }
        const result = computeFromLines(lines, opts, effect);
        if (appliedCoupon) {
            result.appliedCoupon = appliedCoupon;
        }
        return result;
    }
}
export const pricingService = new PricingService();
//# sourceMappingURL=pricing.service.js.map