import type { RequestHandler } from "express";
declare module "express-serve-static-core" {
    interface Request {
        user?: {
            id?: string;
            sub?: string;
            role?: string;
            [k: string]: any;
        };
    }
}
export declare const authGuard: RequestHandler;
export default authGuard;
//# sourceMappingURL=authGuard.d.ts.map