// src/modules/payments/payment.controller.ts
// Thin HTTP handlers for payments: fetch/list, admin transitions (paid/failed/refund),
// and gateway webhooks/return handlers (Stripe/PayPal/generic).
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";
import { paymentService } from "./payment.service.js";
function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}
// ---------------- Validators ----------------
const uuid = z.string().uuid({ message: "شناسه نامعتبر است." });
const paymentIdParam = z.object({ id: uuid });
const orderIdParam = z.object({ orderId: uuid });
const markPaidSchema = z.object({
  transactionRef: z.string().trim().max(200).optional().nullable(),
  authority: z.string().trim().max(200).optional().nullable(),
});
const markFailedSchema = z.object({
  reason: z.string().trim().max(1000).optional().nullable(),
  transactionRef: z.string().trim().max(200).optional().nullable(),
  authority: z.string().trim().max(200).optional().nullable(),
});
const refundSchema = z.object({
  reason: z.string().trim().max(1000).optional().nullable(),
  amount: z.coerce
    .number()
    .int("مبلغ باید صحیح باشد.")
    .min(1, "مبلغ باید مثبت باشد.")
    .optional()
    .nullable(),
});
const returnQuerySchema = z
  .object({
    orderId: uuid.optional(),
    authority: z.string().trim().max(200).optional().nullable(),
    transactionRef: z.string().trim().max(200).optional().nullable(),
    success: z.union([z.string(), z.boolean()]).transform((v) => {
      if (typeof v === "boolean") return v;
      const s = v.toLowerCase();
      return ["1", "true", "ok", "success"].includes(s);
    }),
    reason: z.string().trim().max(1000).optional().nullable(),
  })
  .strict();
// ---------------- Controller ----------------
class PaymentController {
  // GET /payments/:id
  getById = async (req, res, next) => {
    try {
      const { id } = await paymentIdParam.parseAsync(req.params);
      const p = await paymentService.getById(id);
      return ok(res, { payment: p }, 200);
    } catch (err) {
      if (err?.issues?.length)
        return next(
          new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR")
        );
      next(err);
    }
  };
  // GET /payments/order/:orderId
  listForOrder = async (req, res, next) => {
    try {
      const { orderId } = await orderIdParam.parseAsync(req.params);
      const items = await paymentService.listForOrder(orderId);
      return ok(res, { payments: items }, 200);
    } catch (err) {
      if (err?.issues?.length)
        return next(
          new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR")
        );
      next(err);
    }
  };
  // POST /payments/:id/mark-paid (admin/internal) — body: { orderId, transactionRef?, authority? }
  markPaid = async (req, res, next) => {
    try {
      const { id } = await paymentIdParam.parseAsync(req.params);
      const { orderId } = await z
        .object({ orderId: uuid })
        .parseAsync(req.body ?? {});
      const body = await markPaidSchema.parseAsync(req.body ?? {});
      const order = await paymentService.markPaid({
        orderId,
        paymentId: id,
        transactionRef: body.transactionRef ?? null,
        authority: body.authority ?? null,
      });
      return ok(res, { order }, 200);
    } catch (err) {
      if (err?.issues?.length)
        return next(
          new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR")
        );
      next(err);
    }
  };
  // POST /payments/:id/mark-failed (admin/internal) — body: { orderId, reason?, transactionRef?, authority? }
  markFailed = async (req, res, next) => {
    try {
      const { id } = await paymentIdParam.parseAsync(req.params);
      const { orderId } = await z
        .object({ orderId: uuid })
        .parseAsync(req.body ?? {});
      const body = await markFailedSchema.parseAsync(req.body ?? {});
      const order = await paymentService.markFailed({
        orderId,
        paymentId: id,
        reason: body.reason ?? null,
        transactionRef: body.transactionRef ?? null,
        authority: body.authority ?? null,
      });
      return ok(res, { order }, 200);
    } catch (err) {
      if (err?.issues?.length)
        return next(
          new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR")
        );
      next(err);
    }
  };
  // POST /payments/:id/refund (admin)
  refund = async (req, res, next) => {
    try {
      const { id } = await paymentIdParam.parseAsync(req.params);
      const body = await refundSchema.parseAsync(req.body ?? {});
      const updated = await paymentService.refund({
        paymentId: id,
        reason: body.reason ?? null,
        amount: body.amount ?? null,
      });
      return ok(res, { payment: updated }, 200);
    } catch (err) {
      if (err?.issues?.length)
        return next(
          new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR")
        );
      next(err);
    }
  };
  // POST /payments/stripe/webhook
  // IMPORTANT: Route must be mounted with express.raw({ type: 'application/json' }) to preserve rawBody for signature verification.
  stripeWebhook = async (req, res, next) => {
    try {
      const rawBody =
        req.rawBody ||
        req.bodyRaw ||
        req.rawBody ||
        (typeof req.body === "string"
          ? Buffer.from(req.body)
          : Buffer.from(JSON.stringify(req.body || {})));
      const headers = req.headers || {};
      const result = await paymentService.handleStripeWebhook({
        rawBody,
        headers: headers,
      });
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
  // POST /payments/paypal/webhook
  // Should generally use express.json() and verify PayPal signature via middleware if configured.
  paypalWebhook = async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const headers = req.headers || {};
      const result = await paymentService.handlePaypalWebhook({
        body,
        headers: headers,
      });
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
  // GET/POST /payments/return (generic gateway return)
  // Accepts query or body: { orderId?, authority?, transactionRef?, success, reason? }
  gatewayReturn = async (req, res, next) => {
    try {
      const payload = Object.keys(req.query || {}).length
        ? req.query
        : (req.body ?? {});
      const data = await returnQuerySchema.parseAsync(payload);
      const result = await paymentService.handleGenericGatewayReturn({
        orderId: data.orderId,
        authority: data.authority ?? null,
        transactionRef: data.transactionRef ?? null,
        success: data.success,
        reason: data.reason ?? null,
      });
      return ok(res, result, 200);
    } catch (err) {
      if (err?.issues?.length)
        return next(
          new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR")
        );
      next(err);
    }
  };
  // POST /payments/orders/:orderId/cod/confirm (admin/internal)
  confirmCodPaid = async (req, res, next) => {
    try {
      const { orderId } = await orderIdParam.parseAsync(req.params);
      const order = await paymentService.confirmCodPaid(orderId);
      return ok(res, { order }, 200);
    } catch (err) {
      if (err?.issues?.length)
        return next(
          new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR")
        );
      next(err);
    }
  };
}
export const paymentController = new PaymentController();
//# sourceMappingURL=payment.controller.js.map
