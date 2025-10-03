// src/modules/shipping/shipping.routes.ts
// Registers shipping endpoints
import { Router } from "express";
import { shippingController } from "./shipping.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { AppError } from "../../common/errors/AppError.js";
export const shippingRouter = Router();
const requireAdmin = (req, _res, next) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "admin" || role === "manager") return next();
  return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};
// Public: quote shipping (by cartId or subtotal)
shippingRouter.post("/quote", shippingController.quote);
// Admin/internal: create a shipping label (stub) for an order
shippingRouter.post(
  "/labels",
  authGuard,
  requireAdmin,
  shippingController.createLabel
);
// Public: track a shipment by tracking number
shippingRouter.get("/track/:trackingNumber", shippingController.track);
// Default export for routes registry convenience
export default shippingRouter;
//# sourceMappingURL=shipping.routes.js.map
