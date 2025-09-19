// src/modules/users/user.controller.ts
// Thin HTTP handlers for user profile, notification prefs, and addresses.

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";

import { userService } from "./user.service";
import { AppError } from "../../common/errors/AppError";
import { logger } from "../../config/logger";
import { toLatinDigits, normalizeIranPhone } from "../auth/auth.validators";

// If your authGuard attaches the decoded JWT here:
interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}

function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

// --------------------------
// Validators (Zod)
// --------------------------

const genderEnum = z.enum(["male", "female", "other", "undisclosed"]);
const tierEnum = z.enum(["standard", "vip"]);

const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    email: z
      .string()
      .trim()
      .email("ایمیل نامعتبر است.")
      .or(z.literal("").transform(() => null))
      .optional(),
    birthDate: z
      .union([z.string().trim().min(4), z.date()])
      .nullable()
      .optional(),
    gender: genderEnum.optional(),
    // Note: customerTier usually admin-only; we will guard below
    customerTier: tierEnum.optional(),
  })
  .strict();

const prefsSchema = z
  .object({
    orderUpdates: z.boolean().optional(),
    promotions: z.boolean().optional(),
    newProducts: z.boolean().optional(),
    marketing: z.boolean().optional(),
  })
  .strict();

const addressCreateSchema = z
  .object({
    label: z.string().trim().min(1).max(200).optional().nullable(),
    firstName: z.string().trim().min(1, "نام الزامی است."),
    lastName: z.string().trim().min(1, "نام خانوادگی الزامی است."),
    phone: z
      .string()
      .transform((v) => toLatinDigits(v))
      .refine((v) => v.replace(/\D/g, "").length >= 10, "شماره تماس نامعتبر است."),
    postalCode: z.string().trim().min(4).max(20).optional().nullable(),
    province: z.string().trim().min(1),
    city: z.string().trim().min(1),
    addressLine1: z.string().trim().min(5, "نشانی را کامل‌تر وارد کنید."),
    addressLine2: z.string().trim().optional().nullable(),
    country: z.string().trim().length(2).optional(), // e.g. "IR"
    isDefault: z.boolean().optional(),
  })
  .strict();

const addressUpdateSchema = addressCreateSchema.partial();

// --------------------------
// Controller
// --------------------------

class UserController {
  getMe: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const user = await userService.getMe(String(userId));
      return ok(res, { user }, 200);
    } catch (err) {
      next(err);
    }
  };

  updateMe: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const body = await updateProfileSchema.parseAsync(req.body ?? {});
      const isAdmin = (req.user?.role || "").toLowerCase() === "admin";

      // Prevent non-admins from elevating tier
      if (body.customerTier && !isAdmin) {
        delete (body as any).customerTier;
      }

      // Normalize birthDate to Date | null
      const birthDate =
        typeof body.birthDate === "string" ? new Date(body.birthDate) : body.birthDate ?? undefined;

      const updated = await userService.updateProfile(String(userId), {
        ...body,
        birthDate,
      });
      return ok(res, { user: updated }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };

  getNotificationPrefs: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const prefs = await userService.getNotificationPrefs(String(userId));
      return ok(res, { prefs }, 200);
    } catch (err) {
      next(err);
    }
  };

  updateNotificationPrefs: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const input = await prefsSchema.parseAsync(req.body ?? {});
      const prefs = await userService.updateNotificationPrefs(String(userId), input);
      return ok(res, { prefs }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };

  // Addresses
  listAddresses: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const items = await userService.listAddresses(String(userId));
      return ok(res, { items }, 200);
    } catch (err) {
      next(err);
    }
  };

  createAddress: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const input = await addressCreateSchema.parseAsync(req.body ?? {});
      // Normalize phone to a consistent format (prefer Iran format when possible)
      const normalizedPhone = normalizeIranPhone(input.phone);
      const created = await userService.createAddress(String(userId), {
        ...input,
        phone: normalizedPhone,
      });
      return ok(res, { address: created }, 201);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };

  updateAddress: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const addressId = req.params.id;
      if (!addressId) throw new AppError("شناسه آدرس الزامی است.", 400, "BAD_REQUEST");

      const input = await addressUpdateSchema.parseAsync(req.body ?? {});
      const normalized =
        typeof input.phone === "string" ? { ...input, phone: normalizeIranPhone(input.phone) } : input;

      const updated = await userService.updateAddress(String(userId), String(addressId), normalized);
      return ok(res, { address: updated }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  };

  deleteAddress: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const addressId = req.params.id;
      if (!addressId) throw new AppError("شناسه آدرس الزامی است.", 400, "BAD_REQUEST");

      const result = await userService.deleteAddress(String(userId), String(addressId));
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  setDefaultAddress: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const addressId = req.params.id;
      if (!addressId) throw new AppError("شناسه آدرس الزامی است.", 400, "BAD_REQUEST");

      const address = await userService.setDefaultAddress(String(userId), String(addressId));
      return ok(res, { address }, 200);
    } catch (err) {
      next(err);
    }
  };

  // Dashboard-style summary
  getSummary: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const summary = await userService.getSummary(String(userId));
      return ok(res, { summary }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();