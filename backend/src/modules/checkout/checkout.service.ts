// src/modules/checkout/checkout.service.ts
// Checkout orchestration: quote -> order creation -> payment initialization.
// Integrates pricing.service (totals), emits order.created event, and initializes payment gateway or COD.
//
// Flow (happy path):
// 1) Client builds/updates cart items (server-side snapshots are in cart_items).
// 2) Client calls prepareQuote(cartId, { couponCode, shippingMethod, giftWrap }).
// 3) Client submits address + payment method.
// 4) createOrderFromCart(...) creates order + order_items + pending payment record,
//    marks cart as converted, initializes gateway intent (if any), emits order.created.
//
// Note: inventory reservation and coupon redemption recording are deferred to domain event handlers
// (e.g., order.created.handler.ts and payment.succeeded.handler.ts) per your architecture.

import { prisma } from "../../infrastructure/db/prismaClient.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { eventBus } from "../../events/eventBus";
import { AppError } from "../../common/errors/AppError.js";

import {
  pricingService,
  type QuoteOptions,
  type QuoteResult,
  type ShippingMethod,
} from "../pricing/pricing.service.js";
import { taxService, type TaxContext } from "../pricing/tax.service.js";
import { toLatinDigits, normalizeIranPhone } from "../auth/auth.validators";

// Optional payment gateways (stripe/paypal) – initialize if configured
// You can implement these adapters under src/infrastructure/payment/*.
// The type signatures below are minimal for our use here.
type GatewayPaymentInit = {
  id: string;
  clientSecret?: string; // Stripe-like
  approvalUrl?: string;  // PayPal-like
  amount: number;
  currency: string;
};
interface StripeGateway {
  createPaymentIntent(args: { amount: number; currency: string; metadata?: Record<string, any> }): Promise<GatewayPaymentInit>;
}
interface PaypalGateway {
  createOrder(args: {
    amount: number;
    currency: string;
    returnUrl: string;
    cancelUrl: string;
    metadata?: Record<string, any>;
  }): Promise<GatewayPaymentInit>;
}

// Lazy imports (avoid hard crash if not provided)
let stripeGateway: StripeGateway | null = null;
let paypalGateway: PaypalGateway | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sg = require("../../infrastructure/payment/stripe.gateway");
  stripeGateway = sg?.stripeGateway ?? sg?.default ?? null;
} catch {}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pg = require("../../infrastructure/payment/paypal.gateway");
  paypalGateway = pg?.paypalGateway ?? pg?.default ?? null;
} catch {}

// ------------ Types ------------

export type PaymentMethod = "gateway" | "cod";

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  phone: string;
  postalCode?: string | null;
  province: string;
  city: string;
  addressLine1: string;
  addressLine2?: string | null;
  country?: string; // default IR
}

export interface CheckoutOptions extends QuoteOptions {
  paymentMethod: PaymentMethod;
  shippingMethod?: ShippingMethod; // standard | express
  note?: string | null;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  status: "awaiting_payment" | "processing";
  amounts: {
    subtotal: number;
    discount: number;
    shipping: number;
    giftWrap: number;
    total: number;
    currencyCode: string;
  };
  payment: {
    id: string; // payments.id
    method: PaymentMethod;
    status: "pending" | "paid" | "failed" | "refunded";
    amount: number;
    currencyCode: string;
    // Gateway-specific fields
    clientSecret?: string; // Stripe
    approvalUrl?: string;  // PayPal
    authority?: string | null; // generic external id/authority
  };
  quote: QuoteResult;
}

// ------------ Helpers ------------

const COUNTRY_DEFAULT = String(env.TAX_COUNTRY_DEFAULT ?? "IR");
const ORDER_PREFIX = String(env.ORDER_PREFIX ?? "KL");

function cleanPhone(p: string): string {
  return normalizeIranPhone(toLatinDigits(p));
}

function cleanPostal(s?: string | null): string | null {
  if (!s) return null;
  const d = toLatinDigits(s).replace(/\D/g, "");
  return d || null;
}

