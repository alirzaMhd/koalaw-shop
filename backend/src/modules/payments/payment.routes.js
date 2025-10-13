// src/modules/payments/payment.routes.ts
// Registers payment endpoints
import express, { Router } from "express";
import { paymentController } from "./payment.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { AppError } from "../../common/errors/AppError.js";
export const paymentRouter = Router();
const requireAdmin = (req, _res, next) => {
    const role = (req.user?.role || "").toLowerCase();
    if (role === "admin" || role === "manager")
        return next();
    return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};
// ==================== Webhooks (No Auth) ====================
paymentRouter.post("/stripe/webhook", express.raw({ type: "application/json" }), paymentController.stripeWebhook);
paymentRouter.post("/paypal/webhook", paymentController.paypalWebhook);
// ==================== Generic Gateway Return ====================
paymentRouter.get("/return", paymentController.gatewayReturn);
paymentRouter.post("/return", paymentController.gatewayReturn);
// ==================== Zarinpal Return (Public) ====================
paymentRouter.get("/zarinpal/return", paymentController.zarinpalReturn);
paymentRouter.post("/zarinpal/return", paymentController.zarinpalReturn);
// ==================== Admin/Internal Zarinpal Operations ====================
paymentRouter.post("/zarinpal/inquire", authGuard, requireAdmin, paymentController.inquireTransaction);
paymentRouter.get("/zarinpal/unverified", authGuard, requireAdmin, paymentController.getUnverifiedTransactions);
paymentRouter.post("/zarinpal/reverse", authGuard, requireAdmin, paymentController.reverseTransaction);
paymentRouter.post("/zarinpal/calculate-fee", authGuard, requireAdmin, paymentController.calculateFee);
paymentRouter.get("/zarinpal/transactions", authGuard, requireAdmin, paymentController.listTransactions);
paymentRouter.post("/zarinpal/refunds", authGuard, requireAdmin, paymentController.createZarinpalRefund);
// ==================== Admin/Internal Endpoints ====================
paymentRouter.get("/order/:orderId", authGuard, requireAdmin, paymentController.listForOrder);
paymentRouter.post("/orders/:orderId/cod/confirm", authGuard, requireAdmin, paymentController.confirmCodPaid);
paymentRouter.post("/:id/mark-paid", authGuard, requireAdmin, paymentController.markPaid);
paymentRouter.post("/:id/mark-failed", authGuard, requireAdmin, paymentController.markFailed);
paymentRouter.post("/:id/refund", authGuard, requireAdmin, paymentController.refund);
paymentRouter.get("/:id", authGuard, requireAdmin, paymentController.getById);
export default paymentRouter;
//# sourceMappingURL=payment.routes.js.map