// src/modules/payments/payment.service.ts
// Payment orchestration utilities: mark paid/failed, refund, and handle gateway webhooks/returns.
// Supports Stripe, PayPal, and Zarinpal.

import { prisma } from "../../infrastructure/db/prismaClient.js";
import { AppError } from "../../common/errors/AppError.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import { orderService } from "../orders/order.service.js";

type StripeSDK = any;

async function tryLoadStripe(): Promise<StripeSDK | null> {
  try {
    const Stripe = require("stripe");
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
    const byOrder = await prisma.payment.findFirst({
      where: { orderId: String(opts.orderId), method: "GATEWAY", status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, orderId: true, status: true, amount: true, currencyCode: true },
    });
    if (byOrder) return byOrder;
  }
  return null;
}

class PaymentService {
  // ==================== Queries ====================

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

  // ==================== Manual/Admin Flows ====================

  async markPaid(args: { orderId: string; paymentId: string; transactionRef?: string | null; authority?: string | null }) {
    const { orderId, paymentId, transactionRef, authority } = args;
    return orderService.markPaymentSucceeded({ orderId, paymentId, transactionRef: transactionRef ?? null, authority: authority ?? null });
  }

  async markFailed(args: { orderId: string; paymentId: string; reason?: string | null; transactionRef?: string | null; authority?: string | null }) {
    const { orderId, paymentId, reason, transactionRef, authority } = args;
    return orderService.markPaymentFailed({ orderId, paymentId, reason: reason ?? null, transactionRef: transactionRef ?? null, authority: authority ?? null });
  }

  async refund(args: { paymentId: string; reason?: string | null; amount?: number | null }) {
    const p = await prisma.payment.findUnique({
      where: { id: args.paymentId },
      select: {
        id: true,
        status: true,
        orderId: true,
        method: true,
        amount: true,
        currencyCode: true,
        authority: true,
        transactionRef: true,
      },
    });
    if (!p) throw new AppError("پرداخت یافت نشد.", 404, "PAYMENT_NOT_FOUND");
    if (p.status !== "PAID") throw new AppError("بازپرداخت تنها برای پرداخت‌های موفق مجاز است.", 409, "BAD_STATE");

    if (p.method === "GATEWAY" && p.transactionRef && env.PAYMENT_PROVIDER === "zarinpal") {
      try {
        const refundAmount = args.amount || p.amount;
        const zarinpalRefund = await this.createZarinpalRefund({
          sessionId: p.transactionRef,
          amount: refundAmount,
          description: args.reason || "Customer refund request",
          method: "CARD",
          reason: "CUSTOMER_REQUEST",
        });

        const updated = await prisma.payment.update({
          where: { id: args.paymentId },
          data: { status: "REFUNDED" },
        });

        logger.info(
          {
            paymentId: updated.id,
            orderId: p.orderId,
            amount: refundAmount,
            zarinpalRefundId: zarinpalRefund.id,
          },
          "Zarinpal refund processed"
        );

        return { ...updated, zarinpalRefund };
      } catch (error: any) {
        logger.error({ err: error, paymentId: args.paymentId }, "Zarinpal refund failed; marking locally");
      }
    }

    const updated = await prisma.payment.update({
      where: { id: args.paymentId },
      data: { status: "REFUNDED" },
    });

    logger.info({ paymentId: updated.id, orderId: p.orderId, amount: p.amount, reason: args.reason }, "Payment marked as refunded (local)");
    return updated;
  }

  // ==================== Stripe Webhook ====================

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

    if (!orderId && !authority) {
      logger.warn({ type }, "Stripe event missing orderId/authority; ignoring.");
      return { ok: true };
    }

    const payment = await findPaymentByAuthorityOrOrder({ authority: authority ?? null, orderId: orderId || null });
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

