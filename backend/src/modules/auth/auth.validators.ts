// src/modules/auth/auth.validators.ts
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
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, "کد باید ۶ رقم باشد."),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
  email: emailSchema,
});
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(20, "توکن نامعتبر است.")
    .max(4096, "توکن بسیار طولانی است.")
    .optional(),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const logoutSchema = z.object({
  all: z.boolean().optional().default(false),
});
export type LogoutInput = z.infer<typeof logoutSchema>;

export const meSchema = z.object({});
export type MeInput = z.infer<typeof meSchema>;