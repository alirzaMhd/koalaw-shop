// src/common/utils/crypto.ts
// Crypto and JWT helpers

import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

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

const ACCESS_SECRET = String(env.JWT_ACCESS_SECRET || env.JWT_SECRET || "access-secret-dev");
const REFRESH_SECRET = String(env.JWT_REFRESH_SECRET || env.JWT_SECRET || "refresh-secret-dev");
const ACCESS_EXPIRES = String(env.JWT_ACCESS_EXPIRES_IN || "15m");
const REFRESH_EXPIRES = String(env.JWT_REFRESH_EXPIRES_IN || "30d");

export function signAccessToken(payload: object) {
  const token = jwt.sign(payload as any, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  const { exp } = jwt.decode(token) as any;
  return { token, expMs: exp * 1000 };
}

export function signRefreshToken(payload: object) {
  const token = jwt.sign(payload as any, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  const { exp } = jwt.decode(token) as any;
  return { token, expMs: exp * 1000 };
}

export function verifyAccessToken(token: string): any {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): any {
  return jwt.verify(token, REFRESH_SECRET);
}