function ensureAddress(a: CheckoutAddress): Required<CheckoutAddress> {
  const addr: Required<CheckoutAddress> = {
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

async function generateOrderNumber(): Promise<string> {
  // Format: KL-YYYYMMDD-XXXXXX (random suffix)
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const base = `${ORDER_PREFIX}-${yyyy}${mm}${dd}`;
  // We'll try a few times to avoid unique collisions
  for (let i = 0; i < 6; i++) {
    const suffix = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0");
    const orderNumber = `${base}-${suffix}`;
    const exists = await prisma.order.findFirst({ where: { orderNumber }, select: { id: true } });
    if (!exists) return orderNumber;
  }
  // Fallback with timestamp tail
  return `${base}-${Date.now().toString().slice(-6)}`;
}

function toTaxCtx(addr: Required<CheckoutAddress>): TaxContext {
  return {
    country: addr.country,
    province: addr.province,
    city: addr.city,
    postalCode: addr.postalCode || undefined,
  };
}

// ------------ Service ------------

class CheckoutService {
  /**
   * Compute quote (and optional taxes) for a cart.
   * This mirrors the frontend constants and coupon behavior.
   */
  async prepareQuote(cartId: string, opts: QuoteOptions = {}): Promise<QuoteResult> {
    return pricingService.quoteCart(cartId, opts);
  }

  /**
   * Create an order from a cart and initialize payment.
   * - Validates cart has items
   * - Computes quote via pricing.service (no tax line in DB schema; tax kept 0)
   * - Persists order, items, and a pending payment record
   * - For "gateway": initializes payment intent and returns clientSecret/approvalUrl
   * - Emits "order.created" event
   */
  async createOrderFromCart(args: {
    cartId: string;
    userId?: string | null;
    address: CheckoutAddress;
    options: CheckoutOptions;
    // Optional PayPal return/cancel URLs if you enable PayPal:
    returnUrl?: string;
    cancelUrl?: string;
  }): Promise<CheckoutResult> {
    const { cartId, userId, address, options } = args;

    // 1) Load cart items (ensure not empty)
    const cart = await prisma.cart.findUnique({ where: { id: cartId }, select: { id: true, status: true } });
    if (!cart) throw new AppError("سبد خرید یافت نشد.", 404, "CART_NOT_FOUND");
    if (cart.status !== "active") throw new AppError("سبد خرید فعال نیست.", 400, "CART_INACTIVE");

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
    if (!items.length) throw new AppError("سبد خرید خالی است.", 400, "CART_EMPTY");

    // 2) Compute quote (discount, shipping, gift, total)
    const quote = await pricingService.quoteCart(cartId, {
      couponCode: options.couponCode,
      shippingMethod: options.shippingMethod,
      giftWrap: options.giftWrap,
      userId: userId || undefined,
    });

    // 3) (Optional) compute taxes if you later add tax columns to orders
    // const tax = await taxService.computeForLines({
    //   lines: items.map((it) => ({ id: it.id, unitPrice: it.unitPrice, quantity: it.quantity })),
    //   shippingAmount: quote.shipping,
    // }, toTaxCtx(ensureAddress(address)));
    // For now, schema has no tax field; we keep 0.

    // 4) Normalize address
    const addr = ensureAddress(address);

    // 5) Prepare order persistence data
    const orderNumber = await generateOrderNumber();
    const paymentMethod = options.paymentMethod; // 'gateway' | 'cod'
    const shippingMethod = options.shippingMethod === "express" ? "express" : "standard";
    const currency = quote.currencyCode;

    const status: "awaiting_payment" | "processing" = paymentMethod === "cod" ? "processing" : "awaiting_payment";

    const couponCode = (options.couponCode || "").trim();
    const appliedCouponCode = couponCode ? couponCode.toUpperCase() : null;

    // 6) Persist (transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          status,
          shippingMethod,                 // enum shipping_method_enum
          paymentMethod,                  // enum payment_method_enum
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

      // Copy order items from cart snapshot
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

      // Create pending payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod,
          status: "pending",
          amount: quote.total,
          currencyCode: currency,
          authority: null,
          transactionRef: null,
          paidAt: null,
        },
      });

      // Mark cart as converted (do not delete items to keep snapshot; optional: clear after order)
      await tx.cart.update({ where: { id: cartId }, data: { status: "converted" } });

      return { order, payment };
    });

    // 7) Initialize payment if needed
    let paymentAuthority: string | null = null;
    let clientSecret: string | undefined;
    let approvalUrl: string | undefined;

    if (paymentMethod === "gateway") {
      const provider = (env.PAYMENT_PROVIDER || "stripe").toString().toLowerCase();

      if (provider === "stripe") {
        if (!stripeGateway) {
          logger.error("Stripe gateway not configured. Provide src/infrastructure/payment/stripe.gateway.ts");
          throw new AppError("پرداخت درگاه موقتاً در دسترس نیست.", 503, "PAYMENT_UNAVAILABLE");
        }
        const intent = await stripeGateway.createPaymentIntent({
          amount: result.order.total,
          currency,
          metadata: {
            orderId: result.order.id,
            orderNumber,
          },
        });
        clientSecret = intent.clientSecret;
        paymentAuthority = intent.id;
      } else if (provider === "paypal") {
        if (!paypalGateway) {
          logger.error("PayPal gateway not configured. Provide src/infrastructure/payment/paypal.gateway.ts");
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
      } else {
        // You can plug local PSPs here (e.g., Zarinpal)
        logger.warn({ provider }, "Unknown payment provider; skipping init.");
      }

      // Persist authority (external id) if we have it
      if (paymentAuthority) {
        await prisma.payment.update({
          where: { id: result.payment.id },
          data: { authority: paymentAuthority },
        });
      }
    }

    // 8) Emit event for downstream handlers (reserve stock, email, etc.)
    eventBus.emit("order.created", {
      orderId: result.order.id,
      orderNumber,
      userId: userId || null,
      paymentMethod,
      shippingMethod,
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
      status,
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
        clientSecret,
        approvalUrl,
        authority: paymentAuthority,
      },
      quote,
    };
  }
}

export const checkoutService = new CheckoutService();