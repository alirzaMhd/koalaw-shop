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
/**
 * Optional authentication middleware.
 * - If valid token present: populates req.user
 * - If no token or invalid: continues as guest (req.user = undefined)
 * - Never throws errors
 */
export declare const optionalAuthGuard: RequestHandler;
export default optionalAuthGuard;
//# sourceMappingURL=optionalAuthGuard.d.ts.map