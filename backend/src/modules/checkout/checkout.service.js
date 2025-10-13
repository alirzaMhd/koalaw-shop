// src/modules/checkout/checkout.service.ts
// Checkout orchestration: quote -> order creation -> payment initialization.
// Integrates pricing.service (totals), emits order.created event, and initializes payment gateway or COD.
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { eventBus } from "../../events/eventBus.js";
import { AppError } from "../../common/errors/AppError.js";
import { pricingService, } from "../pricing/pricing.service.js";
import { taxService } from "../pricing/tax.service.js";
import { toLatinDigits, normalizeIranPhone } from "../../common/utils/validation.js";
let stripeGateway = null;
let paypalGateway = null;
let zarinpalGateway = null;
try {
    const sg = require("../../infrastructure/payment/stripe.gateway");
    stripeGateway = sg?.stripeGateway ?? sg?.default ?? null;
}
catch { }
try {
    const pg = require("../../infrastructure/payment/paypal.gateway");
    paypalGateway = pg?.paypalGateway ?? pg?.default ?? null;
}
catch { }
try {
    const zg = require("../../infrastructure/payment/zarinpal.gateway");
    zarinpalGateway = zg?.zarinpalGateway ?? zg?.default ?? null;
}
catch { }
const COUNTRY_DEFAULT = String(env.TAX_COUNTRY_DEFAULT ?? "IR");
const ORDER_PREFIX = String(env.ORDER_PREFIX ?? "KL");
function cleanPhone(p) {
    return normalizeIranPhone(toLatinDigits(p));
}
function cleanPostal(s) {
    if (!s)
        return null;
    const d = toLatinDigits(s).replace(/\D/g, "");
    return d || null;
}
function ensureAddress(a) {
    const addr = {
        firstName: (a.firstName || "").trim(),
        lastName: (a.lastName || "").trim(),
        phone: cleanPhone(a.phone || ""),
        postalCode: cleanPostal(a.postalCode || "") || "",
        province: (a.province || "").trim(),
        city: (a.city || "").trim(),
        addressLine1: (a.addressLine1 || "").trim(),
        addressLine2: (a.addressLine2 || "") || "",
        country: (a.country || COUNTRY_DEFAULT).toUpperCase(),
    };
    if (!addr.firstName || !addr.lastName || !addr.phone || !addr.province || !addr.city || !addr.addressLine1) {
        throw new AppError("آدرس ناقص است.", 400, "BAD_ADDRESS");
    }
    return addr;
}
async function generateOrderNumber() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const base = `${ORDER_PREFIX}-${yyyy}${mm}${dd}`;
    for (let i = 0; i < 6; i++) {
        const suffix = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
        const orderNumber = `${base}-${suffix}`;
        const exists = await prisma.order.findFirst({ where: { orderNumber }, select: { id: true } });
        if (!exists)
            return orderNumber;
    }
    return `${base}-${Date.now().toString().slice(-6)}`;
}
function toTaxCtx(addr) {
    return {
        country: addr.country || null,
        province: addr.province,
        city: addr.city,
        ...(addr.postalCode ? { postalCode: addr.postalCode } : { postalCode: null }),
    };
}
class CheckoutService {
    async prepareQuote(cartId, opts = {}) {
        return pricingService.quoteCart(cartId, opts);
    }
    async createOrderFromCart(args) {
        const { cartId, userId, address, options } = args;
        const cart = await prisma.cart.findUnique({ where: { id: cartId }, select: { id: true, status: true } });
        if (!cart)
            throw new AppError("سبد خرید یافت نشد.", 404, "CART_NOT_FOUND");
        if (cart.status !== "ACTIVE")
            throw new AppError("سبد خرید فعال نیست.", 400, "CART_INACTIVE");
        const items = await prisma.cartItem.findMany({
            where: { cartId },
            orderBy: { createdAt: "asc" },
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
        });
        if (!items.length)
            throw new AppError("سبد خرید خالی است.", 400, "CART_EMPTY");
        const quote = await pricingService.quoteCart(cartId, {
            couponCode: options.couponCode ?? null,
            ...(options.shippingMethod !== undefined ? { shippingMethod: options.shippingMethod } : {}),
            ...(options.giftWrap !== undefined ? { giftWrap: options.giftWrap } : {}),
            ...(userId ? { userId } : {}),
        });
        const addr = ensureAddress(address);
        const orderNumber = await generateOrderNumber();
        const paymentMethod = options.paymentMethod;
        const dbPaymentMethod = paymentMethod === "cod" ? "COD" : "GATEWAY";
        const shippingMethodLower = options.shippingMethod === "express" ? "express" : "standard";
        const dbShippingMethod = shippingMethodLower === "express" ? "EXPRESS" : "STANDARD";
        const publicStatus = paymentMethod === "cod" ? "processing" : "awaiting_payment";
        const dbStatus = paymentMethod === "cod" ? "PROCESSING" : "AWAITING_PAYMENT";
        const currency = quote.currencyCode;
        const couponCode = (options.couponCode || "").trim();
        const appliedCouponCode = couponCode ? couponCode.toUpperCase() : null;
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    userId: userId || null,
                    status: dbStatus,
                    shippingMethod: dbShippingMethod,
                    paymentMethod: dbPaymentMethod,
                    couponCode: appliedCouponCode,
                    giftWrap: !!options.giftWrap,
                    note: options.note || null,
                    subtotal: quote.subtotal,
                    discountTotal: quote.discount,
                    shippingTotal: quote.shipping,
                    giftWrapTotal: quote.giftWrap,
                    total: quote.total,
                    currencyCode: currency,
                    shippingFirstName: addr.firstName,
                    shippingLastName: addr.lastName,
                    shippingPhone: addr.phone,
                    shippingPostalCode: addr.postalCode || null,
                    shippingProvince: addr.province,
                    shippingCity: addr.city,
                    shippingAddressLine1: addr.addressLine1,
                    shippingAddressLine2: addr.addressLine2 || null,
                    shippingCountry: addr.country,
                    placedAt: new Date(),
                },
            });
            if (items.length) {
                await tx.orderItem.createMany({
                    data: items.map((it, idx) => ({
                        orderId: order.id,
                        productId: it.productId || null,
                        variantId: it.variantId || null,
                        title: it.title,
                        variantName: it.variantName || null,
                        unitPrice: it.unitPrice,
                        quantity: it.quantity,
                        lineTotal: it.unitPrice * it.quantity,
                        currencyCode: it.currencyCode || currency,
                        imageUrl: it.imageUrl || null,
                        position: idx,
                    })),
                });
            }
            const payment = await tx.payment.create({
                data: {
                    orderId: order.id,
                    method: dbPaymentMethod,
                    status: "PENDING",
                    amount: quote.total,
                    currencyCode: currency,
                    authority: null,
                    transactionRef: null,
                    paidAt: null,
                },
            });
            await tx.cart.update({ where: { id: cartId }, data: { status: "CONVERTED" } });
            return { order, payment };
        });
        let paymentAuthority = null;
        let clientSecret;
        let approvalUrl;
        if (paymentMethod === "gateway") {
            const provider = (env.PAYMENT_PROVIDER || "stripe").toString().toLowerCase();
            if (provider === "stripe") {
                if (!stripeGateway) {
                    logger.error("Stripe gateway not configured.");
                    throw new AppError("پرداخت درگاه موقتاً در دسترس نیست.", 503, "PAYMENT_UNAVAILABLE");
                }
                const intent = await stripeGateway.createPaymentIntent({
                    amount: result.order.total,
                    currency,
                    metadata: { orderId: result.order.id, orderNumber },
                });
                clientSecret = intent.clientSecret;
                paymentAuthority = intent.id;
            }
            else if (provider === "paypal") {
                if (!paypalGateway) {
                    logger.error("PayPal gateway not configured.");
                    throw new AppError("پرداخت درگاه موقتاً در دسترس نیست.", 503, "PAYMENT_UNAVAILABLE");
                }
                const pp = await paypalGateway.createOrder({
                    amount: result.order.total,
                    currency,
                    returnUrl: args.returnUrl || `${env.APP_URL || ""}/payments/paypal/return`,
                    cancelUrl: args.cancelUrl || `${env.APP_URL || ""}/payments/paypal/cancel`,
                    metadata: { orderId: result.order.id, orderNumber },
                });
                approvalUrl = pp.approvalUrl;
                paymentAuthority = pp.id;
            }
            else if (provider === "zarinpal") {
                if (!zarinpalGateway) {
                    logger.error("Zarinpal gateway not configured.");
                    throw new AppError("پرداخت درگاه موقتاً در دسترس نیست.", 503, "PAYMENT_UNAVAILABLE");
                }
                const zp = await zarinpalGateway.createPaymentIntent({
                    amount: result.order.total,
                    currency,
                    description: `پرداخت سفارش ${orderNumber}`,
                    returnUrl: args.returnUrl || `${env.APP_URL || ""}/payments/zarinpal/return`,
                    metadata: { orderId: result.order.id, orderNumber },
                    mobile: addr.phone,
                });
                approvalUrl = zp.approvalUrl;
                paymentAuthority = zp.authority;
            }
            else {
                logger.warn({ provider }, "Unknown payment provider; skipping init.");
            }
            if (paymentAuthority) {
                await prisma.payment.update({
                    where: { id: result.payment.id },
                    data: { authority: paymentAuthority },
                });
            }
        }
        eventBus.emit("order.created", {
            orderId: result.order.id,
            orderNumber,
            userId: userId || null,
            paymentMethod,
            shippingMethod: shippingMethodLower,
            totals: {
                subtotal: quote.subtotal,
                discount: quote.discount,
                shipping: quote.shipping,
                giftWrap: quote.giftWrap,
                total: quote.total,
                currency,
            },
            couponCode: appliedCouponCode,
        });
        return {
            orderId: result.order.id,
            orderNumber,
            status: publicStatus,
            amounts: {
                subtotal: quote.subtotal,
                discount: quote.discount,
                shipping: quote.shipping,
                giftWrap: quote.giftWrap,
                total: quote.total,
                currencyCode: currency,
            },
            payment: {
                id: result.payment.id,
                method: paymentMethod,
                status: "pending",
                amount: quote.total,
                currencyCode: currency,
                ...(clientSecret ? { clientSecret } : {}),
                ...(approvalUrl ? { approvalUrl } : {}),
                authority: paymentAuthority,
            },
            quote,
        };
    }
}
export const checkoutService = new CheckoutService();
//# sourceMappingURL=checkout.service.js.map