// src/modules/shipping/shipping.service.ts
// Shipping service: rate estimation (standard/express), region overrides,
// cart/order quotes (delegating to pricing.service), and simple label/tracking stubs.
//
// Notes:
// - DB schema has shipping_method_enum on orders, but no shipping label table.
//   We return label/tracking objects without persistence (emit events/logs for downstream).
// - Rates mirror frontend defaults and pricing.service env keys.
// - Region overrides allow per-province adjustments via multiplier/extra.
//
// ENV:
//   PRICING_FREE_SHIP_THRESHOLD=1000000
//   PRICING_BASE_SHIPPING=45000
//   PRICING_EXPRESS_SURCHARGE=30000
//   SHIPPING_ESTIMATED_DAYS_STANDARD=2-4
//   SHIPPING_ESTIMATED_DAYS_EXPRESS=1-2
//   SHIPPING_REGION_OVERRIDES='[{"province":"tehran","multiplier":1,"extra":0}]'
//   CURRENCY_DEFAULT=IRR
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../common/errors/AppError.js";
import { pricingService } from "../pricing/pricing.service.js";
// ---------- Config ----------
const FREE_SHIP_THRESHOLD = Number(env.PRICING_FREE_SHIP_THRESHOLD ?? 1_000_000);
const BASE_SHIPPING = Number(env.PRICING_BASE_SHIPPING ?? 45_000);
const EXPRESS_SURCHARGE = Number(env.PRICING_EXPRESS_SURCHARGE ?? 30_000);
const DEFAULT_CURRENCY = String(env.CURRENCY_DEFAULT ?? "IRR");
const ETA_STD = String(env.SHIPPING_ESTIMATED_DAYS_STANDARD ?? "2-4");
const ETA_EXP = String(env.SHIPPING_ESTIMATED_DAYS_EXPRESS ?? "1-2");
function parseOverrides() {
    try {
        const raw = env.SHIPPING_REGION_OVERRIDES;
        if (!raw)
            return [];
        const arr = JSON.parse(String(raw));
        if (!Array.isArray(arr))
            return [];
        return arr
            .map((o) => {
            const r = {};
            if (o?.province)
                r.province = String(o.province).toLowerCase().trim();
            if (Number.isFinite(Number(o?.multiplier)))
                r.multiplier = Number(o.multiplier);
            if (Number.isFinite(Number(o?.extra)))
                r.extra = Number(o.extra);
            return r;
        })
            .filter((o) => o.province !== undefined);
    }
    catch (e) {
        logger.warn({ err: e }, "Failed to parse SHIPPING_REGION_OVERRIDES; ignoring.");
        return [];
    }
}
const REGION_OVERRIDES = parseOverrides();
function normalizeProvince(p) {
    return (p || "").toLowerCase().trim() || undefined;
}
function applyRegion(base, province) {
    const key = normalizeProvince(province);
    if (!key)
        return base;
    const ov = REGION_OVERRIDES.find((o) => o.province === key);
    if (!ov)
        return base;
    const mult = typeof ov.multiplier === "number" ? ov.multiplier : 1;
    const extra = typeof ov.extra === "number" ? ov.extra : 0;
    const val = Math.max(0, Math.floor(base * mult + extra));
    return val;
}
function clampInt(n) {
    return Math.max(0, Math.floor(n || 0));
}
function etaFor(method) {
    return method === "express" ? ETA_EXP : ETA_STD;
}
// ---------- Core compute ----------
function computeBaseShipping(subtotal, province, couponFreeShip) {
    if (couponFreeShip)
        return 0;
    if (subtotal >= FREE_SHIP_THRESHOLD)
        return 0;
    const regional = applyRegion(BASE_SHIPPING, province);
    return clampInt(regional);
}
function buildRateQuote(args) {
    const base = computeBaseShipping(args.subtotal, args.province, !!args.couponFreeShip);
    const surcharge = args.method === "express" ? clampInt(EXPRESS_SURCHARGE) : 0;
    const amount = clampInt(base + surcharge);
    return {
        method: args.method,
        amount,
        currencyCode: args.currencyCode || DEFAULT_CURRENCY,
        eta: etaFor(args.method),
        free: amount === 0,
        base,
        surcharge,
    };
}
/**
 * Compute standard/express quotes using only subtotal and destination province.
 * Useful for fast frontend previews.
 */
