// src/common/middlewares/optionalAuthGuard.ts
// Optional JWT auth: reads bearer token or httpOnly access cookie, verifies, and attaches req.user.
// If no token or invalid token, continues without error (guest mode).
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
const ACCESS_COOKIE = env.ACCESS_TOKEN_COOKIE_NAME || "at";
const ACCESS_SECRET = String(env.JWT_ACCESS_SECRET || env.JWT_SECRET || "access-secret-dev");
/**
 * Optional authentication middleware.
 * - If valid token present: populates req.user
 * - If no token or invalid: continues as guest (req.user = undefined)
 * - Never throws errors
 */
export const optionalAuthGuard = (req, _res, next) => {
    try {
        // Try to extract token from Authorization header
        const h = req.headers.authorization || "";
        const m = /^Bearer\s+(.+)$/i.exec(h);
        const fromHeader = m?.[1];
        // Fallback to cookie
        const fromCookie = req.cookies?.[ACCESS_COOKIE];
        const token = fromHeader || fromCookie;
        // No token? Continue as guest
        if (!token) {
            return next();
        }
        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, ACCESS_SECRET);
        }
        catch (err) {
            // Invalid/expired token - continue as guest
            logger.debug({ err }, "optionalAuthGuard: token verification failed, continuing as guest");
            return next();
        }
        // Check token type
        if (decoded.typ && decoded.typ !== "access") {
            logger.debug("optionalAuthGuard: wrong token type, continuing as guest");
            return next();
        }
        // Ensure 'sub' exists
        if (typeof decoded.sub !== "string" || decoded.sub.length === 0) {
            logger.debug("optionalAuthGuard: payload 'sub' missing, continuing as guest");
            return next();
        }
        // Populate req.user (same pattern as authGuard)
        const { sub, role, ...rest } = decoded;
        req.user = {
            ...rest,
            id: sub,
            sub,
            ...(typeof role === "string" ? { role } : {}),
        };
        next();
    }
    catch (e) {
        // Any unexpected error - log and continue as guest
        logger.warn({ err: e }, "optionalAuthGuard: unexpected error, continuing as guest");
        next();
    }
};
export default optionalAuthGuard;
//# sourceMappingURL=optionalAuthGuard.js.map