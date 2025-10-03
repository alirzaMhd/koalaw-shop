import type { RequestHandler } from "express";
export declare function rateLimiter(opts: {
    windowMs: number;
    max: number;
    keyGenerator?: (req: any) => string;
    message?: string;
}): RequestHandler;
export default rateLimiter;
//# sourceMappingURL=rateLimiter.d.ts.map