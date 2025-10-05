// src/common/utils/crypto.ts
import crypto from "crypto";
import jwt, {} from "jsonwebtoken";
import { env } from "../../config/env.js";
export function hashSHA256(input) {
    return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}
export function hmacSHA256(secret, input) {
    return crypto.createHmac("sha256", secret).update(input, "utf8").digest("hex");
}
export function randomBytesHex(len = 16) {
    return crypto.randomBytes(len).toString("hex");
}
export function randomNumeric(len = 6) {
    let out = "";
    while (out.length < len) {
        out += crypto.randomInt(0, 10).toString();
    }
    return out;
}
const ACCESS_SECRET = env.JWT_ACCESS_SECRET ?? env.JWT_SECRET ?? "access-secret-dev";
const REFRESH_SECRET = env.JWT_REFRESH_SECRET ?? env.JWT_SECRET ?? "refresh-secret-dev";
const ACCESS_EXPIRES = (env.JWT_ACCESS_EXPIRES_IN ?? "15m");
const REFRESH_EXPIRES = (env.JWT_REFRESH_EXPIRES_IN ?? "30d");
export function signAccessToken(payload) {
    const token = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
    const decoded = jwt.decode(token);
    const expMs = decoded && typeof decoded === "object" && typeof decoded.exp === "number"
        ? decoded.exp * 1000
        : undefined;
    return { token, expMs };
}
export function signRefreshToken(payload) {
    const token = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
    const decoded = jwt.decode(token);
    const expMs = decoded && typeof decoded === "object" && typeof decoded.exp === "number"
        ? decoded.exp * 1000
        : undefined;
    return { token, expMs };
}
export function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET);
}
//# sourceMappingURL=crypto.js.map