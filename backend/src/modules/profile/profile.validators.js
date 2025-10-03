// src/modules/profile/profile.validators.ts
import { z } from "zod";
export const updateProfileSchema = z.object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    phone: z.string().max(20).optional().nullable(),
    birthDate: z.string().optional().nullable(),
    gender: z.enum(["UNDISCLOSED", "MALE", "FEMALE"]).optional(),
});
export const updateNotificationPrefsSchema = z.object({
    orderUpdates: z.boolean().optional(),
    promotions: z.boolean().optional(),
    newProducts: z.boolean().optional(),
    marketing: z.boolean().optional(),
});
export const createAddressSchema = z.object({
    label: z.string().max(100).optional().nullable(),
    firstName: z.string().min(1, "نام الزامی است.").max(100),
    lastName: z.string().min(1, "نام خانوادگی الزامی است.").max(100),
    phone: z.string().min(10, "شماره تلفن نامعتبر است.").max(20),
    postalCode: z.string().max(20).optional().nullable(),
    province: z.string().min(1, "استان الزامی است."),
    city: z.string().min(1, "شهر الزامی است."),
    addressLine1: z.string().min(1, "آدرس الزامی است."),
    addressLine2: z.string().optional().nullable(),
    country: z.string().length(2).optional(),
    isDefault: z.boolean().optional(),
});
export const updateAddressSchema = z.object({
    label: z.string().max(100).optional().nullable(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    postalCode: z.string().max(20).optional().nullable(),
    province: z.string().optional(),
    city: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional().nullable(),
    isDefault: z.boolean().optional(),
});
//# sourceMappingURL=profile.validators.js.map