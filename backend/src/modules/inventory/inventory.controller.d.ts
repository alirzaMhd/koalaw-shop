import type { RequestHandler } from "express";
declare class InventoryController {
    getStock: RequestHandler;
    setStock: RequestHandler;
    adjustStock: RequestHandler;
    reserve: RequestHandler;
    release: RequestHandler;
    verifyCart: RequestHandler;
    reserveCart: RequestHandler;
    reserveOrder: RequestHandler;
    releaseOrder: RequestHandler;
}
export declare const inventoryController: InventoryController;
export {};
//# sourceMappingURL=inventory.controller.d.ts.map