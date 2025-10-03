import type { RequestHandler } from "express";
declare class NotificationController {
    sendEmail: RequestHandler;
    sendSms: RequestHandler;
    sendOrderConfirmation: RequestHandler;
    sendPaymentReceipt: RequestHandler;
    sendShippingUpdate: RequestHandler;
    bindDefaultHandlers: RequestHandler;
}
export declare const notificationController: NotificationController;
export {};
//# sourceMappingURL=notification.controller.d.ts.map