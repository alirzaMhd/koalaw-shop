// src/modules/cart/cart.controller.ts
// Thin HTTP handlers for cart CRUD, items, merge, and quote.
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";
import { cartService } from "./cart.service.js";
function ok(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
}
// ---------------- Validators ----------------
const uuidSchema = z.string().uuid({ message: "شناسه نامعتبر است." });
const cartIdParam = z.object({ id: uuidSchema });
const itemIdParam = z.object({ itemId: uuidSchema });
const getAnonCartSchema = z.object({
    anonymousId: uuidSchema,
});
const addItemSchema = z.object({
    productId: uuidSchema,
    variantId: z.string().uuid().nullable().default(null),
    quantity: z.coerce.number().int("تعداد باید صحیح باشد.").min(1, "حداقل تعداد ۱ است.").optional().default(1),
});
const updateItemSchema = z.object({
    quantity: z.coerce.number().int("تعداد باید صحیح باشد.").min(0, "تعداد نمی‌تواند منفی باشد."),
});
const quoteSchema = z.object({
    couponCode: z.string().trim().max(64).optional().nullable(),
    shippingMethod: z.enum(["standard", "express"]).optional(),
    giftWrap: z.coerce.boolean().optional().default(false),
});
const mergeSchema = z.object({
    anonymousId: uuidSchema,
});
const setStatusSchema = z.object({
    status: z.enum(["ACTIVE", "CONVERTED", "ABANDONED"]),
});
// ---------------- Controller ----------------
class CartController {
    // GET /carts/:id
    getById = async (req, res, next) => {
        try {
            const { id } = await cartIdParam.parseAsync(req.params);
            const cart = await cartService.getById(id);
            return ok(res, { cart }, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // GET /carts/me (auth)
    getOrCreateForUser = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const cart = await cartService.getOrCreateForUser(String(userId));
            return ok(res, { cart }, 200);
        }
        catch (err) {
            next(err);
        }
    };
    // POST /carts/anonymous
    getOrCreateForAnonymous = async (req, res, next) => {
        try {
            const { anonymousId } = await getAnonCartSchema.parseAsync(req.body ?? {});
            const cart = await cartService.getOrCreateForAnonymous(anonymousId);
            return ok(res, { cart }, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // POST /carts/:id/items
    addItem = async (req, res, next) => {
        try {
            const { id } = await cartIdParam.parseAsync(req.params);
            const body = await addItemSchema.parseAsync(req.body ?? {});
            const item = await cartService.addItem(id, body);
            return ok(res, { item }, 201);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // PATCH /carts/:id/items/:itemId
    updateItem = async (req, res, next) => {
        try {
            const { id } = await cartIdParam.parseAsync(req.params);
            const { itemId } = await itemIdParam.parseAsync(req.params);
            const body = await updateItemSchema.parseAsync(req.body ?? {});
            const result = await cartService.updateItem(id, itemId, body);
            return ok(res, { item: result }, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // DELETE /carts/:id/items/:itemId
    removeItem = async (req, res, next) => {
        try {
            const { id } = await cartIdParam.parseAsync(req.params);
            const { itemId } = await itemIdParam.parseAsync(req.params);
            const result = await cartService.removeItem(id, itemId);
            return ok(res, result, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // POST /carts/:id/clear
    clear = async (req, res, next) => {
        try {
            const { id } = await cartIdParam.parseAsync(req.params);
            const result = await cartService.clear(id);
            return ok(res, result, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // POST /carts/:id/quote
    quote = async (req, res, next) => {
        try {
            const { id } = await cartIdParam.parseAsync(req.params);
            const body = await quoteSchema.parseAsync(req.body ?? {});
            const userId = (req.user?.id || req.user?.sub);
            const result = await cartService.quote(id, {
                couponCode: body.couponCode || undefined,
                shippingMethod: body.shippingMethod,
                giftWrap: body.giftWrap,
                userId,
            });
            return ok(res, { quote: result }, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // POST /carts/merge (auth)
    mergeAnonymousIntoUser = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const { anonymousId } = await mergeSchema.parseAsync(req.body ?? {});
            const cart = await cartService.mergeAnonymousIntoUser(String(userId), anonymousId);
            return ok(res, { cart }, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // PATCH /carts/:id/status (admin/internal)
    setStatus = async (req, res, next) => {
        try {
            const { id } = await cartIdParam.parseAsync(req.params);
            const { status } = await setStatusSchema.parseAsync(req.body ?? {});
            const cart = await cartService.setStatus(id, status);
            return ok(res, { cart }, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err.issues[0]?.message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
}
export const cartController = new CartController();
//# sourceMappingURL=cart.controller.js.map