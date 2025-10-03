import type { RequestHandler } from "express";
declare class UserController {
    getMe: RequestHandler;
    updateMe: RequestHandler;
    getNotificationPrefs: RequestHandler;
    updateNotificationPrefs: RequestHandler;
    listAddresses: RequestHandler;
    createAddress: RequestHandler;
    updateAddress: RequestHandler;
    deleteAddress: RequestHandler;
    setDefaultAddress: RequestHandler;
    getSummary: RequestHandler;
}
export declare const userController: UserController;
export {};
//# sourceMappingURL=user.controller.d.ts.map