// src/modules/pricing/tax.service.ts
// Simple, configurable VAT/Tax calculator for quotes, carts, and orders.
// Defaults are tailored for IR market, but can be adjusted via ENV.
// - Supports tax-exclusive and tax-inclusive pricing
// - Optional region overrides per province/city/postal
// - Optional shipping taxability
//
// ENV (with defaults):
//   TAX_ENABLED=true|false
//   TAX_RATE_PERCENT=9
//   TAX_INCLUSIVE_PRICES=false
//   TAX_TAXABLE_SHIPPING=true
//   TAX_COUNTRY_DEFAULT=IR
//   TAX_REGION_OVERRIDES='[{"country":"IR","province":"Tehran","rate":9}]'  (JSON array; see RegionOverride type)
//   CURRENCY_DEFAULT=IRR
//
// Note: The service is stateless and safe to reuse. It does not persist any tax data.
//       Integrate with pricing.service by calling computeForLines and adding the tax totals to your quote.
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
const TAX_ENABLED = String(env.TAX_ENABLED ?? "true") === "true";
const DEFAULT_RATE = Number(env.TAX_RATE_PERCENT ?? 9); // IR VAT ~9%
const PRICES_INCLUDE_TAX =
  String(env.TAX_INCLUSIVE_PRICES ?? "false") === "true";
const SHIPPING_TAXABLE = String(env.TAX_TAXABLE_SHIPPING ?? "true") === "true";
const COUNTRY_DEFAULT = String(env.TAX_COUNTRY_DEFAULT ?? "IR");
const DEFAULT_CURRENCY = String(env.CURRENCY_DEFAULT ?? "IRR");
function parseOverrides() {
  const raw = env.TAX_REGION_OVERRIDES;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((o) => ({
        country: o.country ? String(o.country).toUpperCase() : undefined,
        province: o.province ? String(o.province).toLowerCase() : undefined,
        city: o.city ? String(o.city).toLowerCase() : undefined,
        postalPrefix: o.postalPrefix ? String(o.postalPrefix) : undefined,
        rate: Number(o.rate),
      }))
      .filter((o) => Number.isFinite(o.rate) && o.rate >= 0);
  } catch (e) {
    logger.warn({ err: e }, "Failed to parse TAX_REGION_OVERRIDES; ignoring.");
    return [];
  }
}
const REGION_OVERRIDES = parseOverrides();
// ---------- Helpers ----------
function normalizeRegionKey(s, mode = "area") {
  if (!s) return undefined;
  return mode === "country" ? s.toUpperCase() : s.toLowerCase();
}
function roundMoney(n) {
  // Consistent integer rounding. We use Math.floor to match other totals that clamp.
  // If you need half-up rounding, replace with: Math.round(n)
  return Math.max(0, Math.floor(n));
}
/**
 * Split a tax-inclusive gross amount into net and tax portions for a given rate.
 * gross = net * (1 + rate/100)
 */
function splitInclusive(gross, ratePct) {
  if (ratePct <= 0) return { net: roundMoney(gross), tax: 0 };
  const divisor = 1 + ratePct / 100;
  const net = roundMoney(gross / divisor);
  const tax = roundMoney(gross - net);
  return { net, tax };
}
/**
 * Compute tax on an exclusive base at ratePct.
 */
