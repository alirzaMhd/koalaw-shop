// src/modules/notifications/notification.controller.ts
// Thin HTTP handlers for notifications: send email/SMS and order-related messages,
// plus a helper to bind default event handlers.

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";
import { notificationService } from "./notification.service.js";

function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

// ------------- Validators -------------

const stringOrStringArray = z.union([z.string(), z.array(z.string())]);
const emailish = z.string().trim().min(3); // keep loose; strict email().optional() if needed

const sendEmailSchema = z
  .object({
    to: z.union([emailish, z.array(emailish)]),
    subject: z.string().trim().min(1, "عنوان ایمیل الزامی است."),
    html: z.string().optional(),
    text: z.string().optional(),
    from: emailish.optional(),
    cc: z.array(emailish).optional(),
    bcc: z.array(emailish).optional(),
    headers: z.record(z.string()).optional(),
    enqueue: z.coerce.boolean().optional().default(false),

    // Templates (optional)
    templateName: z.string().trim().optional(),
    templateData: z.record(z.any()).optional(),
  })
  .refine(
    (v) => {
      // Must provide either html/text or a templateName
      return Boolean(v.templateName) || Boolean(v.html) || Boolean(v.text);
    },
    { message: "یکی از فیلدهای templateName یا html/text الزامی است.", path: ["templateName"] }
  );

const sendSmsSchema = z.object({
  to: z.string().trim().min(5, "شماره مقصد نامعتبر است."),
  text: z.string().trim().min(1, "متن پیامک الزامی است.").max(500),
  sender: z.string().trim().optional(),
});

const idParam = z.object({ orderId: z.string().uuid({ message: "شناسه سفارش نامعتبر است." }) });
const payParam = z.object({
  orderId: z.string().uuid({ message: "شناسه سفارش نامعتبر است." }),
  paymentId: z.string().uuid({ message: "شناسه پرداخت نامعتبر است." }),
});

const shipUpdateSchema = z.object({
  carrier: z.string().trim().min(2).max(40),
  trackingNumber: z.string().trim().min(4),
  labelUrl: z.string().url().optional(),
});

// ------------- Controller -------------

class NotificationController {
  // POST /notifications/email
  sendEmail: RequestHandler = async (req, res, next) => {
    try {
      const body = await sendEmailSchema.parseAsync(req.body ?? {});

      await notificationService.sendEmail(
        {
          to: body.to,
          subject: body.subject,
          html: body.html,
          text: body.text,
          from: body.from,
          cc: body.cc,
          bcc: body.bcc,
          headers: body.headers,
          templateName: body.templateName,
          templateData: body.templateData,
        },
        { enqueue: body.enqueue }
      );

      return ok(res, { sent: true, queued: !!body.enqueue }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };

  // POST /notifications/sms
  sendSms: RequestHandler = async (req, res, next) => {
    try {
      const body = await sendSmsSchema.parseAsync(req.body ?? {});
      await notificationService.sendSms({
        to: body.to,
        text: body.text,
        sender: body.sender,
      });
      return ok(res, { sent: true }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };

  // POST /notifications/orders/:orderId/confirm
  sendOrderConfirmation: RequestHandler = async (req, res, next) => {
    try {
      const { orderId } = await idParam.parseAsync(req.params);
      await notificationService.sendOrderConfirmation(orderId);
      return ok(res, { sent: true }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };

  // POST /notifications/orders/:orderId/payments/:paymentId/receipt
  sendPaymentReceipt: RequestHandler = async (req, res, next) => {
    try {
      const { orderId, paymentId } = await payParam.parseAsync(req.params);
      await notificationService.sendPaymentReceipt(orderId, paymentId);
      return ok(res, { sent: true }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };

  // POST /notifications/orders/:orderId/shipping
  sendShippingUpdate: RequestHandler = async (req, res, next) => {
    try {
      const { orderId } = await idParam.parseAsync(req.params);
      const body = await shipUpdateSchema.parseAsync(req.body ?? {});
      await notificationService.sendShippingUpdate(orderId, {
        carrier: body.carrier,
        trackingNumber: body.trackingNumber,
        labelUrl: body.labelUrl,
      });
      return ok(res, { sent: true }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };

  // POST /notifications/bind-defaults (admin/internal)
  bindDefaultHandlers: RequestHandler = async (_req, res, next) => {
    try {
      notificationService.bindDefaultHandlers();
      return ok(res, { bound: true }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const notificationController = new NotificationController();