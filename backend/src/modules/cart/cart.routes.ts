// src/modules/cart/cart.routes.ts
// Registers cart endpoints

import { Router, type Request, type Response, type NextFunction } from "express";
import { cartController } from "./cart.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { AppError } from "../../common/errors/AppError.js";

export const cartRouter = Router();

// Simple role guard (replace with a shared roleGuard if available)
interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}
const requireAdmin = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "admin" || role === "manager") return next();
  return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};
cartRouter.get("/me", authGuard, cartController.getOrCreateForUser);

// Fetch cart by id (public; cart id acts as capability)
cartRouter.get("/:id", cartController.getById);

// User cart (requires auth)


// Anonymous cart (guest flow; body { anonymousId })
cartRouter.post("/anonymous", cartController.getOrCreateForAnonymous);

// Items
cartRouter.post("/:id/items", cartController.addItem);
cartRouter.patch("/:id/items/:itemId", cartController.updateItem);
cartRouter.delete("/:id/items/:itemId", cartController.removeItem);

// Clear all items
cartRouter.post("/:id/clear", cartController.clear);

// Quote (coupon/shipping/giftWrap). Auth optional (used to enforce per-user coupon caps if present).
cartRouter.post("/:id/quote", cartController.quote);

// Merge guest cart into authenticated user cart
cartRouter.post("/merge", authGuard, cartController.mergeAnonymousIntoUser);

// Admin/internal: change cart status
cartRouter.patch("/:id/status", authGuard, requireAdmin, cartController.setStatus);

// Default export for router registration convenience
export default cartRouter;