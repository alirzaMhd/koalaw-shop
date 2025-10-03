// src/common/utils/crypto.ts
import crypto from "crypto";
import jwt, { type JwtPayload, type SignOptions, type Secret } from "jsonwebtoken";
import { env } from "../../config/env.js";

export function hashSHA256(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}
export function hmacSHA256(secret: string, input: string): string {
  return crypto.createHmac("sha256", secret).update(input, "utf8").digest("hex");
}
export function randomBytesHex(len = 16): string {
  return crypto.randomBytes(len).toString("hex");
}
export function randomNumeric(len = 6): string {
  let out = "";
  while (out.length < len) {
    out += crypto.randomInt(0, 10).toString();
  }
  return out;
}

const ACCESS_SECRET: Secret = env.JWT_ACCESS_SECRET ?? env.JWT_SECRET ?? "access-secret-dev";
const REFRESH_SECRET: Secret = env.JWT_REFRESH_SECRET ?? env.JWT_SECRET ?? "refresh-secret-dev";

type Expires = NonNullable<SignOptions["expiresIn"]>;
const ACCESS_EXPIRES: Expires = (env.JWT_ACCESS_EXPIRES_IN ?? "15m") as Expires;
const REFRESH_EXPIRES: Expires = (env.JWT_REFRESH_EXPIRES_IN ?? "30d") as Expires;

export function signAccessToken(payload: object) {
  const token = jwt.sign(payload as any, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  const decoded = jwt.decode(token) as JwtPayload | string | null;
  const expMs =
    decoded && typeof decoded === "object" && typeof decoded.exp === "number"
      ? decoded.exp * 1000
      : undefined;
  return { token, expMs };
}

export function signRefreshToken(payload: object) {
  const token = jwt.sign(payload as any, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  const decoded = jwt.decode(token) as JwtPayload | string | null;
  const expMs =
    decoded && typeof decoded === "object" && typeof decoded.exp === "number"
      ? decoded.exp * 1000
      : undefined;
  return { token, expMs };
}

export function verifyAccessToken(token: string): any {
  return jwt.verify(token, ACCESS_SECRET);
}
export function verifyRefreshToken(token: string): any {
  return jwt.verify(token, REFRESH_SECRET);
}