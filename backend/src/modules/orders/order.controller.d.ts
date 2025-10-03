import type { RequestHandler } from "express";
declare class OrderController {
    listMine: RequestHandler;
    listAll: RequestHandler;
    getMineById: RequestHandler;
    getById: RequestHandler;
    getByNumber: RequestHandler;
    updateStatus: RequestHandler;
    cancel: RequestHandler;
    markPaymentSucceeded: RequestHandler;
    markPaymentFailed: RequestHandler;
    reorder: RequestHandler;
}
export declare const orderController: OrderController;
export {};
//# sourceMappingURL=order.controller.d.ts.map