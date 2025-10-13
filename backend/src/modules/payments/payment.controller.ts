// src/modules/payments/payment.controller.ts
// Thin HTTP handlers for payments: fetch/list, admin transitions (paid/failed/refund),
// and gateway webhooks/return handlers (Stripe/PayPal/Zarinpal).

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";
import { paymentService } from "./payment.service.js";

function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}
interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

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
  amount: z.coerce.number().int("مبلغ باید صحیح باشد.").min(1, "مبلغ باید مثبت باشد.").optional().nullable(),
});

const returnQuerySchema = z
  .object({
    orderId: uuid.optional(),
    authority: z.string().trim().max(200).optional().nullable(),
    transactionRef: z.string().trim().max(200).optional().nullable(),
    success: z
      .union([z.string(), z.boolean()])
      .transform((v) => {
        if (typeof v === "boolean") return v;
        const s = v.toLowerCase();
        return ["1", "true", "ok", "success"].includes(s);
      }),
    reason: z.string().trim().max(1000).optional().nullable(),
  })
  .strict();

class PaymentController {
  getById: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await paymentIdParam.parseAsync(req.params);
      const p = await paymentService.getById(id);
      return ok(res, { payment: p }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  listForOrder: RequestHandler = async (req, res, next) => {
    try {
      const { orderId } = await orderIdParam.parseAsync(req.params);
      const items = await paymentService.listForOrder(orderId);
      return ok(res, { payments: items }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  markPaid: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await paymentIdParam.parseAsync(req.params);
      const { orderId } = await z.object({ orderId: uuid }).parseAsync(req.body ?? {});
      const body = await markPaidSchema.parseAsync(req.body ?? {});
      const order = await paymentService.markPaid({
        orderId,
        paymentId: id,
        transactionRef: body.transactionRef ?? null,
        authority: body.authority ?? null,
      });
      return ok(res, { order }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  markFailed: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await paymentIdParam.parseAsync(req.params);
      const { orderId } = await z.object({ orderId: uuid }).parseAsync(req.body ?? {});
      const body = await markFailedSchema.parseAsync(req.body ?? {});
      const order = await paymentService.markFailed({
        orderId,
        paymentId: id,
        reason: body.reason ?? null,
        transactionRef: body.transactionRef ?? null,
        authority: body.authority ?? null,
      });
      return ok(res, { order }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  refund: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await paymentIdParam.parseAsync(req.params);
      const body = await refundSchema.parseAsync(req.body ?? {});
      const updated = await paymentService.refund({ paymentId: id, reason: body.reason ?? null, amount: body.amount ?? null });
      return ok(res, { payment: updated }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  stripeWebhook: RequestHandler = async (req: RawBodyRequest, res, next) => {
    try {
      const rawBody = req.rawBody || (req as any).bodyRaw || (req as any).rawBody || (typeof req.body === "string" ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body || {})));
      const headers = req.headers || {};
      const result = await paymentService.handleStripeWebhook({ rawBody, headers: headers as any });
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  paypalWebhook: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const headers = req.headers || {};
      const result = await paymentService.handlePaypalWebhook({ body, headers: headers as any });
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  gatewayReturn: RequestHandler = async (req, res, next) => {
    try {
      const payload = Object.keys(req.query || {}).length ? req.query : req.body ?? {};
      const data = await returnQuerySchema.parseAsync(payload);
      const args: any = {
        authority: data.authority ?? null,
        transactionRef: data.transactionRef ?? null,
        success: data.success,
        reason: data.reason ?? null,
      };
      if (data.orderId !== undefined) {
        args.orderId = data.orderId;
      }
      const result = await paymentService.handleGenericGatewayReturn(args);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  confirmCodPaid: RequestHandler = async (req, res, next) => {
    try {
      const { orderId } = await orderIdParam.parseAsync(req.params);
      const order = await paymentService.confirmCodPaid(orderId);
      return ok(res, { order }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // ==================== Zarinpal-specific ====================

  zarinpalReturn: RequestHandler = async (req, res, next) => {
    try {
      const Authority = (req.query.Authority || req.body.Authority) as string;
      const Status = (req.query.Status || req.body.Status) as string;

      if (!Authority) {
        return next(new AppError("پارامتر Authority یافت نشد.", 400, "MISSING_AUTHORITY"));
      }

      const success = Status === "OK";

      const result = await paymentService.handleZarinpalReturn({
        authority: String(Authority),
        success,
      });

      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  inquireTransaction: RequestHandler = async (req, res, next) => {
    try {
      const { authority } = await z.object({ authority: z.string().min(1) }).parseAsync(req.body ?? {});
      const result = await paymentService.inquireTransaction(authority);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  getUnverifiedTransactions: RequestHandler = async (req, res, next) => {
    try {
      const transactions = await paymentService.getUnverifiedTransactions();
      return ok(res, { transactions }, 200);
    } catch (err) {
      next(err);
    }
  };

  reverseTransaction: RequestHandler = async (req, res, next) => {
    try {
      const { authority } = await z.object({ authority: z.string().min(1) }).parseAsync(req.body ?? {});
      const result = await paymentService.reverseTransaction(authority);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  calculateFee: RequestHandler = async (req, res, next) => {
    try {
      const schema = z.object({
        amount: z.coerce.number().int().min(10000),
        currency: z.enum(["IRR", "IRT"]).optional(),
      });
      const body = await schema.parseAsync(req.body ?? {});
      const result = await paymentService.calculateFee(body);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  listTransactions: RequestHandler = async (req, res, next) => {
    try {
      const schema = z.object({
        terminalId: z.string().min(1),
        filter: z.enum(["PAID", "VERIFIED", "TRASH", "ACTIVE", "REFUNDED"]).optional(),
        offset: z.coerce.number().int().min(0).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
      });
      const query = await schema.parseAsync(req.query);
      const result = await paymentService.listTransactions(query);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  createZarinpalRefund: RequestHandler = async (req, res, next) => {
    try {
      const schema = z.object({
        sessionId: z.string().min(1),
        amount: z.coerce.number().int().min(20000),
        description: z.string().min(1),
        method: z.enum(["CARD", "PAYA"]),
        reason: z.enum(["CUSTOMER_REQUEST", "DUPLICATE_TRANSACTION", "SUSPICIOUS_TRANSACTION", "OTHER"]),
      });
      const body = await schema.parseAsync(req.body ?? {});
      const result = await paymentService.createZarinpalRefund(body);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };
}

export const paymentController = new PaymentController();