function quoteForSubtotal(subtotal, addr, opts) {
    const province = addr?.province;
    const currency = opts?.currencyCode || DEFAULT_CURRENCY;
    const standard = buildRateQuote({
        method: "standard",
        subtotal,
        province,
        couponFreeShip: opts?.couponFreeShip,
        currencyCode: currency,
    });
    const express = buildRateQuote({
        method: "express",
        subtotal,
        province,
        couponFreeShip: opts?.couponFreeShip,
        currencyCode: currency,
    });
    return { standard, express };
}
// ---------- Service ----------
class ShippingService {
    /**
     * Quote for a cart by id using pricing.service totals.
     * Returns both methods (standard/express) as RateQuote.
     */
    async quoteCart(cartId, addr, opts) {
        // Use pricing to get consistent subtotal (before discount)
        const pr = await pricingService.quoteCart(cartId, {
            shippingMethod: "standard", // method doesn't matter for subtotal
            giftWrap: false,
        });
        const quotes = quoteForSubtotal(pr.subtotal, addr, opts);
        return { ...quotes, subtotal: pr.subtotal };
    }
    /**
     * Quote for ad-hoc lines via pricing.service or supplied subtotal.
     * If subtotal is provided, uses subtotal; otherwise compute via pricing for zero shipping/gift.
     */
    async quoteLinesOrSubtotal(args) {
        let subtotal = clampInt(args.subtotal || 0);
        if (!subtotal && args.linesQuote)
            subtotal = clampInt(args.linesQuote.subtotal);
        if (!subtotal && !args.linesQuote) {
            // As a fallback, return base rates
            subtotal = 0;
        }
        const opts = {};
        if (args.couponFreeShip !== undefined)
            opts.couponFreeShip = args.couponFreeShip;
        if (args.currencyCode !== undefined)
            opts.currencyCode = args.currencyCode;
        return quoteForSubtotal(subtotal, args.address, opts);
    }
    /**
     * Simple helper to return the shipping part of a pricing quote as RateQuote.
     */
    fromPricingQuote(quote, method, addr) {
        const base = computeBaseShipping(quote.postSubtotal, addr?.province, quote.appliedCoupon?.ok && quote.appliedCoupon.effect?.shippingDiscount ? true : false);
        const surcharge = method === "express" ? clampInt(EXPRESS_SURCHARGE) : 0;
        return {
            method,
            amount: clampInt(quote.shipping),
            currencyCode: quote.currencyCode,
            eta: etaFor(method),
            free: quote.shipping === 0,
            base,
            surcharge,
        };
    }
    /**
     * Generate a shipping label stub and tracking number for an order.
     * This does not persist (no table available); downstream systems can listen to the event and store externally.
     */
    async createShipmentLabel(orderId, carrier = "local-post") {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                shippingFirstName: true,
                shippingLastName: true,
                shippingPhone: true,
                shippingProvince: true,
                shippingCity: true,
                shippingPostalCode: true,
            },
        });
        if (!order)
            throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
        const trackingNumber = this.generateTrackingNumber(carrier);
        const label = {
            id: `LBL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            carrier,
            trackingNumber,
            labelUrl: undefined, // plug a real label URL if you integrate a provider
            createdAt: new Date().toISOString(),
            to: {
                name: `${order.shippingFirstName} ${order.shippingLastName}`.trim(),
                phone: order.shippingPhone || undefined,
                province: order.shippingProvince || undefined,
                city: order.shippingCity || undefined,
                postalCode: order.shippingPostalCode || undefined,
            },
        };
        logger.info({ orderId, orderNumber: order.orderNumber, trackingNumber, carrier }, "Shipment label created (stub)");
        // Optionally emit an event like 'shipping.label.created' via eventBus if you add one.
        return label;
    }
    /**
     * Simple tracking info stub. Replace with a real carrier API integration.
     */
    async track(trackingNumber) {
        // This is a mock. In real integration, call carrier API here.
        const now = new Date();
        return {
            trackingNumber,
            status: "in_transit",
            lastUpdate: now.toISOString(),
            history: [
                { at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: "label_created" },
                { at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: "picked_up", location: "Origin Facility" },
                { at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: "in_transit", location: "Distribution Center" },
            ],
        };
    }
    generateTrackingNumber(carrier) {
        const prefix = carrier === "courier" ? "CR" : "LP";
        const rnd = Math.floor(1e9 + Math.random() * 9e9); // 10 digits
        return `${prefix}-${rnd}`;
    }
}
export const shippingService = new ShippingService();
//# sourceMappingURL=shipping.service.js.map