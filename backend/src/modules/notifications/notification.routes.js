// src/modules/notifications/notification.routes.ts
// Registers notification endpoints
import { Router } from "express";
import { notificationController } from "./notification.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { AppError } from "../../common/errors/AppError.js";
export const notificationRouter = Router();
const requireAdmin = (req, _res, next) => {
    const role = (req.user?.role || "").toLowerCase();
    if (role === "admin" || role === "manager")
        return next();
    return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};
// Admin/internal: send email via template or raw html/text
notificationRouter.post("/email", authGuard, requireAdmin, notificationController.sendEmail);
// Admin/internal: send SMS
notificationRouter.post("/sms", authGuard, requireAdmin, notificationController.sendSms);
// Admin/internal: order-related notifications
notificationRouter.post("/orders/:orderId/confirm", authGuard, requireAdmin, notificationController.sendOrderConfirmation);
notificationRouter.post("/orders/:orderId/payments/:paymentId/receipt", authGuard, requireAdmin, notificationController.sendPaymentReceipt);
notificationRouter.post("/orders/:orderId/shipping", authGuard, requireAdmin, notificationController.sendShippingUpdate);
// Admin/internal: bind default event handlers (order.created, payment.succeeded)
notificationRouter.post("/bind-defaults", authGuard, requireAdmin, notificationController.bindDefaultHandlers);
// Default export for router registration convenience
export default notificationRouter;
//# sourceMappingURL=notification.routes.js.map