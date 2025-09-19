// src/modules/shipping/shipping.routes.ts
// Registers shipping endpoints

import { Router, Request, Response, NextFunction } from "express";
import { shippingController } from "./shipping.controller";
import { authGuard } from "../../common/middlewares/authGuard";
import { AppError } from "../../common/errors/AppError";

export const shippingRouter = Router();

// Simple role guard (replace with a shared roleGuard if available)
interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}
const requireAdmin = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "admin" || role === "manager") return next();
  return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};

// Public: quote shipping (by cartId or subtotal)
shippingRouter.post("/quote", shippingController.quote);

// Admin/internal: create a shipping label (stub) for an order
shippingRouter.post("/labels", authGuard, requireAdmin, shippingController.createLabel);

// Public: track a shipment by tracking number
shippingRouter.get("/track/:trackingNumber", shippingController.track);

// Default export for routes registry convenience
export default shippingRouter;