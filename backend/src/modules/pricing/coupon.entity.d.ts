export type CouponType = "percent" | "amount" | "free_shipping";
export interface Coupon {
    id: string;
    code: string;
    type: CouponType;
    percentValue?: number | null;
    amountValue?: number | null;
    minSubtotal: number;
    maxUses?: number | null;
    maxUsesPerUser?: number | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CouponRedemption {
    id: string;
    couponId: string;
    userId?: string | null;
    orderId?: string | null;
    redeemedAt: Date;
}
export declare function mapDbCouponToEntity(row: any): Coupon;
export declare function mapDbCouponRedemptionToEntity(row: any): CouponRedemption;
export declare function normalizeCouponCode(code: string): string;
export declare function isWithinWindow(c: Coupon, at?: Date): boolean;
export declare function isCouponActive(c: Coupon, at?: Date): boolean;
export declare function remainingUses(globalRedemptions: number | undefined | null, c: Coupon): number;
export declare function remainingUserUses(userRedemptions: number | undefined | null, c: Coupon): number;
export type CouponFailReason = "INACTIVE" | "NOT_STARTED" | "EXPIRED" | "MIN_NOT_MET" | "USAGE_LIMIT_REACHED" | "USER_USAGE_LIMIT_REACHED" | "INVALID_DEFINITION";
export interface CouponCheckContext {
    subtotal: number;
    now?: Date;
    globalRedemptions?: number;
    userRedemptions?: number;
}
export interface CouponValidationResult {
    ok: boolean;
    reason?: CouponFailReason;
}
/**
 * Validate business constraints of a coupon for a given cart subtotal and usage counters.
 * This does not check existence or ownership; only logical rule checks.
 */
export declare function validateCoupon(c: Coupon, ctx: CouponCheckContext): CouponValidationResult;
export interface CouponEffect {
    discount: number;
    shippingDiscount: number;
}
/**
 * Compute the effect of a valid coupon on the provided amounts.
 * Assumes validateCoupon has already returned ok=true (but we also guard basic rules).
 */
export declare function computeCouponEffect(c: Coupon, args: {
    subtotal: number;
    shipping: number;
}): CouponEffect;
/**
 * High-level helper: check eligibility and compute effect in a single call.
 * Returns { ok, reason?, effect }.
 */
export declare function evaluateCoupon(c: Coupon, ctx: CouponCheckContext & {
    shipping: number;
}): CouponValidationResult & {
    effect: CouponEffect;
};
//# sourceMappingURL=coupon.entity.d.ts.map