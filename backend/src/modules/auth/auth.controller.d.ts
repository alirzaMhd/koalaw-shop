import type { RequestHandler } from "express";
declare class AuthController {
    register: RequestHandler;
    login: RequestHandler;
    verifyEmail: RequestHandler;
    resendVerification: RequestHandler;
    forgotPassword: RequestHandler;
    resetPassword: RequestHandler;
    refresh: RequestHandler;
    logout: RequestHandler;
    me: RequestHandler;
}
export declare const authController: AuthController;
export {};
//# sourceMappingURL=auth.controller.d.ts.map