function taxOnExclusive(base, ratePct) {
  return roundMoney((base * ratePct) / 100);
}
function resolveRate(ctx) {
  const country = normalizeRegionKey(
    ctx?.country ?? COUNTRY_DEFAULT,
    "country"
  );
  const province = normalizeRegionKey(ctx?.province);
  const city = normalizeRegionKey(ctx?.city);
  const postal = (ctx?.postalCode || "").trim();
  // Match order: (country+province+city+postalPrefix) -> (country+province+postalPrefix) -> (country+province+city) -> (country+province) ->
  //               (country+city) -> (country) -> default
  // Postal prefix match is startsWith on postalCode.
  const candidates = REGION_OVERRIDES.filter(
    (o) => !o.country || o.country === country
  );
  // Highest specificity: province + city + postalPrefix
  let match =
    candidates.find(
      (o) =>
        (!!o.province ? o.province === province : true) &&
        (!!o.city ? o.city === city : true) &&
        (!!o.postalPrefix ? postal.startsWith(o.postalPrefix) : true)
    ) ||
    // province + postalPrefix
    candidates.find(
      (o) =>
        (!!o.province ? o.province === province : true) &&
        !o.city &&
        (!!o.postalPrefix ? postal.startsWith(o.postalPrefix) : true)
    ) ||
    // province + city
    candidates.find(
      (o) =>
        (!!o.province ? o.province === province : true) &&
        (!!o.city ? o.city === city : true) &&
        !o.postalPrefix
    ) ||
    // province only
    candidates.find(
      (o) =>
        (!!o.province ? o.province === province : true) &&
        !o.city &&
        !o.postalPrefix
    ) ||
    // city only
    candidates.find(
      (o) =>
        !o.province && (!!o.city ? o.city === city : true) && !o.postalPrefix
    ) ||
    // country only
    candidates.find(
      (o) =>
        !!o.country &&
        o.country === country &&
        !o.province &&
        !o.city &&
        !o.postalPrefix
    );
  return Number.isFinite(match?.rate) ? match.rate : DEFAULT_RATE;
}
function effectiveFlags(ctx) {
  return {
    include:
      typeof ctx?.pricesIncludeTax === "boolean"
        ? !!ctx?.pricesIncludeTax
        : PRICES_INCLUDE_TAX,
    shipTax:
      typeof ctx?.shippingTaxable === "boolean"
        ? !!ctx?.shippingTaxable
        : SHIPPING_TAXABLE,
  };
}
function lineAmount(l) {
  if (typeof l.lineTotal === "number") return roundMoney(l.lineTotal);
  const qty = Math.max(1, Math.floor(l.quantity ?? 1));
  return roundMoney((l.unitPrice ?? 0) * qty);
}
// ---------- Service ----------
class TaxService {
  /**
   * Resolve tax rate for the given region context.
   */
  getRate(ctx) {
    if (!TAX_ENABLED) return 0;
    return resolveRate(ctx);
  }
  /**
   * Compute line-level taxes for provided lines and shipping amount.
   * - If pricesIncludeTax=true, each lineTotal is treated as gross; we split into net+tax.
   * - If pricesIncludeTax=false, we compute tax on the base (exclusive) amount.
   */
  computeForLines(input, ctx) {
    const currencyCode = ctx?.currencyCode || DEFAULT_CURRENCY;
    if (!TAX_ENABLED || ctx?.taxExempt) {
      // Zero tax path
      const zeroLines = (input.lines || []).map((l) => ({
        id: l.id,
        base: lineAmount(l),
        ratePct: 0,
        tax: 0,
      }));
      return {
        lineTaxes: zeroLines,
        shippingTax: 0,
        taxTotal: 0,
        rateApplied: 0,
        pricesIncludeTax: !!ctx?.pricesIncludeTax ?? PRICES_INCLUDE_TAX,
        shippingTaxable: !!ctx?.shippingTaxable ?? SHIPPING_TAXABLE,
        currencyCode,
      };
    }
    const ratePct = this.getRate(ctx);
    const { include, shipTax } = effectiveFlags(ctx);
    const lineTaxes = [];
    for (const l of input.lines || []) {
      const amount = lineAmount(l);
      if (include) {
        const { net, tax } = splitInclusive(amount, ratePct);
        lineTaxes.push({ id: l.id, base: net, ratePct, tax });
      } else {
        const tax = taxOnExclusive(amount, ratePct);
        lineTaxes.push({ id: l.id, base: amount, ratePct, tax });
      }
    }
    const shippingAmount = roundMoney(input.shippingAmount || 0);
    let shippingTax = 0;
    if (shipTax && shippingAmount > 0) {
      if (include) {
        // shipping amount is also gross if prices include tax; split it
        const { tax } = splitInclusive(shippingAmount, ratePct);
        shippingTax = tax;
      } else {
        shippingTax = taxOnExclusive(shippingAmount, ratePct);
      }
    }
    const taxTotal = roundMoney(
      lineTaxes.reduce((a, c) => a + c.tax, 0) + shippingTax
    );
    return {
      lineTaxes,
      shippingTax,
      taxTotal,
      rateApplied: ratePct,
      pricesIncludeTax: include,
      shippingTaxable: shipTax,
      currencyCode,
    };
  }
  /**
   * Compute taxes for a cart by ID using snapshot fields in cart_items.
   * You can pass shippingAmount if you already computed it in pricing.service.
   */
  async computeForCart(cartId, opts) {
    const items = await prisma.cartItem.findMany({
      where: { cartId },
      select: { id: true, unitPrice: true, quantity: true },
      orderBy: { createdAt: "asc" },
    });
    const lines = items.map((it) => ({
      id: it.id,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
    }));
    return this.computeForLines(
      { lines, shippingAmount: opts?.shippingAmount ?? 0 },
      opts?.ctx
    );
  }
  /**
   * Compute tax on a single exclusive amount (utility).
   */
  taxOnExclusive(amount, ctx) {
    if (!TAX_ENABLED || ctx?.taxExempt) return 0;
    const rate = this.getRate(ctx);
    return taxOnExclusive(roundMoney(amount), rate);
  }
  /**
   * Given a gross (tax-inclusive) amount, split to net and tax (utility).
   */
  splitInclusive(amount, ctx) {
    if (!TAX_ENABLED || ctx?.taxExempt)
      return { net: roundMoney(amount), tax: 0 };
    const rate = this.getRate(ctx);
    return splitInclusive(roundMoney(amount), rate);
  }
}
export const taxService = new TaxService();
//# sourceMappingURL=tax.service.js.map