    return { ok: true };
  }

  // ==================== PayPal Webhook ====================

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

    const payment = await findPaymentByAuthorityOrOrder({ authority: authority ?? null, orderId: orderId ?? null });
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

  // ==================== Generic Gateway Return ====================

  async handleGenericGatewayReturn(args: {
    orderId?: string;
    authority?: string | null;
    transactionRef?: string | null;
    success: boolean;
    reason?: string | null;
  }): Promise<{ ok: boolean }> {
    const payment = await findPaymentByAuthorityOrOrder({ authority: args.authority ?? null, orderId: args.orderId || null });
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

  // ==================== COD Helpers ====================

  async confirmCodPaid(orderId: string): Promise<any> {
    const p = await prisma.payment.findFirst({
      where: { orderId, method: "COD", status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!p) throw new AppError("پرداخت COD در انتظار یافت نشد.", 404, "PAYMENT_NOT_FOUND");
    return this.markPaid({ orderId, paymentId: p.id, transactionRef: "COD", authority: null });
  }

  // ==================== Zarinpal-Specific ====================

  async handleZarinpalReturn(args: {
    authority: string;
    success: boolean;
  }): Promise<{ ok: boolean; verified: boolean; refId?: string; orderId?: string }> {
    const { authority, success } = args;

    if (!success) {
      const payment = await findPaymentByAuthorityOrOrder({ authority, orderId: null });
      if (payment) {
        await orderService.markPaymentFailed({
          orderId: payment.orderId,
          paymentId: payment.id,
          reason: "user_cancelled_or_failed",
          authority,
          transactionRef: null,
        });
        return { ok: true, verified: false, orderId: payment.orderId };
      }
      throw new AppError("پرداخت مرتبط با این Authority یافت نشد.", 404, "PAYMENT_NOT_FOUND");
    }

    const payment = await findPaymentByAuthorityOrOrder({ authority, orderId: null });
    if (!payment) {
      throw new AppError("پرداخت مرتبط با این Authority یافت نشد.", 404, "PAYMENT_NOT_FOUND");
    }

    let zarinpalGateway: any = null;
    try {
      const { zarinpalGateway: zg } = await import("../../infrastructure/payment/zarinpal.gateway.js");
      zarinpalGateway = zg;
    } catch (e) {
      logger.error("Zarinpal gateway not available for verification");
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    if (!zarinpalGateway) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    try {
      const verifyResult = await zarinpalGateway.verifyPayment({
        authority,
        amount: payment.amount,
      });

      if (verifyResult.success) {
        await orderService.markPaymentSucceeded({
          orderId: payment.orderId,
          paymentId: payment.id,
          transactionRef: verifyResult.refId ?? null,
          authority,
        });
        return {
          ok: true,
          verified: true,
          refId: verifyResult.refId,
          orderId: payment.orderId,
        };
      } else {
        await orderService.markPaymentFailed({
          orderId: payment.orderId,
          paymentId: payment.id,
          reason: verifyResult.message || "verification_failed",
          authority,
          transactionRef: null,
        });
        return {
          ok: true,
          verified: false,
          orderId: payment.orderId,
        };
      }
    } catch (error: any) {
      logger.error({ err: error, authority }, "Zarinpal verification error");
      await orderService.markPaymentFailed({
        orderId: payment.orderId,
        paymentId: payment.id,
        reason: error?.message || "verification_error",
        authority,
        transactionRef: null,
      });
      throw error;
    }
  }

  async inquireTransaction(authority: string): Promise<any> {
    let zarinpalGateway: any = null;
    try {
      const zg = require("../../infrastructure/payment/zarinpal.gateway");
      zarinpalGateway = zg?.zarinpalGateway ?? zg?.default ?? null;
    } catch (e) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    if (!zarinpalGateway) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    return zarinpalGateway.inquireTransaction({ authority });
  }

  async getUnverifiedTransactions(): Promise<any> {
    let zarinpalGateway: any = null;
    try {
      const zg = require("../../infrastructure/payment/zarinpal.gateway");
      zarinpalGateway = zg?.zarinpalGateway ?? zg?.default ?? null;
    } catch (e) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    if (!zarinpalGateway) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    return zarinpalGateway.getUnverifiedTransactions();
  }

  async reverseTransaction(authority: string): Promise<any> {
    let zarinpalGateway: any = null;
    try {
      const zg = require("../../infrastructure/payment/zarinpal.gateway");
      zarinpalGateway = zg?.zarinpalGateway ?? zg?.default ?? null;
    } catch (e) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    if (!zarinpalGateway) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    return zarinpalGateway.reverseTransaction({ authority });
  }

  async calculateFee(args: { amount: number; currency?: "IRR" | "IRT" }): Promise<any> {
    let zarinpalGateway: any = null;
    try {
      const zg = require("../../infrastructure/payment/zarinpal.gateway");
      zarinpalGateway = zg?.zarinpalGateway ?? zg?.default ?? null;
    } catch (e) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    if (!zarinpalGateway) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    return zarinpalGateway.calculateFee(args);
  }

  async listTransactions(args: {
    terminalId: string;
    filter?: "PAID" | "VERIFIED" | "TRASH" | "ACTIVE" | "REFUNDED";
    offset?: number;
    limit?: number;
  }): Promise<any> {
    let zarinpalGateway: any = null;
    try {
      const zg = require("../../infrastructure/payment/zarinpal.gateway");
      zarinpalGateway = zg?.zarinpalGateway ?? zg?.default ?? null;
    } catch (e) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    if (!zarinpalGateway) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    return zarinpalGateway.listTransactions(args);
  }

  async createZarinpalRefund(args: {
    sessionId: string;
    amount: number;
    description: string;
    method: "CARD" | "PAYA";
    reason: "CUSTOMER_REQUEST" | "DUPLICATE_TRANSACTION" | "SUSPICIOUS_TRANSACTION" | "OTHER";
  }): Promise<any> {
    let zarinpalGateway: any = null;
    try {
      const zg = require("../../infrastructure/payment/zarinpal.gateway");
      zarinpalGateway = zg?.zarinpalGateway ?? zg?.default ?? null;
    } catch (e) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    if (!zarinpalGateway) {
      throw new AppError("درگاه پرداخت در دسترس نیست.", 503, "GATEWAY_UNAVAILABLE");
    }

    return zarinpalGateway.createRefund(args);
  }
}

export const paymentService = new PaymentService();