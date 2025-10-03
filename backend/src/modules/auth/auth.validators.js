// src/modules/auth/auth.validators.js
import { z } from "zod";
export const emailSchema = z
    .string({
    required_error: "ایمیل الزامی است.",
    invalid_type_error: "ایمیل نامعتبر است.",
})
    .email("لطفاً یک ایمیل معتبر وارد کنید.")
    .toLowerCase()
    .trim();
export const passwordSchema = z
    .string({
    required_error: "رمز عبور الزامی است.",
    invalid_type_error: "رمز عبور نامعتبر است.",
})
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.")
    .max(128, "رمز عبور بسیار طولانی است.")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "رمز عبور باید شامل حروف و اعداد باشد.");
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});
export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});
export const verifyEmailSchema = z.object({
    email: emailSchema,
    code: z.string().length(6, "کد باید ۶ رقم باشد."),
});
export const resendVerificationSchema = z.object({
    email: emailSchema,
});
export const refreshTokenSchema = z.object({
    refreshToken: z
        .string()
        .min(20, "توکن نامعتبر است.")
        .max(4096, "توکن بسیار طولانی است.")
        .optional(),
});
export const logoutSchema = z.object({
    all: z.boolean().optional().default(false),
});
export const meSchema = z.object({});
// NEW: Forgot/Reset password
export const forgotPasswordSchema = z.object({
    email: emailSchema,
});
export const resetPasswordSchema = z.object({
    email: emailSchema,
    code: z.string().length(6, "کد باید ۶ رقم باشد."),
    newPassword: passwordSchema,
});
//# sourceMappingURL=auth.validators.js.map