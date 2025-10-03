// src/modules/payments/payment.routes.ts
// Registers payment endpoints
import express, { Router } from "express";
import { paymentController } from "./payment.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { AppError } from "../../common/errors/AppError.js";
export const paymentRouter = Router();
const requireAdmin = (req, _res, next) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "admin" || role === "manager") return next();
  return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};
// Webhooks (no auth; Stripe requires raw body)
paymentRouter.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook
);
paymentRouter.post("/paypal/webhook", paymentController.paypalWebhook);
// Generic gateway return (support both GET and POST)
paymentRouter.get("/return", paymentController.gatewayReturn);
paymentRouter.post("/return", paymentController.gatewayReturn);
// Admin/internal endpoints
paymentRouter.get(
  "/order/:orderId",
  authGuard,
  requireAdmin,
  paymentController.listForOrder
);
paymentRouter.post(
  "/orders/:orderId/cod/confirm",
  authGuard,
  requireAdmin,
  paymentController.confirmCodPaid
);
paymentRouter.post(
  "/:id/mark-paid",
  authGuard,
  requireAdmin,
  paymentController.markPaid
);
paymentRouter.post(
  "/:id/mark-failed",
  authGuard,
  requireAdmin,
  paymentController.markFailed
);
paymentRouter.post(
  "/:id/refund",
  authGuard,
  requireAdmin,
  paymentController.refund
);
paymentRouter.get("/:id", authGuard, requireAdmin, paymentController.getById);
// Default export for router registration convenience
export default paymentRouter;
//# sourceMappingURL=payment.routes.js.map
