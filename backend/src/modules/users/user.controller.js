// src/modules/users/user.controller.ts
// Thin HTTP handlers for user profile, notification prefs, and addresses.
import { z } from "zod";
import { userService } from "./user.service.js";
import { AppError } from "../../common/errors/AppError.js";
function ok(res, data, status = 200) {
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
        .transform((v) => v)
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
const addressUpdateSchema = z
    .object({
    label: z.string().trim().min(1).max(200).optional().nullable(),
    firstName: z.string().trim().min(1, "نام الزامی است.").optional(),
    lastName: z.string().trim().min(1, "نام خانوادگی الزامی است.").optional(),
    phone: z
        .string()
        .transform((v) => v)
        .refine((v) => v.replace(/\D/g, "").length >= 10, "شماره تماس نامعتبر است.")
        .optional(),
    postalCode: z.string().trim().min(4).max(20).optional().nullable(),
    province: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    addressLine1: z.string().trim().min(5, "نشانی را کامل‌تر وارد کنید.").optional(),
    addressLine2: z.string().trim().optional().nullable(),
    country: z.string().trim().length(2).optional(),
    isDefault: z.boolean().optional(),
})
    .strict();
// --------------------------
// Controller
// --------------------------
class UserController {
    getMe = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const user = await userService.getMe(String(userId));
            return ok(res, { user }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    updateMe = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const body = await updateProfileSchema.parseAsync(req.body ?? {});
            const isAdmin = (req.user?.role || "").toLowerCase() === "admin";
            // Prevent non-admins from elevating tier
            if (body.customerTier && !isAdmin) {
                delete body.customerTier;
            }
            // Normalize birthDate to Date | null
            const birthDate = typeof body.birthDate === "string" ? new Date(body.birthDate) : body.birthDate ?? undefined;
            // Remove properties with undefined to satisfy exactOptionalPropertyTypes
            const payload = {};
            Object.entries(body).forEach(([key, value]) => {
                if (value !== undefined) {
                    payload[key] = value;
                }
            });
            if (birthDate !== undefined) {
                payload.birthDate = birthDate;
            }
            const updated = await userService.updateProfile(String(userId), payload);
            return ok(res, { user: updated }, 200);
        }
        catch (err) {
            if (err?.issues?.length) {
                return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
            }
            next(err);
        }
    };
    getNotificationPrefs = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const prefs = await userService.getNotificationPrefs(String(userId));
            return ok(res, { prefs }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    updateNotificationPrefs = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const input = await prefsSchema.parseAsync(req.body ?? {});
            const payload = {};
            Object.entries(input).forEach(([key, value]) => {
                if (value !== undefined) {
                    payload[key] = value;
                }
            });
            const prefs = await userService.updateNotificationPrefs(String(userId), payload);
            return ok(res, { prefs }, 200);
        }
        catch (err) {
            if (err?.issues?.length) {
                return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
            }
            next(err);
        }
    };
    // Addresses
    listAddresses = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const items = await userService.listAddresses(String(userId));
            return ok(res, { items }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    createAddress = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const input = await addressCreateSchema.parseAsync(req.body ?? {});
            // Normalize phone to a consistent format (prefer Iran format when possible)
            const normalizedPhone = (input.phone);
            // Build payload without undefined properties to satisfy exactOptionalPropertyTypes
            const payload = {};
            Object.entries({ ...input, phone: normalizedPhone }).forEach(([key, value]) => {
                if (value !== undefined) {
                    payload[key] = value;
                }
            });
            const created = await userService.createAddress(String(userId), payload);
            return ok(res, { address: created }, 201);
        }
        catch (err) {
            if (err?.issues?.length) {
                return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
            }
            next(err);
        }
    };
    updateAddress = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const addressId = req.params.id;
            if (!addressId)
                throw new AppError("شناسه آدرس الزامی است.", 400, "BAD_REQUEST");
            const input = await addressUpdateSchema.parseAsync(req.body ?? {});
            // Filter out undefined values to avoid overwriting with undefined
            const filteredInput = {};
            Object.entries(input).forEach(([key, value]) => {
                if (value !== undefined) {
                    filteredInput[key] = value;
                }
            });
            // Normalize phone if provided
            if (filteredInput.phone) {
                filteredInput.phone = (filteredInput.phone);
            }
            const updated = await userService.updateAddress(String(userId), String(addressId), filteredInput);
            return ok(res, { address: updated }, 200);
        }
        catch (err) {
            if (err?.issues?.length) {
                return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
            }
            next(err);
        }
    };
    deleteAddress = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const addressId = req.params.id;
            if (!addressId)
                throw new AppError("شناسه آدرس الزامی است.", 400, "BAD_REQUEST");
            const result = await userService.deleteAddress(String(userId), String(addressId));
            return ok(res, result, 200);
        }
        catch (err) {
            next(err);
        }
    };
    setDefaultAddress = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const addressId = req.params.id;
            if (!addressId)
                throw new AppError("شناسه آدرس الزامی است.", 400, "BAD_REQUEST");
            const address = await userService.setDefaultAddress(String(userId), String(addressId));
            return ok(res, { address }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    // Dashboard-style summary
    getSummary = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const summary = await userService.getSummary(String(userId));
            return ok(res, { summary }, 200);
        }
        catch (err) {
            next(err);
        }
    };
}
export const userController = new UserController();
//# sourceMappingURL=user.controller.js.map