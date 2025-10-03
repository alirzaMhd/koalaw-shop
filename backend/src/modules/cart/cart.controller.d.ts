import type { RequestHandler } from "express";
declare class CartController {
    getById: RequestHandler;
    getOrCreateForUser: RequestHandler;
    getOrCreateForAnonymous: RequestHandler;
    addItem: RequestHandler;
    updateItem: RequestHandler;
    removeItem: RequestHandler;
    clear: RequestHandler;
    quote: RequestHandler;
    mergeAnonymousIntoUser: RequestHandler;
    setStatus: RequestHandler;
}
export declare const cartController: CartController;
export {};
//# sourceMappingURL=cart.controller.d.ts.map