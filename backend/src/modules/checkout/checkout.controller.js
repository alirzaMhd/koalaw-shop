// src/modules/checkout/checkout.controller.ts
// Thin HTTP handlers for checkout: quote and create order from cart.
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";
import { checkoutService } from "./checkout.service.js";
function ok(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
}
// Local helpers (fallback normalizer for client cart lines)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUUID = (v) => UUID_RE.test(String(v || ""));
function normalizeClientLines(arr = []) {
    return arr
        .map((l) => {
        const title = String(l?.title || "").trim();
        const unitPrice = Number(l?.unitPrice ?? l?.price ?? 0);
        const quantity = Math.max(1, Math.floor(Number(l?.quantity ?? l?.qty ?? 1)));
        if (!title || !Number.isFinite(unitPrice) || unitPrice < 0 || quantity <= 0)
            return null;
        return {
            title,
            unitPrice,
            quantity,
            productId: isUUID(l?.productId) ? String(l.productId) : undefined,
            variantId: isUUID(l?.variantId) ? String(l.variantId) : undefined,
            variantName: typeof l?.variantName === "string" ? l.variantName : typeof l?.variant === "string" ? l.variant : undefined,
            imageUrl: typeof l?.imageUrl === "string" ? l.imageUrl : typeof l?.image === "string" ? l.image : undefined,
            currencyCode: typeof l?.currencyCode === "string" ? l.currencyCode : undefined,
        };
    })
        .filter(Boolean);
}
// ---------------- Validators ----------------
const uuidSchema = z.string().trim().min(1, "Invalid cart id.");
const shippingMethodEnum = z.enum(["standard", "express"]);
const paymentMethodEnum = z.enum(["gateway", "cod"]);
const quoteSchema = z
    .object({
    cartId: uuidSchema,
    couponCode: z.string().trim().max(64).optional().nullable(),
    shippingMethod: shippingMethodEnum.optional(),
    giftWrap: z.coerce.boolean().optional().default(false),
})
    .strict();
const addressSchema = z
    .object({
    firstName: z.string().trim().min(1, "نام الزامی است."),
    lastName: z.string().trim().min(1, "نام خانوادگی الزامی است."),
    phone: z.string().trim().min(5, "شماره تماس الزامی است."),
    postalCode: z.string().trim().max(20).optional().nullable(),
    province: z.string().trim().min(1, "استان الزامی است."),
    city: z.string().trim().min(1, "شهر الزامی است."),
    addressLine1: z.string().trim().min(5, "نشانی را کامل‌تر وارد کنید."),
    addressLine2: z.string().trim().optional().nullable(),
    country: z.string().trim().length(2).optional(),
})
    .strict();
const lineSchema = z
    .object({
    title: z.string().trim().min(1),
    unitPrice: z.coerce.number().int().min(0),
    quantity: z.coerce.number().int().min(1),
    productId: z.string().uuid().optional().nullable(),
    variantId: z.string().uuid().optional().nullable(),
    variantName: z.string().trim().optional().nullable(),
    // Allow relative asset paths or absolute URLs
    imageUrl: z.string().trim().min(1).optional().nullable(),
    currencyCode: z.string().trim().max(8).optional(),
})
    .strict();
const baseCreateOrderSchema = z
    .object({
    cartId: uuidSchema,
    address: addressSchema,
    paymentMethod: paymentMethodEnum,
    shippingMethod: shippingMethodEnum.optional(),
    couponCode: z.string().trim().max(64).optional().nullable(),
    giftWrap: z.coerce.boolean().optional().default(false),
    note: z.string().trim().max(2000).optional().nullable(),
    returnUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(), lines: z.array(lineSchema).optional(),
    items: z.array(lineSchema).optional(),
    clientCart: z.array(lineSchema).optional(),
    cart: z.array(lineSchema).optional(),
})
    .strict();
const createOrderSchema = baseCreateOrderSchema.transform((v) => {
    const lines = (Array.isArray(v.lines) && v.lines.length && v.lines) ||
        (Array.isArray(v.items) && v.items.length && v.items) ||
        (Array.isArray(v.clientCart) && v.clientCart.length && v.clientCart) ||
        (Array.isArray(v.cart) && v.cart.length && v.cart) ||
        [];
    return { ...v, lines };
});
// ---------------- Controller ----------------
class CheckoutController {
    // POST /checkout/quote
    quote = async (req, res, next) => {
        try {
            const body = await quoteSchema.parseAsync(req.body ?? {});
            const userId = (req.user?.id || req.user?.sub);
            const quote = await checkoutService.prepareQuote(body.cartId, {
                couponCode: body.couponCode || undefined,
                giftWrap: body.giftWrap,
                userId,
                // Conditionally add shippingMethod only if it's provided
                ...(body.shippingMethod && { shippingMethod: body.shippingMethod }),
            });
            return ok(res, { quote }, 200);
        }
        catch (err) {
            if (err?.issues?.length) {
                return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
            }
            next(err);
        }
    };
    // POST /checkout/order (auth recommended)
    createOrderFromCart = async (req, res, next) => {
        try {
            const body = await createOrderSchema.parseAsync(req.body ?? {});
            // Fallback: if lines didn't pass schema (aliases/types), normalize from raw body
            let lines = Array.isArray(body.lines) ? body.lines : [];
            if (!lines.length && req.body) {
                const raw = req.body;
                const rawArr = raw?.lines || raw?.items || raw?.clientCart || raw?.cart;
                if (Array.isArray(rawArr)) {
                    lines = normalizeClientLines(rawArr);
                }
            }
            const userId = (req.user?.id || req.user?.sub);
            const result = await checkoutService.createOrderFromCart({
                cartId: body.cartId,
                userId,
                address: body.address,
                options: {
                    paymentMethod: body.paymentMethod,
                    couponCode: body.couponCode || undefined,
                    giftWrap: body.giftWrap,
                    note: body.note || null,
                    userId, // for coupon usage caps
                    // Conditionally add shippingMethod only if it's provided
                    ...(body.shippingMethod && { shippingMethod: body.shippingMethod }),
                },
                returnUrl: body.returnUrl,
                cancelUrl: body.cancelUrl,
                lines,
            });
            // 201 Created since we created an order/payment record
            return ok(res, result, 201);
        }
        catch (err) {
            if (err?.issues?.length) {
                return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
            }
            next(err);
        }
    };
}
export const checkoutController = new CheckoutController();
//# sourceMappingURL=checkout.controller.js.map