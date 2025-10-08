// src/modules/reviews/review.routes.ts
import { Router } from "express";
import { reviewController } from "./review.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { optionalAuthGuard } from "../../common/middlewares/optionalAuthGuard.js"; // ← NEW
import { AppError } from "../../common/errors/AppError.js";
export const reviewRouter = Router();
const requireAdmin = (req, _res, next) => {
    const role = (req.user?.role || "").toLowerCase();
    if (role === "admin" || role === "manager")
        return next();
    return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};
// Public: list approved reviews for a product
reviewRouter.get("/products/:productId", reviewController.listForProduct);
// Self: list my reviews (requires auth)
reviewRouter.get("/me", authGuard, reviewController.listMine);
// Public with optional auth: create a review
// - Authenticated users: userId auto-populated from token
// - Guests: must provide guestName in request body
reviewRouter.post("/", optionalAuthGuard, reviewController.create); // ← CHANGED
// Admin: list all reviews with filters
reviewRouter.get("/", authGuard, requireAdmin, reviewController.listAll);
// Admin: moderate a review's status
reviewRouter.patch("/:id/status", authGuard, requireAdmin, reviewController.setStatus);
// Public/Admin: get a review by id
reviewRouter.get("/:id", reviewController.getById);
// Auth: update own review content (owner if not approved; admin anytime)
reviewRouter.patch("/:id", authGuard, reviewController.updateContent);
// Auth: delete own review (if not approved) or admin delete
reviewRouter.delete("/:id", authGuard, reviewController.delete);
export default reviewRouter;
//# sourceMappingURL=review.routes.js.map