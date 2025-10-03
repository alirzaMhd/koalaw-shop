// src/modules/payments/payment.service.ts
// Payment orchestration utilities: mark paid/failed, refund, and handle gateway webhooks/returns.
// Designed to work with your existing checkout + orders flows.
//
// Key integration points:
// - checkout.service creates an order + a pending payment row (method='gateway'|'cod') and, for gateways,
//   sets payments.authority to the provider's intent/order id (e.g., Stripe PI id, PayPal order id).
// - This service updates that payment row and delegates order status transitions to order.service.
//
// Supported flows (out of the box):
// - Manual marking (admin/internal): markPaid / markFailed / refund
// - Stripe webhook handler (best-effort if Stripe SDK not present)
// - PayPal webhook handler (best-effort; expects authority to match provider order id)
// - Generic gateway return handler (for PSPs that redirect back with query/body)

import { prisma } from "../../infrastructure/db/prismaClient.js";
import { AppError } from "../../common/errors/AppError.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import { orderService } from "../orders/order.service.js";

// Optional Stripe dynamic import (keeps build lightweight if not using Stripe)
type StripeSDK = any;

async function tryLoadStripe(): Promise<StripeSDK | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require("stripe");
    // If you have a pinned API version, you can pass it here
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });
    return stripe;
  } catch (e) {
    logger.warn("Stripe SDK not installed or STRIPE_SECRET_KEY missing; skipping strict webhook verification.");
    return null;
  }
}

async function findPaymentByAuthorityOrOrder(opts: { authority?: string | null; orderId?: string | null }) {
  if (opts.authority) {
    const byAuth = await prisma.payment.findFirst({
      where: { authority: String(opts.authority) },
      select: { id: true, orderId: true, status: true, amount: true, currencyCode: true },
    });
    if (byAuth) return byAuth;
  }
  if (opts.orderId) {
    // Fallback: pick the latest pending gateway payment for this order
    const byOrder = await prisma.payment.findFirst({
      where: { orderId: String(opts.orderId), method: "gateway", status: "pending" },
      orderBy: { createdAt: "desc" },
      select: { id: true, orderId: true, status: true, amount: true, currencyCode: true },
    });
    if (byOrder) return byOrder;
  }
  return null;
}

class PaymentService {
  // ---------- Queries ----------

