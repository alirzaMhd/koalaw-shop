import { z } from "zod";
export declare const updateProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    birthDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    gender: z.ZodOptional<z.ZodEnum<["UNDISCLOSED", "MALE", "FEMALE"]>>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
    birthDate?: string | null | undefined;
    gender?: "FEMALE" | "MALE" | "UNDISCLOSED" | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
    birthDate?: string | null | undefined;
    gender?: "FEMALE" | "MALE" | "UNDISCLOSED" | undefined;
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
    firstName: string;
    lastName: string;
    phone: string;
    province: string;
    city: string;
    addressLine1: string;
    isDefault?: boolean | undefined;
    label?: string | null | undefined;
    postalCode?: string | null | undefined;
    addressLine2?: string | null | undefined;
    country?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    phone: string;
    province: string;
    city: string;
    addressLine1: string;
    isDefault?: boolean | undefined;
    label?: string | null | undefined;
    postalCode?: string | null | undefined;
    addressLine2?: string | null | undefined;
    country?: string | undefined;
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
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    isDefault?: boolean | undefined;
    label?: string | null | undefined;
    postalCode?: string | null | undefined;
    province?: string | undefined;
    city?: string | undefined;
    addressLine1?: string | undefined;
    addressLine2?: string | null | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    isDefault?: boolean | undefined;
    label?: string | null | undefined;
    postalCode?: string | null | undefined;
    province?: string | undefined;
    city?: string | undefined;
    addressLine1?: string | undefined;
    addressLine2?: string | null | undefined;
}>;
//# sourceMappingURL=profile.validators.d.ts.map