// src/modules/shipping/shipping.controller.ts
// Thin HTTP handlers for shipping quotes, label creation, and tracking.

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";
import { shippingService } from "./shipping.service.js";

function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

// ------------ Validators ------------

const uuid = z.string().uuid({ message: "شناسه نامعتبر است." });

const addressSchema = z
  .object({
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    postalCode: z.string().trim().optional().nullable(),
    province: z.string().trim().optional(),
    city: z.string().trim().optional(),
    addressLine1: z.string().trim().optional(),
    addressLine2: z.string().trim().optional().nullable(),
    country: z.string().trim().length(2).optional(),
  })
  .strict()
  .optional();

const quoteSchema = z
  .object({
    cartId: uuid.optional(),
    subtotal: z.coerce.number().int("مبلغ باید صحیح باشد.").min(0, "مبلغ نمی‌تواند منفی باشد.").optional(),
    address: addressSchema,
    couponFreeShip: z.coerce.boolean().optional(),
    currencyCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "کد ارز نامعتبر است (مثلاً IRT).")
      .optional(),
  })
  .refine((v) => Boolean(v.cartId) || typeof v.subtotal === "number", {
    message: "یکی از فیلدهای cartId یا subtotal الزامی است.",
    path: ["cartId"],
  });

const createLabelSchema = z
  .object({
    orderId: uuid,
    carrier: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .optional()
      .default("local-post"),
  })
  .strict();

const trackingParamSchema = z.object({
  trackingNumber: z
    .string()
    .trim()
    .min(4, "کد رهگیری نامعتبر است."),
});

// ------------ Controller ------------

class ShippingController {
  // POST /shipping/quote
  // Body: { cartId? | subtotal?, address?, couponFreeShip?, currencyCode? }
  quote: RequestHandler = async (req, res, next) => {
    try {
      const body = await quoteSchema.parseAsync(req.body ?? {});
      // Normalize nullable/optional address fields so their types match the Address expected by services
      const address = body.address
        ? ({
            ...body.address,
            // convert explicit nulls to undefined to satisfy exactOptionalPropertyTypes
            postalCode: body.address.postalCode ?? undefined,
            addressLine2: body.address.addressLine2 ?? undefined,
          } as any)
        : undefined;

      if (body.cartId) {
        const result = await shippingService.quoteCart(body.cartId, address, {
          couponFreeShip: !!body.couponFreeShip,
          ...(body.currencyCode ? { currencyCode: body.currencyCode } : {}),
        });
        return ok(res, result, 200);
      }
      // subtotal path
      const result = await shippingService.quoteLinesOrSubtotal({
        subtotal: body.subtotal!,
        address,
        couponFreeShip: body.couponFreeShip,
        currencyCode: body.currencyCode,
        linesQuote: null,
      });
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // POST /shipping/labels
  // Body: { orderId, carrier? }
  createLabel: RequestHandler = async (req, res, next) => {
    try {
      const { orderId, carrier } = await createLabelSchema.parseAsync(req.body ?? {});
      const label = await shippingService.createShipmentLabel(orderId, carrier);
      return ok(res, { label }, 201);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // GET /shipping/track/:trackingNumber
  track: RequestHandler = async (req, res, next) => {
    try {
      const { trackingNumber } = await trackingParamSchema.parseAsync(req.params);
      const info = await shippingService.track(trackingNumber);
      return ok(res, { tracking: info }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };
}

export const shippingController = new ShippingController();