  async getById(paymentId: string) {
    const p = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!p) throw new AppError("پرداخت یافت نشد.", 404, "PAYMENT_NOT_FOUND");
    return p;
  }

  async listForOrder(orderId: string) {
    return prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ---------- Manual/admin flows ----------

  async markPaid(args: { orderId: string; paymentId: string; transactionRef?: string | null; authority?: string | null }) {
    const { orderId, paymentId, transactionRef, authority } = args;
    // Delegate to order service (updates payment to paid and sets order status)
    return orderService.markPaymentSucceeded({ orderId, paymentId, transactionRef: transactionRef ?? null, authority: authority ?? null });
  }

  async markFailed(args: { orderId: string; paymentId: string; reason?: string | null; transactionRef?: string | null; authority?: string | null }) {
    const { orderId, paymentId, reason, transactionRef, authority } = args;
    return orderService.markPaymentFailed({ orderId, paymentId, reason: reason ?? null, transactionRef: transactionRef ?? null, authority: authority ?? null });
  }

  async refund(args: { paymentId: string; reason?: string | null; amount?: number | null }) {
    const p = await prisma.payment.findUnique({
      where: { id: args.paymentId },
      select: { id: true, status: true, orderId: true, method: true, amount: true, currencyCode: true },
    });
    if (!p) throw new AppError("پرداخت یافت نشد.", 404, "PAYMENT_NOT_FOUND");
    if (p.status !== "paid") throw new AppError("بازپرداخت تنها برای پرداخت‌های موفق مجاز است.", 409, "BAD_STATE");

    // NOTE: This does not call the PSP API; wire your adapter here for real refunds.
    const updated = await prisma.payment.update({
      where: { id: args.paymentId },
      data: {
        status: "refunded",
        // You could store refund reason in a separate table; keeping minimal here.
      },
    });

    logger.info({ paymentId: updated.id, orderId: p.orderId, amount: p.amount, reason: args.reason }, "Payment marked as refunded");
    return updated;
  }

  // ---------- Stripe webhook (best-effort) ----------

  /**
   * Handle Stripe webhook. Provide the raw request body (string or Buffer) and headers.
   * - Verifies signature if STRIPE_WEBHOOK_SECRET and Stripe SDK are available.
   * - Expects metadata.orderId (and optionally authority==intent.id already stored).
   * - Updates payment row and notifies order service.
   */
  async handleStripeWebhook(opts: {
    rawBody: Buffer | string;
    headers: Record<string, any>;
  }): Promise<{ ok: boolean }> {
    const sig = opts.headers["stripe-signature"] as string | undefined;
    const secret = env.STRIPE_WEBHOOK_SECRET;
    let event: any;

    if (sig && secret) {
      const stripe = await tryLoadStripe();
      if (stripe) {
        try {
          event = stripe.webhooks.constructEvent(
            typeof opts.rawBody === "string" ? Buffer.from(opts.rawBody) : opts.rawBody,
            sig,
            secret
          );
        } catch (e: any) {
          logger.warn({ err: e?.message }, "Stripe webhook signature verification failed");
          throw new AppError("Invalid webhook signature", 400, "BAD_SIGNATURE");
        }
      }
    }

    if (!event) {
      // Fallback parse (not safe for production if signature is required)
      try {
        event = typeof opts.rawBody === "string" ? JSON.parse(opts.rawBody) : JSON.parse(opts.rawBody.toString("utf8"));
        logger.warn("Stripe webhook handled without signature verification (dev mode).");
      } catch {
        throw new AppError("Malformed payload", 400, "BAD_PAYLOAD");
      }
    }

    const type = event?.type;
    const obj = event?.data?.object || {};
    const intent = obj.object === "payment_intent" ? obj : obj.payment_intent || obj;

    const orderId: string | undefined = intent?.metadata?.orderId || obj?.metadata?.orderId;
    const authority: string | undefined = (intent?.id || obj?.id) as string | undefined;
    const latestCharge = (intent?.latest_charge || obj?.latest_charge) as string | undefined;
    const amountReceived: number | undefined = intent?.amount_received ?? obj?.amount ?? obj?.amount_total;
    const currencyCode: string | undefined = (intent?.currency || obj?.currency || "").toString().toUpperCase();

    if (!orderId && !authority) {
      logger.warn({ type }, "Stripe event missing orderId/authority; ignoring.");
      return { ok: true };
    }

    const payment = await findPaymentByAuthorityOrOrder({ authority, orderId: orderId || null });
    if (!payment) {
      logger.warn({ orderId, authority }, "Stripe webhook: matching payment not found");
      return { ok: true };
    }

    if (type === "payment_intent.succeeded" || type === "checkout.session.completed") {
      await orderService.markPaymentSucceeded({
        orderId: payment.orderId,
        paymentId: payment.id,
        transactionRef: latestCharge ?? null,
        authority: authority ?? null,
      });
      return { ok: true };
    }

    if (
      type === "payment_intent.payment_failed" ||
      type === "charge.failed" ||
      type === "checkout.session.expired"
    ) {
      await orderService.markPaymentFailed({
        orderId: payment.orderId,
        paymentId: payment.id,
        reason: event?.data?.object?.last_payment_error?.message || "payment_failed",
        transactionRef: latestCharge ?? null,
        authority: authority ?? null,
      });
      return { ok: true };
    }

    // Ignore other event types
    return { ok: true };
  }

  // ---------- PayPal webhook (best-effort) ----------

  /**
   * Handle PayPal webhook events. Provide already-parsed JSON body and headers (for signature verification if added).
   * - Expects resource.id (authority) and optionally resource.custom_id or resource.purchase_units[0].custom_id containing orderId.
   */
  async handlePaypalWebhook(opts: {
    body: any;
    headers: Record<string, any>;
  }): Promise<{ ok: boolean }> {
    const ev = opts.body || {};
    const eventType = ev.event_type || ev.eventType;
    const resource = ev.resource || {};
    const authority: string | undefined = resource.id;
    const customId: string | undefined =
      resource.custom_id ||
      resource.purchase_units?.[0]?.custom_id ||
      resource.purchase_units?.[0]?.invoice_id;

    const orderId = customId;

    if (!authority && !orderId) {
      logger.warn("PayPal webhook missing authority/orderId; ignoring.");
      return { ok: true };
    }

    const payment = await findPaymentByAuthorityOrOrder({ authority, orderId: orderId || null });
    if (!payment) {
      logger.warn({ orderId, authority }, "PayPal webhook: matching payment not found");
      return { ok: true };
    }

    if (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.COMPLETED") {
      await orderService.markPaymentSucceeded({
        orderId: payment.orderId,
        paymentId: payment.id,
        transactionRef: resource?.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
        authority: authority || null,
      });
      return { ok: true };
    }

    if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.REFUNDED" || eventType === "PAYMENT.CAPTURE.REVERSED") {
      await orderService.markPaymentFailed({
        orderId: payment.orderId,
        paymentId: payment.id,
        reason: eventType,
        transactionRef: resource?.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
        authority: authority || null,
      });
      return { ok: true };
    }

    return { ok: true };
  }

  // ---------- Generic gateway return (redirect) ----------

  /**
   * For PSPs that redirect back to your site (e.g., local gateways),
   * call this with the resolved values from their return query/body.
   */
  async handleGenericGatewayReturn(args: {
    orderId?: string;
    authority?: string | null;      // gateway transaction/authority id
    transactionRef?: string | null; // bank/PSP ref
    success: boolean;
    reason?: string | null;
  }): Promise<{ ok: boolean }> {
    const payment = await findPaymentByAuthorityOrOrder({ authority: args.authority || undefined, orderId: args.orderId || null });
    if (!payment) throw new AppError("پرداخت مرتبط یافت نشد.", 404, "PAYMENT_NOT_FOUND");

    if (args.success) {
      await orderService.markPaymentSucceeded({
        orderId: payment.orderId,
        paymentId: payment.id,
        transactionRef: args.transactionRef ?? null,
        authority: args.authority ?? null,
      });
    } else {
      await orderService.markPaymentFailed({
        orderId: payment.orderId,
        paymentId: payment.id,
        reason: args.reason ?? "gateway_return_failed",
        transactionRef: args.transactionRef ?? null,
        authority: args.authority ?? null,
      });
    }
    return { ok: true };
  }

  // ---------- COD helpers ----------

  /**
   * Mark a COD payment as paid (e.g., upon delivery confirmation).
   */
  async confirmCodPaid(orderId: string): Promise<any> {
    const p = await prisma.payment.findFirst({
      where: { orderId, method: "cod", status: "pending" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!p) throw new AppError("پرداخت COD در انتظار یافت نشد.", 404, "PAYMENT_NOT_FOUND");
    return this.markPaid({ orderId, paymentId: p.id, transactionRef: "COD", authority: null });
  }
}

export const paymentService = new PaymentService();