// src/modules/checkout/checkout.controller.ts
// Thin HTTP handlers for checkout: quote and create order from cart.

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";

import { AppError } from "../../common/errors/AppError";
import { checkoutService } from "./checkout.service";

// If your authGuard attaches the decoded JWT here:
interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}

function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

// ---------------- Validators ----------------

const uuidSchema = z.string().uuid({ message: "شناسه نامعتبر است." });

const shippingMethodEnum = z.enum(["standard", "express"]);
const paymentMethodEnum = z.enum(["gateway", "cod"]);

const quoteSchema = z
  .object({
    cartId: uuidSchema,
    couponCode: z.string().trim().max(64).optional().nullable(),
    shippingMethod: shippingMethodEnum.optional(),
    giftWrap: z.coerce.boolean().optional().default(false),
  })
  .strict();

const addressSchema = z
  .object({
    firstName: z.string().trim().min(1, "نام الزامی است."),
    lastName: z.string().trim().min(1, "نام خانوادگی الزامی است."),
    phone: z.string().trim().min(5, "شماره تماس الزامی است."),
    postalCode: z.string().trim().max(20).optional().nullable(),
    province: z.string().trim().min(1, "استان الزامی است."),
    city: z.string().trim().min(1, "شهر الزامی است."),
    addressLine1: z.string().trim().min(5, "نشانی را کامل‌تر وارد کنید."),
    addressLine2: z.string().trim().optional().nullable(),
    country: z.string().trim().length(2).optional(),
  })
  .strict();

const createOrderSchema = z
  .object({
    cartId: uuidSchema,
    address: addressSchema,
    paymentMethod: paymentMethodEnum,
    shippingMethod: shippingMethodEnum.optional(),
    couponCode: z.string().trim().max(64).optional().nullable(),
    giftWrap: z.coerce.boolean().optional().default(false),
    note: z.string().trim().max(2000).optional().nullable(),
    returnUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  })
  .strict();

// ---------------- Controller ----------------

class CheckoutController {
  // POST /checkout/quote
  quote: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = await quoteSchema.parseAsync(req.body ?? {});
      const userId = (req.user?.id || req.user?.sub) as string | undefined;

      const quote = await checkoutService.prepareQuote(body.cartId, {
        couponCode: body.couponCode || undefined,
        shippingMethod: body.shippingMethod,
        giftWrap: body.giftWrap,
        userId,
      });

      return ok(res, { quote }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };

  // POST /checkout/order (auth recommended)
  createOrderFromCart: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = await createOrderSchema.parseAsync(req.body ?? {});
      const userId = (req.user?.id || req.user?.sub) as string | undefined;

      const result = await checkoutService.createOrderFromCart({
        cartId: body.cartId,
        userId,
        address: body.address,
        options: {
          paymentMethod: body.paymentMethod,
          shippingMethod: body.shippingMethod,
          couponCode: body.couponCode || undefined,
          giftWrap: body.giftWrap,
          note: body.note || null,
          userId, // for coupon usage caps
        },
        returnUrl: body.returnUrl,
        cancelUrl: body.cancelUrl,
      });

      // 201 Created since we created an order/payment record
      return ok(res, result, 201);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };
}

export const checkoutController = new CheckoutController();