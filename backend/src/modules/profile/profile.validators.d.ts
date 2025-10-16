import { z } from "zod";
export declare const updateProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    birthDate: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>, string | null | undefined, string | null | undefined>;
    gender: z.ZodOptional<z.ZodEnum<["UNDISCLOSED", "MALE", "FEMALE"]>>;
}, "strip", z.ZodTypeAny, {
    phone?: string | null | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    birthDate?: string | null | undefined;
    gender?: "UNDISCLOSED" | "MALE" | "FEMALE" | undefined;
}, {
    phone?: string | null | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    birthDate?: string | null | undefined;
    gender?: "UNDISCLOSED" | "MALE" | "FEMALE" | undefined;
}>;
export declare const updateNotificationPrefsSchema: z.ZodObject<{
    orderUpdates: z.ZodOptional<z.ZodBoolean>;
    promotions: z.ZodOptional<z.ZodBoolean>;
    newProducts: z.ZodOptional<z.ZodBoolean>;
    marketing: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    orderUpdates?: boolean | undefined;
    promotions?: boolean | undefined;
    newProducts?: boolean | undefined;
    marketing?: boolean | undefined;
}, {
    orderUpdates?: boolean | undefined;
    promotions?: boolean | undefined;
    newProducts?: boolean | undefined;
    marketing?: boolean | undefined;
}>;
export declare const createAddressSchema: z.ZodObject<{
    label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodString;
    postalCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    province: z.ZodString;
    city: z.ZodString;
    addressLine1: z.ZodString;
    addressLine2: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    country: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    firstName: string;
    lastName: string;
    province: string;
    city: string;
    addressLine1: string;
    label?: string | null | undefined;
    postalCode?: string | null | undefined;
    addressLine2?: string | null | undefined;
    country?: string | undefined;
    isDefault?: boolean | undefined;
}, {
    phone: string;
    firstName: string;
    lastName: string;
    province: string;
    city: string;
    addressLine1: string;
    label?: string | null | undefined;
    postalCode?: string | null | undefined;
    addressLine2?: string | null | undefined;
    country?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const updateAddressSchema: z.ZodObject<{
    label: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    postalCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    province: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    addressLine1: z.ZodOptional<z.ZodString>;
    addressLine2: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    label?: string | null | undefined;
    postalCode?: string | null | undefined;
    province?: string | undefined;
    city?: string | undefined;
    addressLine1?: string | undefined;
    addressLine2?: string | null | undefined;
    isDefault?: boolean | undefined;
}, {
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    label?: string | null | undefined;
    postalCode?: string | null | undefined;
    province?: string | undefined;
    city?: string | undefined;
    addressLine1?: string | undefined;
    addressLine2?: string | null | undefined;
    isDefault?: boolean | undefined;
}>;
//# sourceMappingURL=profile.validators.d.ts.map