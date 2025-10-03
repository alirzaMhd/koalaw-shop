import type { RequestHandler } from "express";
export declare const uploadMiddleware: RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
declare class ProfileController {
    getProfile: RequestHandler;
    getOrders: RequestHandler;
    updateProfile: RequestHandler;
    updateNotificationPrefs: RequestHandler;
    uploadProfileImage: RequestHandler;
    getAddresses: RequestHandler;
    createAddress: RequestHandler;
    updateAddress: RequestHandler;
    deleteAddress: RequestHandler;
    setDefaultAddress: RequestHandler;
}
export declare const profileController: ProfileController;
export {};
//# sourceMappingURL=profile.controller.d.ts.map