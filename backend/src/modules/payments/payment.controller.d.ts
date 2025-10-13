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
    zarinpalReturn: RequestHandler;
    inquireTransaction: RequestHandler;
    getUnverifiedTransactions: RequestHandler;
    reverseTransaction: RequestHandler;
    calculateFee: RequestHandler;
    listTransactions: RequestHandler;
    createZarinpalRefund: RequestHandler;
}
export declare const paymentController: PaymentController;
export {};
//# sourceMappingURL=payment.controller.d.ts.map