// src/modules/orders/order.controller.ts
// Thin HTTP handlers for orders: list (self/admin), fetch, status changes, cancel,
// payment result hooks, and reorder -> cart clone.

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../common/errors/AppError";
import { orderService, type OrderStatus } from "./order.service";

interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}

function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

// ---------- Validators ----------

const uuidSchema = z.string().uuid({ message: "شناسه نامعتبر است." });
const posInt = z.coerce.number().int().min(1).default(1);

const statusEnum = z.enum([
  "draft",
  "awaiting_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]) as z.ZodType<OrderStatus>;

const listQuerySchema = z
  .object({
    page: posInt.default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(12),
    status: z
      .union([statusEnum, z.array(statusEnum)])
      .optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    search: z.string().trim().max(120).optional(),
    // Admin-only filter:
    userId: uuidSchema.optional(),
  })
  .transform((q) => ({
    page: q.page,
    perPage: q.perPage,
    status: q.status,
    from: q.from,
    to: q.to,
    search: q.search,
    userId: q.userId,
  }));

const idParam = z.object({ id: uuidSchema });
const numberParam = z.object({ orderNumber: z.string().trim().min(3) });

const updateStatusSchema = z.object({ status: statusEnum });
const cancelSchema = z.object({ reason: z.string().trim().max(1000).optional() });

const paymentSucceededSchema = z.object({
  transactionRef: z.string().trim().max(200).optional().nullable(),
  authority: z.string().trim().max(200).optional().nullable(),
});
const paymentFailedSchema = z.object({
  reason: z.string().trim().max(1000).optional().nullable(),
  transactionRef: z.string().trim().max(200).optional().nullable(),
  authority: z.string().trim().max(200).optional().nullable(),
});

// ---------- Controller ----------

class OrderController {
  // Self: GET /orders/me
  listMine: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const q = await listQuerySchema.parseAsync(req.query);
      const result = await orderService.listForUser(String(userId), q);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // Admin: GET /orders
  listAll: RequestHandler = async (req, res, next) => {
    try {
      const q = await listQuerySchema.parseAsync(req.query);
      const result = await orderService.listAll(q);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // Self: GET /orders/me/:id
  getMineById: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const { id } = await idParam.parseAsync(req.params);
      const order = await orderService.getForUser(id, String(userId));
      return ok(res, { order }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // Admin: GET /orders/:id
  getById: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await idParam.parseAsync(req.params);
      const order = await orderService.getById(id);
      return ok(res, { order }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // Admin (or internal): GET /orders/number/:orderNumber
  getByNumber: RequestHandler = async (req, res, next) => {
    try {
      const { orderNumber } = await numberParam.parseAsync(req.params);
      const order = await orderService.getByNumber(orderNumber);
      return ok(res, { order }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // Admin: PATCH /orders/:id/status
  updateStatus: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await idParam.parseAsync(req.params);
      const { status } = await updateStatusSchema.parseAsync(req.body ?? {});
      const order = await orderService.updateStatus(id, status);
      return ok(res, { order }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // Self/Admin: POST /orders/:id/cancel
  cancel: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await idParam.parseAsync(req.params);
      const { reason } = await cancelSchema.parseAsync(req.body ?? {});
      const order = await orderService.cancelOrder(id, reason);
      return ok(res, { order }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // Internal webhook/handler: POST /orders/:id/payments/:paymentId/succeeded
  markPaymentSucceeded: RequestHandler = async (req, res, next) => {
    try {
      const { id, paymentId } = await z
        .object({ id: uuidSchema, paymentId: uuidSchema })
        .parseAsync(req.params);
      const body = await paymentSucceededSchema.parseAsync(req.body ?? {});
      const order = await orderService.markPaymentSucceeded({
        orderId: id,
        paymentId,
        transactionRef: body.transactionRef ?? null,
        authority: body.authority ?? null,
      });
      return ok(res, { order }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // Internal webhook/handler: POST /orders/:id/payments/:paymentId/failed
  markPaymentFailed: RequestHandler = async (req, res, next) => {
    try {
      const { id, paymentId } = await z
        .object({ id: uuidSchema, paymentId: uuidSchema })
        .parseAsync(req.params);
      const body = await paymentFailedSchema.parseAsync(req.body ?? {});
      const order = await orderService.markPaymentFailed({
        orderId: id,
        paymentId,
        reason: body.reason ?? null,
        transactionRef: body.transactionRef ?? null,
        authority: body.authority ?? null,
      });
      return ok(res, { order }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // Self: POST /orders/:id/reorder -> returns a new cartId (requires auth and ownership)
  reorder: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const { id } = await idParam.parseAsync(req.params);

      // Ensure the order belongs to the user before cloning
      await orderService.getForUser(id, String(userId));
      const result = await orderService.createCartFromOrder(id, String(userId));

      return ok(res, result, 201);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };
}

export const orderController = new OrderController();