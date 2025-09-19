// src/modules/auth/auth.validators.ts
// Zod schemas and helpers for OTP-based auth flows (Iran mobile first)

import { z } from "zod";

/**
 * Convert Persian/Arabic-Indic digits to Latin (0-9).
 */
export function toLatinDigits(input: string = ""): string {
  const map: Record<string, string> = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  return input.replace(/[۰-۹٠-٩]/g, (d) => map[d] ?? d);
}

/**
 * Normalize any Iran phone variant to 09xxxxxxxxx
 * Accepted inputs: +989xxxxxxxxx, 00989xxxxxxxxx, 98xxxxxxxxx, 9xxxxxxxxx, 09xxxxxxxxx
 * Also tolerates spaces/dashes/parentheses and Persian digits.
 */
export function normalizeIranPhone(raw: string): string {
  const digits = toLatinDigits(raw).replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("0098")) return "0" + digits.slice(4);
  if (digits.startsWith("98")) return "0" + digits.slice(2);
  if (digits.startsWith("0")) return digits;
  if (digits.startsWith("9")) return "0" + digits;
  return digits;
}

export const IRAN_MOBILE_REGEX = /^09\d{9}$/;

export function isValidIranMobile(n: string): boolean {
  return IRAN_MOBILE_REGEX.test(n);
}

/**
 * Zod schema for an Iran mobile phone:
 * - normalizes to 09xxxxxxxxx
 * - validates final format
 */
export const iranPhoneSchema = z
  .string({
    required_error: "شماره موبایل الزامی است.",
    invalid_type_error: "شماره موبایل نامعتبر است.",
  })
  .min(3, "شماره موبایل نامعتبر است.")
  .transform((v) => normalizeIranPhone(v))
  .refine((v) => IRAN_MOBILE_REGEX.test(v), {
    message: "شماره موبایل معتبر وارد کنید (با 09 شروع شود).",
  });

/**
 * OTP code: exactly 6 digits (accepts Persian digits; non-digits ignored before validation)
 */
export const otpCodeSchema = z
  .string({
    required_error: "کد تایید الزامی است.",
    invalid_type_error: "کد تایید نامعتبر است.",
  })
  .transform((v) => toLatinDigits(v).replace(/\D/g, ""))
  .refine((v) => /^\d{6}$/.test(v), {
    message: "کد تایید باید ۶ رقم باشد.",
  });

/**
 * POST /auth/otp/send
 * body: { phone, recaptchaToken? }
 */
export const sendOtpSchema = z.object({
  phone: iranPhoneSchema,
  // Optional: if you enable CAPTCHA on the endpoint
  recaptchaToken: z
    .string()
    .min(10, "توکن امنیتی نامعتبر است.")
    .max(2000, "توکن امنیتی بسیار طولانی است.")
    .optional(),
});
export type SendOtpInput = z.infer<typeof sendOtpSchema>;

/**
 * POST /auth/otp/verify
 * body: { phone, code }
 */
export const verifyOtpSchema = z.object({
  phone: iranPhoneSchema,
  code: otpCodeSchema,
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/**
 * POST /auth/refresh
 * Prefer reading refresh token from httpOnly cookie.
 * Optionally accept it in body for non-browser clients.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(20, "توکن نامعتبر است.")
    .max(4096, "توکن بسیار طولانی است.")
    .optional(),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * POST /auth/logout
 * Optionally terminate all sessions.
 */
export const logoutSchema = z.object({
  all: z.boolean().optional().default(false),
});
export type LogoutInput = z.infer<typeof logoutSchema>;

/**
 * GET /auth/me
 * No body; route is protected by authGuard.
 * (Schema placeholder for symmetry if you use a generic validator)
 */
export const meSchema = z.object({});
export type MeInput = z.infer<typeof meSchema>;