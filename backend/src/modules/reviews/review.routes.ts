// src/modules/reviews/review.routes.ts
// Registers review endpoints

import { Router, Request, Response, NextFunction } from "express";
import { reviewController } from "./review.controller";
import { authGuard } from "../../common/middlewares/authGuard";
import { AppError } from "../../common/errors/AppError";

export const reviewRouter = Router();

// Simple role guard (replace with a shared roleGuard if available)
interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}
const requireAdmin = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "admin" || role === "manager") return next();
  return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};

// Public: list approved reviews for a product
reviewRouter.get("/products/:productId", reviewController.listForProduct);

// Self: list my reviews
reviewRouter.get("/me", authGuard, reviewController.listMine);

// Public: create a review (auth optional; guests must provide guestName)
reviewRouter.post("/", reviewController.create);

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

// Default export for router registration convenience
export default reviewRouter;