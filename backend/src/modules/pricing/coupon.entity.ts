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

  // Normalize type to lowercase - CRITICAL FIX
  const rawType = (row.type ?? row.coupon_type ?? "percent").toString();
  const couponType = rawType.toLowerCase() as CouponType;

  // Map all snake_case fields from DB to camelCase
  const percentValue = row.percentValue ?? row.percent_value ?? null;
  const amountValue = row.amountValue ?? row.amount_value ?? null;
  const minSubtotal = row.minSubtotal ?? row.min_subtotal ?? 0;
  const maxUses = row.maxUses ?? row.max_uses ?? null;
  const maxUsesPerUser = row.maxUsesPerUser ?? row.max_uses_per_user ?? null;
  const isActive = row.isActive ?? row.is_active ?? true;

  console.log('[MAPPER] Mapping coupon from DB:', {
    code: row.code,
    rawType,
    normalizedType: couponType,
    percentValue,
    amountValue,
    minSubtotal,
    maxUses,
    maxUsesPerUser,
    startsAt: row.starts_at || row.startsAt,
    endsAt: row.ends_at || row.endsAt,
    isActive
  });

  return {
    id: row.id,
    code: (row.code ?? "").toString(),
    type: couponType,

    percentValue: typeof percentValue === "number" ? percentValue : null,
    amountValue: typeof amountValue === "number" ? amountValue : null,

    minSubtotal: typeof minSubtotal === "number" ? minSubtotal : 0,

    maxUses: typeof maxUses === "number" ? maxUses : null,
    maxUsesPerUser: typeof maxUsesPerUser === "number" ? maxUsesPerUser : null,

    startsAt:
      row.startsAt != null
        ? toDate(row.startsAt)
        : row.starts_at != null
        ? toDate(row.starts_at)
        : null,
    endsAt:
      row.endsAt != null ? toDate(row.endsAt) : row.ends_at != null ? toDate(row.ends_at) : null,

    isActive: Boolean(isActive),

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
  if (c.startsAt && at < c.startsAt) {
    console.log('[COUPON] Not started yet:', { startsAt: c.startsAt, now: at });
    return false;
  }
  if (c.endsAt && at > c.endsAt) {
    console.log('[COUPON] Expired:', { endsAt: c.endsAt, now: at });
    return false;
  }
  return true;
}

export function isCouponActive(c: Coupon, at: Date = new Date()): boolean {
  const active = c.isActive && isWithinWindow(c, at);
  console.log('[COUPON] Active check:', { 
    code: c.code, 
    isActive: c.isActive, 
    inWindow: isWithinWindow(c, at), 
    result: active 
  });
  return active;
}

export function remainingUses(globalRedemptions: number | undefined | null, c: Coupon): number {
  if (!c.maxUses || c.maxUses <= 0) return Number.POSITIVE_INFINITY;
  const used = Math.max(0, globalRedemptions || 0);
  const remaining = Math.max(0, c.maxUses - used);
  console.log('[COUPON] Global uses:', { maxUses: c.maxUses, used, remaining });
  return remaining;
}

