// src/modules/orders/order.routes.ts
// Registers order endpoints

import { Router, Request, Response, NextFunction } from "express";
import { orderController } from "./order.controller";
import { authGuard } from "../../common/middlewares/authGuard";
import { AppError } from "../../common/errors/AppError";

export const orderRouter = Router();

// Simple role guard (replace with a shared roleGuard if available)
interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}
const requireAdmin = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "admin" || role === "manager") return next();
  return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};

// Self (authenticated user)
orderRouter.get("/me", authGuard, orderController.listMine);
orderRouter.get("/me/:id", authGuard, orderController.getMineById);
orderRouter.post("/:id/reorder", authGuard, orderController.reorder);
// Allow authenticated users to request cancellation of their order
orderRouter.post("/:id/cancel", authGuard, orderController.cancel);

// Admin endpoints (more specific path comes before generic :id)
orderRouter.get("/", authGuard, requireAdmin, orderController.listAll);
orderRouter.get("/number/:orderNumber", authGuard, requireAdmin, orderController.getByNumber);
orderRouter.get("/:id", authGuard, requireAdmin, orderController.getById);
orderRouter.patch("/:id/status", authGuard, requireAdmin, orderController.updateStatus);

// Internal/webhook-style endpoints (protect behind auth/signature as needed)
orderRouter.post("/:id/payments/:paymentId/succeeded", authGuard, requireAdmin, orderController.markPaymentSucceeded);
orderRouter.post("/:id/payments/:paymentId/failed", authGuard, requireAdmin, orderController.markPaymentFailed);

// Default export for router registration convenience
export default orderRouter;