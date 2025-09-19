// src/modules/pricing/coupon.entity.ts
// Domain types and helpers for coupons and their application to a cart/order quote.
// Matches your SQL schema (coupons, coupon_redemptions) with camelCase in the domain layer.

export type CouponType = "percent" | "amount" | "free_shipping";

export interface Coupon {
  id: string;
  code: string; // unique, case-insensitive (we normalize to upper-case for comparison)
  type: CouponType;

  percentValue?: number | null; // 1..100 when type = 'percent'
  amountValue?: number | null;  // integer amount (in your money unit) when type = 'amount'

  minSubtotal: number;          // integer threshold (cart subtotal) to be eligible

  maxUses?: number | null;          // global cap across all users
  maxUsesPerUser?: number | null;   // per-user cap

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

// ---------------- Mapping ----------------

function toDate(v: any): Date {
  return v instanceof Date ? v : new Date(v);
}

export function mapDbCouponToEntity(row: any): Coupon {
  if (!row) throw new Error("mapDbCouponToEntity: row is required");

  return {
    id: row.id,
    code: (row.code ?? "").toString(),
    type: (row.type ?? row.coupon_type ?? "percent") as CouponType,

    percentValue: typeof row.percentValue === "number" ? row.percentValue : row.percent_value ?? null,
    amountValue: typeof row.amountValue === "number" ? row.amountValue : row.amount_value ?? null,

    minSubtotal: typeof row.minSubtotal === "number" ? row.minSubtotal : row.min_subtotal ?? 0,

    maxUses: typeof row.maxUses === "number" ? row.maxUses : row.max_uses ?? null,
    maxUsesPerUser:
      typeof row.maxUsesPerUser === "number" ? row.maxUsesPerUser : row.max_uses_per_user ?? null,

    startsAt:
      row.startsAt != null
        ? toDate(row.startsAt)
        : row.starts_at != null
        ? toDate(row.starts_at)
        : null,
    endsAt:
      row.endsAt != null ? toDate(row.endsAt) : row.ends_at != null ? toDate(row.ends_at) : null,

    isActive: Boolean(row.isActive ?? row.is_active ?? true),

    createdAt: toDate(row.createdAt ?? row.created_at),
    updatedAt: toDate(row.updatedAt ?? row.updated_at),
  };
}

export function mapDbCouponRedemptionToEntity(row: any): CouponRedemption {
  if (!row) throw new Error("mapDbCouponRedemptionToEntity: row is required");
  return {
    id: row.id,
    couponId: row.couponId ?? row.coupon_id,
    userId: row.userId ?? row.user_id ?? null,
    orderId: row.orderId ?? row.order_id ?? null,
    redeemedAt: toDate(row.redeemedAt ?? row.redeemed_at),
  };
}

// ---------------- Helpers ----------------

export function normalizeCouponCode(code: string): string {
  return (code || "").trim().toUpperCase();
}

export function isWithinWindow(c: Coupon, at: Date = new Date()): boolean {
  if (c.startsAt && at < c.startsAt) return false;
  if (c.endsAt && at > c.endsAt) return false;
  return true;
}

export function isCouponActive(c: Coupon, at: Date = new Date()): boolean {
  return c.isActive && isWithinWindow(c, at);
}

export function remainingUses(globalRedemptions: number | undefined | null, c: Coupon): number {
  if (!c.maxUses || c.maxUses <= 0) return Number.POSITIVE_INFINITY;
  const used = Math.max(0, globalRedemptions || 0);
  return Math.max(0, c.maxUses - used);
}

export function remainingUserUses(userRedemptions: number | undefined | null, c: Coupon): number {
  if (!c.maxUsesPerUser || c.maxUsesPerUser <= 0) return Number.POSITIVE_INFINITY;
  const used = Math.max(0, userRedemptions || 0);
  return Math.max(0, c.maxUsesPerUser - used);
}

export type CouponFailReason =
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "MIN_NOT_MET"
  | "USAGE_LIMIT_REACHED"
  | "USER_USAGE_LIMIT_REACHED"
  | "INVALID_DEFINITION";

export interface CouponCheckContext {
  subtotal: number;                // cart subtotal before shipping/discounts
  now?: Date;                      // default: new Date()
  globalRedemptions?: number;      // count of all redemptions for this coupon
  userRedemptions?: number;        // count of redemptions by this user
}

export interface CouponValidationResult {
  ok: boolean;
  reason?: CouponFailReason;
}

/**
 * Validate business constraints of a coupon for a given cart subtotal and usage counters.
 * This does not check existence or ownership; only logical rule checks.
 */
export function validateCoupon(c: Coupon, ctx: CouponCheckContext): CouponValidationResult {
  const now = ctx.now ?? new Date();

  if (!c.isActive) return { ok: false, reason: "INACTIVE" };
  if (c.startsAt && now < c.startsAt) return { ok: false, reason: "NOT_STARTED" };
  if (c.endsAt && now > c.endsAt) return { ok: false, reason: "EXPIRED" };

  if (typeof c.minSubtotal === "number" && ctx.subtotal < c.minSubtotal) {
    return { ok: false, reason: "MIN_NOT_MET" };
  }

  // Ensure definition is coherent
  if (c.type === "percent" && !(typeof c.percentValue === "number" && c.percentValue > 0 && c.percentValue <= 100)) {
    return { ok: false, reason: "INVALID_DEFINITION" };
  }
  if (c.type === "amount" && !(typeof c.amountValue === "number" && c.amountValue >= 0)) {
    return { ok: false, reason: "INVALID_DEFINITION" };
  }

  // Usage limits
  if (c.maxUses && c.maxUses > 0) {
    const rem = remainingUses(ctx.globalRedemptions, c);
    if (rem <= 0) return { ok: false, reason: "USAGE_LIMIT_REACHED" };
  }
  if (c.maxUsesPerUser && c.maxUsesPerUser > 0) {
    const remU = remainingUserUses(ctx.userRedemptions, c);
    if (remU <= 0) return { ok: false, reason: "USER_USAGE_LIMIT_REACHED" };
  }

  return { ok: true };
}

export interface CouponEffect {
  discount: number;         // amount discounted from subtotal
  shippingDiscount: number; // amount discounted from shipping (only for free_shipping)
}

/**
 * Compute the effect of a valid coupon on the provided amounts.
 * Assumes validateCoupon has already returned ok=true (but we also guard basic rules).
 */
export function computeCouponEffect(
  c: Coupon,
  args: { subtotal: number; shipping: number }
): CouponEffect {
  const subtotal = Math.max(0, Math.floor(args.subtotal || 0));
  const shipping = Math.max(0, Math.floor(args.shipping || 0));
  let discount = 0;
  let shippingDiscount = 0;

  switch (c.type) {
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
      shippingDiscount = shipping; // make shipping free
      break;
    }
  }

  // Guard: don't exceed subtotal for subtotal discounts
  discount = Math.min(discount, subtotal);

  return { discount, shippingDiscount };
}

/**
 * High-level helper: check eligibility and compute effect in a single call.
 * Returns { ok, reason?, effect }.
 */
export function evaluateCoupon(
  c: Coupon,
  ctx: CouponCheckContext & { shipping: number }
): CouponValidationResult & { effect: CouponEffect } {
  const validation = validateCoupon(c, ctx);
  if (!validation.ok) {
    return { ...validation, effect: { discount: 0, shippingDiscount: 0 } };
  }
  const effect = computeCouponEffect(c, { subtotal: ctx.subtotal, shipping: ctx.shipping });
  return { ok: true, effect };
}