// src/common/utils/validation.ts
// Shared validation helpers: safe Zod parsing, phone normalization, Persian/Arabic digits.
import { z, ZodSchema } from "zod";
export function toLatinDigits(input = "") {
    const map = {
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
export function normalizeIranPhone(raw) {
    const digits = toLatinDigits(raw).replace(/\D/g, "");
    if (!digits)
        return "";
    if (digits.startsWith("0098"))
        return "0" + digits.slice(4);
    if (digits.startsWith("98"))
        return "0" + digits.slice(2);
    if (digits.startsWith("0"))
        return digits;
    if (digits.startsWith("9"))
        return "0" + digits;
    return digits;
}
export function isValidIranMobile(n) {
    return /^09\d{9}$/.test(n);
}
export async function parseSafe(schema, data) {
    return schema.parseAsync(data);
}
export function validate(schema) {
    return async (req, _res, next) => {
        try {
            const parsed = await parseSafe(schema, {
                body: req.body,
                query: req.query,
                params: req.params,
            });
            if (parsed?.body)
                req.body = parsed.body;
            if (parsed?.query)
                req.query = parsed.query; // Express' req.query is a plain object
            if (parsed?.params)
                req.params = parsed.params;
            next();
        }
        catch (err) {
            next(err); // Let your centralized error handler deal with ZodError
        }
    };
}
//# sourceMappingURL=validation.js.map