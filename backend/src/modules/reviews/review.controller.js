// src/modules/reviews/review.controller.ts
// Thin HTTP handlers for product reviews: list, create, edit, moderate, delete.
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";
import { reviewService } from "./review.service.js";
import logger from "../../config/logger.js";
function ok(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
}
// ---------------- Validators ----------------
const uuid = z.string().uuid({ message: "شناسه نامعتبر است." });
const posInt = z.coerce.number().int().min(1).default(1);
const statusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
const listQuerySchema = z
    .object({
    page: posInt.default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(12),
    status: statusEnum.optional(),
})
    .transform((q) => {
    // FIX 1: Only include status if defined
    const result = {
        page: q.page,
        perPage: q.perPage,
    };
    if (q.status !== undefined) {
        result.status = q.status;
    }
    return result;
});
const adminListQuerySchema = z
    .object({
    page: posInt.default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(12),
    productId: uuid.optional(),
    status: statusEnum.optional(),
    userId: uuid.optional(),
    search: z.string().trim().max(300).optional(),
})
    .transform((q) => {
    // FIX 2: Only include optional properties if defined
    const result = {
        page: q.page,
        perPage: q.perPage,
    };
    if (q.productId !== undefined)
        result.productId = q.productId;
    if (q.status !== undefined)
        result.status = q.status;
    if (q.userId !== undefined)
        result.userId = q.userId;
    if (q.search !== undefined)
        result.search = q.search;
    return result;
});
const idParam = z.object({ id: uuid });
const productParam = z.object({ productId: uuid });
const createSchema = z
    .object({
    productId: uuid,
    rating: z.coerce.number().int("امتیاز باید صحیح باشد.").min(1, "حداقل امتیاز ۱ است.").max(5, "حداکثر امتیاز ۵ است."),
    title: z.string().trim().max(200).optional().nullable(),
    body: z.string().trim().min(3, "متن نظر خیلی کوتاه است.").max(4000, "متن نظر بیش از حد طولانی است."),
    guestName: z.string().trim().max(100).optional().nullable(),
})
    .strict();
const updateContentSchema = z
    .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    title: z.string().trim().max(200).optional().nullable(),
    body: z.string().trim().max(4000).optional().nullable(),
})
    .strict();
const statusSchema = z.object({ status: statusEnum });
/**
 * Extract requester identity and role
 */
function getRequester(req) {
    const userId = (req.user?.id || req.user?.sub);
    const role = (req.user?.role || "").toLowerCase();
    const isAdmin = role === "admin" || role === "manager";
    return { userId, isAdmin };
}
// ---------------- Controller ----------------
class ReviewController {
    // Public: GET /reviews/products/:productId
    listForProduct = async (req, res, next) => {
        try {
            const { productId } = await productParam.parseAsync(req.params);
            const q = await listQuerySchema.parseAsync(req.query);
            const result = await reviewService.listForProduct(productId, q);
            return ok(res, result, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // Admin: GET /reviews
    listAll = async (req, res, next) => {
        try {
            const q = await adminListQuerySchema.parseAsync(req.query);
            const result = await reviewService.listAll(q);
            return ok(res, result, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // Public/Admin: GET /reviews/:id
    getById = async (req, res, next) => {
        try {
            const { id } = await idParam.parseAsync(req.params);
            const item = await reviewService.getById(id);
            return ok(res, { review: item }, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // Self: GET /reviews/me
    listMine = async (req, res, next) => {
        try {
            const { userId } = getRequester(req);
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const q = await z
                .object({
                page: posInt.default(1),
                perPage: z.coerce.number().int().min(1).max(100).default(12),
            })
                .transform((v) => ({ page: v.page, perPage: v.perPage }))
                .parseAsync(req.query);
            const result = await reviewService.listMine(userId, q);
            return ok(res, result, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // POST /reviews (auth optional; guestName required when unauthenticated)
    // In review.controller.ts, update the create method
    create = async (req, res, next) => {
        try {
            const body = await createSchema.parseAsync(req.body ?? {});
            const { userId } = getRequester(req);
            // DEBUG: Remove after testing
            logger.debug({
                userId,
                hasReqUser: !!req.user,
                guestName: body.guestName,
                productId: body.productId,
            }, "Review creation request");
            const review = await reviewService.create({
                productId: body.productId,
                rating: body.rating,
                body: body.body,
                title: body.title ?? null,
                userId: userId ?? null,
                guestName: userId ? null : body.guestName ?? null,
            });
            return ok(res, { review }, 201);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // PATCH /reviews/:id (owner can edit while not approved; admin can edit anytime)
    updateContent = async (req, res, next) => {
        try {
            const { id } = await idParam.parseAsync(req.params);
            const body = await updateContentSchema.parseAsync(req.body ?? {});
            const { userId, isAdmin } = getRequester(req);
            // FIX 3: Only include properties that are defined
            const updateData = {
                id,
                requesterUserId: userId ?? null,
                isAdmin,
            };
            if (body.rating !== undefined)
                updateData.rating = body.rating;
            if (body.title !== undefined)
                updateData.title = body.title;
            if (body.body !== undefined)
                updateData.body = body.body;
            const review = await reviewService.updateContent(updateData);
            return ok(res, { review }, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // PATCH /reviews/:id/status (admin)
    setStatus = async (req, res, next) => {
        try {
            const { id } = await idParam.parseAsync(req.params);
            const body = await statusSchema.parseAsync(req.body ?? {});
            const role = (req.user?.role || "").toLowerCase();
            const isAdmin = role === "admin" || role === "manager";
            if (!isAdmin)
                throw new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN");
            const review = await reviewService.setStatus(id, body.status);
            return ok(res, { review }, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
    // DELETE /reviews/:id (owner if not approved, or admin)
    delete = async (req, res, next) => {
        try {
            const { id } = await idParam.parseAsync(req.params);
            const { userId, isAdmin } = getRequester(req);
            const result = await reviewService.delete(id, { requesterUserId: userId ?? null, isAdmin });
            return ok(res, result, 200);
        }
        catch (err) {
            if (err?.issues?.length)
                return next(new AppError(err?.issues[0].message, 422, "VALIDATION_ERROR"));
            next(err);
        }
    };
}
export const reviewController = new ReviewController();
//# sourceMappingURL=review.controller.js.map