export function remainingUserUses(userRedemptions: number | undefined | null, c: Coupon): number {
  if (!c.maxUsesPerUser || c.maxUsesPerUser <= 0) return Number.POSITIVE_INFINITY;
  const used = Math.max(0, userRedemptions || 0);
  const remaining = Math.max(0, c.maxUsesPerUser - used);
  console.log('[COUPON] User uses:', { maxUsesPerUser: c.maxUsesPerUser, used, remaining });
  return remaining;
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

  console.log('[COUPON] Validating coupon:', {
    code: c.code,
    type: c.type,
    isActive: c.isActive,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    minSubtotal: c.minSubtotal,
    cartSubtotal: ctx.subtotal,
    maxUses: c.maxUses,
    globalRedemptions: ctx.globalRedemptions,
    maxUsesPerUser: c.maxUsesPerUser,
    userRedemptions: ctx.userRedemptions,
    now
  });

  // Check 1: isActive
  if (!c.isActive) {
    console.log('[COUPON] Validation failed: INACTIVE');
    return { ok: false, reason: "INACTIVE" };
  }

  // Check 2: startsAt
  if (c.startsAt && now < c.startsAt) {
    console.log('[COUPON] Validation failed: NOT_STARTED', { startsAt: c.startsAt, now });
    return { ok: false, reason: "NOT_STARTED" };
  }

  // Check 3: endsAt
  if (c.endsAt && now > c.endsAt) {
    console.log('[COUPON] Validation failed: EXPIRED', { endsAt: c.endsAt, now });
    return { ok: false, reason: "EXPIRED" };
  }

  // Check 4: minSubtotal
  if (typeof c.minSubtotal === "number" && c.minSubtotal > 0 && ctx.subtotal < c.minSubtotal) {
    console.log('[COUPON] Validation failed: MIN_NOT_MET', { 
      required: c.minSubtotal, 
      actual: ctx.subtotal,
      shortage: c.minSubtotal - ctx.subtotal
    });
    return { ok: false, reason: "MIN_NOT_MET" };
  }

  // Normalize type for validation
  const couponType = c.type.toLowerCase();

  // Check 5: Ensure definition is coherent
  if (couponType === "percent") {
    if (!(typeof c.percentValue === "number" && c.percentValue > 0 && c.percentValue <= 100)) {
      console.log('[COUPON] Validation failed: INVALID_DEFINITION (percent)', { percentValue: c.percentValue });
      return { ok: false, reason: "INVALID_DEFINITION" };
    }
  }
  
  if (couponType === "amount") {
    if (!(typeof c.amountValue === "number" && c.amountValue > 0)) {
      console.log('[COUPON] Validation failed: INVALID_DEFINITION (amount)', { amountValue: c.amountValue });
      return { ok: false, reason: "INVALID_DEFINITION" };
    }
  }

  // Check 6: maxUses (global usage limits)
  if (c.maxUses && c.maxUses > 0) {
    const rem = remainingUses(ctx.globalRedemptions, c);
    if (rem <= 0) {
      console.log('[COUPON] Validation failed: USAGE_LIMIT_REACHED', { 
        maxUses: c.maxUses, 
        used: ctx.globalRedemptions 
      });
      return { ok: false, reason: "USAGE_LIMIT_REACHED" };
    }
  }

  // Check 7: maxUsesPerUser (per-user usage limits)
  if (c.maxUsesPerUser && c.maxUsesPerUser > 0) {
    const remU = remainingUserUses(ctx.userRedemptions, c);
    if (remU <= 0) {
      console.log('[COUPON] Validation failed: USER_USAGE_LIMIT_REACHED', { 
        maxUsesPerUser: c.maxUsesPerUser, 
        used: ctx.userRedemptions 
      });
      return { ok: false, reason: "USER_USAGE_LIMIT_REACHED" };
    }
  }

  console.log('[COUPON] Validation passed ✓');
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

  // Normalize type to lowercase for comparison - CRITICAL FIX
  const couponType = c.type.toLowerCase();

  console.log('[COUPON] Computing effect for:', {
    code: c.code,
    originalType: c.type,
    normalizedType: couponType,
    percentValue: c.percentValue,
    amountValue: c.amountValue,
    subtotal,
    shipping
  });

  switch (couponType) {
    case "percent": {
      const pct = Math.min(100, Math.max(0, (c.percentValue ?? 0) | 0));
      console.log('[COUPON] Percent calculation:', { 
        percentValue: c.percentValue,
        normalizedPct: pct,
        subtotal,
        formula: `${subtotal} * ${pct} / 100`
      });
      discount = Math.floor((subtotal * pct) / 100);
      console.log('[COUPON] Calculated percent discount:', discount);
      break;
    }
    case "amount": {
      const amt = Math.max(0, (c.amountValue ?? 0) | 0);
      discount = Math.min(amt, subtotal);
      console.log('[COUPON] Amount discount:', { 
        amountValue: c.amountValue,
        requestedDiscount: amt,
        appliedDiscount: discount,
        capped: amt > subtotal
      });
      break;
    }
    case "free_shipping": {
      shippingDiscount = shipping;
      console.log('[COUPON] Free shipping discount:', { 
        originalShipping: shipping,
        shippingDiscount 
      });
      break;
    }
    default:
      console.warn('[COUPON] Unknown coupon type:', couponType);
  }

  // Guard: don't exceed subtotal for subtotal discounts
  discount = Math.min(discount, subtotal);

  console.log('[COUPON] Final effect:', { 
    discount, 
    shippingDiscount,
    finalSubtotal: subtotal - discount,
    finalShipping: shipping - shippingDiscount
  });

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
  console.log('[COUPON] Evaluating coupon:', { code: c.code, context: ctx });
  
  const validation = validateCoupon(c, ctx);
  if (!validation.ok) {
    console.log('[COUPON] Evaluation failed validation:', validation);
    return { ...validation, effect: { discount: 0, shippingDiscount: 0 } };
  }
  
  const effect = computeCouponEffect(c, { subtotal: ctx.subtotal, shipping: ctx.shipping });
  console.log('[COUPON] Evaluation success:', { ok: true, effect });
  
  return { ok: true, effect };
}