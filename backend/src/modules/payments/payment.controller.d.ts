import type { RequestHandler } from "express";
declare class PaymentController {
    getById: RequestHandler;
    listForOrder: RequestHandler;
    markPaid: RequestHandler;
    markFailed: RequestHandler;
    refund: RequestHandler;
    stripeWebhook: RequestHandler;
    paypalWebhook: RequestHandler;
    gatewayReturn: RequestHandler;
    confirmCodPaid: RequestHandler;
}
export declare const paymentController: PaymentController;
export {};
//# sourceMappingURL=payment.controller.d.ts.map