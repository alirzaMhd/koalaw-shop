// src/common/utils/validation.ts
// Shared validation helpers: safe Zod parsing, phone normalization, Persian/Arabic digits.

// src/common/utils/validation.ts
// Shared validation helpers: safe Zod parsing, phone normalization, Persian/Arabic digits.
import type { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

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
  return (input || "").replace(/[۰-۹٠-٩]/g, (d) => map[d] ?? d);
}

export function normalizeIranPhone(raw: string): string {
  const digits = toLatinDigits(raw).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0098")) return "0" + digits.slice(4);
  if (digits.startsWith("98")) return "0" + digits.slice(2);
  if (digits.startsWith("0")) return digits;
  if (digits.startsWith("9")) return "0" + digits;
  return digits;
}

export function isValidIranMobile(n: string): boolean {
  return /^09\d{9}$/.test(n);
}

export async function parseSafe<T>(schema: ZodSchema<T>, data: unknown): Promise<T> {
  return schema.parseAsync(data);
}
export function validate(schema: ZodSchema<any>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await parseSafe(schema, {
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed?.body) req.body = parsed.body;
      if (parsed?.query) req.query = parsed.query as any; // Express' req.query is a plain object
      if (parsed?.params) req.params = parsed.params;

      next();
    } catch (err) {
      next(err); // Let your centralized error handler deal with ZodError
    }
  };
}