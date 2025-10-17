// src/modules/pricing/coupon.entity.ts
// Domain types and helpers for coupons and their application to a cart/order quote.
// Matches your SQL schema (coupons, coupon_redemptions) with camelCase in the domain layer.
import logger from "../../config/logger.js";
// ---------------- Mapping ----------------
function toDate(v) {
    return v instanceof Date ? v : new Date(v);
}
export function mapDbCouponToEntity(row) {
    if (!row)
        throw new Error("mapDbCouponToEntity: row is required");
    // Normalize type to lowercase - CRITICAL FIX
    const rawType = (row.type ?? row.coupon_type ?? "percent").toString();
    const couponType = rawType.toLowerCase();
    // Map all snake_case fields from DB to camelCase
    const percentValue = row.percentValue ?? row.percent_value ?? null;
    const amountValue = row.amountValue ?? row.amount_value ?? null;
    const minSubtotal = row.minSubtotal ?? row.min_subtotal ?? 0;
    const maxUses = row.maxUses ?? row.max_uses ?? null;
    const maxUsesPerUser = row.maxUsesPerUser ?? row.max_uses_per_user ?? null;
    const isActive = row.isActive ?? row.is_active ?? true;
    return {
        id: row.id,
        code: (row.code ?? "").toString(),
        type: couponType,
        percentValue: typeof percentValue === "number" ? percentValue : null,
        amountValue: typeof amountValue === "number" ? amountValue : null,
        minSubtotal: typeof minSubtotal === "number" ? minSubtotal : 0,
        maxUses: typeof maxUses === "number" ? maxUses : null,
        maxUsesPerUser: typeof maxUsesPerUser === "number" ? maxUsesPerUser : null,
        startsAt: row.startsAt != null
            ? toDate(row.startsAt)
            : row.starts_at != null
                ? toDate(row.starts_at)
                : null,
        endsAt: row.endsAt != null ? toDate(row.endsAt) : row.ends_at != null ? toDate(row.ends_at) : null,
        isActive: Boolean(isActive),
        createdAt: toDate(row.createdAt ?? row.created_at),
        updatedAt: toDate(row.updatedAt ?? row.updated_at),
    };
}
export function mapDbCouponRedemptionToEntity(row) {
    if (!row)
        throw new Error("mapDbCouponRedemptionToEntity: row is required");
    return {
        id: row.id,
        couponId: row.couponId ?? row.coupon_id,
        userId: row.userId ?? row.user_id ?? null,
        orderId: row.orderId ?? row.order_id ?? null,
        redeemedAt: toDate(row.redeemedAt ?? row.redeemed_at),
    };
}
// ---------------- Helpers ----------------
export function normalizeCouponCode(code) {
    return (code || "").trim().toUpperCase();
}
export function isWithinWindow(c, at = new Date()) {
    if (c.startsAt && at < c.startsAt) {
        return false;
    }
    if (c.endsAt && at > c.endsAt) {
        return false;
    }
    return true;
}
export function isCouponActive(c, at = new Date()) {
    const active = c.isActive && isWithinWindow(c, at);
    return active;
}
export function remainingUses(globalRedemptions, c) {
    if (!c.maxUses || c.maxUses <= 0)
        return Number.POSITIVE_INFINITY;
    const used = Math.max(0, globalRedemptions || 0);
    const remaining = Math.max(0, c.maxUses - used);
    return remaining;
}
export function remainingUserUses(userRedemptions, c) {
    if (!c.maxUsesPerUser || c.maxUsesPerUser <= 0)
        return Number.POSITIVE_INFINITY;
    const used = Math.max(0, userRedemptions || 0);
    const remaining = Math.max(0, c.maxUsesPerUser - used);
    return remaining;
}
/**
 * Validate business constraints of a coupon for a given cart subtotal and usage counters.
 * This does not check existence or ownership; only logical rule checks.
 */
export function validateCoupon(c, ctx) {
    const now = ctx.now ?? new Date();
    // Check 1: isActive
    if (!c.isActive) {
        return { ok: false, reason: "INACTIVE" };
    }
    // Check 2: startsAt
    if (c.startsAt && now < c.startsAt) {
        return { ok: false, reason: "NOT_STARTED" };
    }
    // Check 3: endsAt
    if (c.endsAt && now > c.endsAt) {
        return { ok: false, reason: "EXPIRED" };
    }
    // Check 4: minSubtotal
    if (typeof c.minSubtotal === "number" && c.minSubtotal > 0 && ctx.subtotal < c.minSubtotal) {
        return { ok: false, reason: "MIN_NOT_MET" };
    }
    // Normalize type for validation
    const couponType = c.type.toLowerCase();
    // Check 5: Ensure definition is coherent
    if (couponType === "percent") {
        if (!(typeof c.percentValue === "number" && c.percentValue > 0 && c.percentValue <= 100)) {
            return { ok: false, reason: "INVALID_DEFINITION" };
        }
    }
    if (couponType === "amount") {
        if (!(typeof c.amountValue === "number" && c.amountValue > 0)) {
            return { ok: false, reason: "INVALID_DEFINITION" };
        }
    }
    // Check 6: maxUses (global usage limits)
    if (c.maxUses && c.maxUses > 0) {
        const rem = remainingUses(ctx.globalRedemptions, c);
        if (rem <= 0) {
            return { ok: false, reason: "USAGE_LIMIT_REACHED" };
        }
    }
    // Check 7: maxUsesPerUser (per-user usage limits)
    if (c.maxUsesPerUser && c.maxUsesPerUser > 0) {
        const remU = remainingUserUses(ctx.userRedemptions, c);
        if (remU <= 0) {
            return { ok: false, reason: "USER_USAGE_LIMIT_REACHED" };
        }
    }
    return { ok: true };
}
/**
 * Compute the effect of a valid coupon on the provided amounts.
 * Assumes validateCoupon has already returned ok=true (but we also guard basic rules).
 */
export function computeCouponEffect(c, args) {
    const subtotal = Math.max(0, Math.floor(args.subtotal || 0));
    const shipping = Math.max(0, Math.floor(args.shipping || 0));
    let discount = 0;
    let shippingDiscount = 0;
    // Normalize type to lowercase for comparison - CRITICAL FIX
    const couponType = c.type.toLowerCase();
    switch (couponType) {
        case "percent": {
            const pct = Math.min(100, Math.max(0, (c.percentValue ?? 0) | 0));
            discount = Math.floor((subtotal * pct) / 100);
            break;
        }
        case "amount": {
            const amt = Math.max(0, (c.amountValue ?? 0) | 0);
            discount = Math.min(amt, subtotal);
            break;
        }
        case "free_shipping": {
            shippingDiscount = shipping;
            break;
        }
        default:
            logger.warn(`[COUPON] Unknown coupon type: ${couponType}`);
    }
    // Guard: don't exceed subtotal for subtotal discounts
    discount = Math.min(discount, subtotal);
    return { discount, shippingDiscount };
}
/**
 * High-level helper: check eligibility and compute effect in a single call.
 * Returns { ok, reason?, effect }.
 */
export function evaluateCoupon(c, ctx) {
    const validation = validateCoupon(c, ctx);
    if (!validation.ok) {
        return { ...validation, effect: { discount: 0, shippingDiscount: 0 } };
    }
    const effect = computeCouponEffect(c, { subtotal: ctx.subtotal, shipping: ctx.shipping });
    return { ok: true, effect };
}
//# sourceMappingURL=coupon.entity.js.map