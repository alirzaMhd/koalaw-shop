// src/common/middlewares/rateLimiter.ts
// Simple rate limiter middleware using Redis if available, otherwise in-memory fallback.
import { AppError } from "../errors/AppError.js";
import { logger } from "../../config/logger.js";
// Try to use shared redis client if present
let redis = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("../../infrastructure/cache/redisClient");
    redis = mod.redis || mod.default || null;
}
catch {
    // optional
}
// In-memory fallback store
const mem = new Map();
function memIncr(key, windowMs) {
    const now = Date.now();
    const e = mem.get(key);
    if (!e || e.resetAt <= now) {
        mem.set(key, { count: 1, resetAt: now + windowMs });
        return 1;
    }
    e.count += 1;
    return e.count;
}
export function rateLimiter(opts) {
    const windowMs = Math.max(1000, opts.windowMs);
    const max = Math.max(1, opts.max);
    const gen = opts.keyGenerator || ((req) => `${req.ip || "ip"}:${req.path}`);
    return async (req, _res, next) => {
        const key = `rl:${gen(req)}`;
        try {
            let count = 0;
            if (redis && typeof redis.incr === "function") {
                count = await redis.incr(key);
                if (count === 1)
                    await redis.pexpire(key, windowMs);
            }
            else {
                count = memIncr(key, windowMs);
            }
            if (count > max) {
                const msg = opts.message || "دفعات درخواست بیش از حد مجاز است. لطفاً بعداً تلاش کنید.";
                throw AppError.tooMany(msg);
            }
            next();
        }
        catch (e) {
            logger.warn({ key }, "Rate limit exceeded");
            next(e);
        }
    };
}
export default rateLimiter;
//# sourceMappingURL=rateLimiter.js.map