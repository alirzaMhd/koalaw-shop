// src/modules/inventory/inventory.routes.ts
// Registers inventory endpoints

import { Router, Request, Response, NextFunction } from "express";
import { inventoryController } from "./inventory.controller";
import { authGuard } from "../../common/middlewares/authGuard";
import { AppError } from "../../common/errors/AppError";

export const inventoryRouter = Router();

// Simple role guard (replace with a shared roleGuard if available)
interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}
const requireAdmin = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "admin" || role === "manager") return next();
  return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};

// Admin-only stock management
inventoryRouter.get("/variants/:variantId/stock", authGuard, requireAdmin, inventoryController.getStock);
inventoryRouter.patch("/variants/:variantId/stock", authGuard, requireAdmin, inventoryController.setStock);
inventoryRouter.patch("/variants/:variantId/adjust", authGuard, requireAdmin, inventoryController.adjustStock);

// Admin/internal batch ops
inventoryRouter.post("/reserve", authGuard, requireAdmin, inventoryController.reserve);
inventoryRouter.post("/release", authGuard, requireAdmin, inventoryController.release);

// Cart-oriented (authenticated)
inventoryRouter.get("/carts/:cartId/verify", authGuard, inventoryController.verifyCart);
inventoryRouter.post("/carts/:cartId/reserve", authGuard, inventoryController.reserveCart);

// Order-oriented (admin/internal)
inventoryRouter.post("/orders/:orderId/reserve", authGuard, requireAdmin, inventoryController.reserveOrder);
inventoryRouter.post("/orders/:orderId/release", authGuard, requireAdmin, inventoryController.releaseOrder);

// Default export for router registration convenience
export default inventoryRouter;