// src/modules/auth/auth.service.ts
// OTP-first authentication service for Iran mobile numbers.
// Responsibilities:
// - Send OTP with rate limiting (per phone, per IP), TTL, resend delay
// - Verify OTP, create/find user, issue JWT access/refresh tokens
// - Manage refresh token store (Redis) to support logout/refresh
// - Expose helpers for controllers (me, logout, refresh)
//
// Assumptions for Prisma schema (simplified):
// model User {
//   id        String  @id @default(cuid())
//   phone     String  @unique
//   firstName String? 
//   lastName  String?
//   role      String  @default("customer")
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
//
// You can expand as needed (email, addresses, etc.).

import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../infrastructure/db/prismaClient";
import { redis } from "../../infrastructure/cache/redisClient";
import { logger } from "../../config/logger";
import { env } from "../../config/env";
import { eventBus } from "../../events/eventBus";
import { AppError } from "../../common/errors/AppError";

// Optional utility helpers if you add them to your crypto utils:
// - randomNumeric, hashSHA256, signAccessToken, signRefreshToken
// For now we locally implement minimal versions.
const randomNumeric = (len = 6): string => {
  // cryptographically strong numeric code
  let code = "";
  while (code.length < len) {
    const n = crypto.randomInt(0, 10);
    code += n.toString();
  }
  return code;
};
const sha256 = (s: string) => crypto.createHash("sha256").update(s, "utf8").digest("hex");

// Types
export type JwtTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // epoch ms
  refreshTokenExpiresAt: number; // epoch ms
  jti: string;
};

export type AuthUser = {
  id: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

type OtpRecord = {
  hash: string; // sha256(phone + ":" + code + ":" + salt)
  salt: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number; // epoch ms
  resentCount: number;
  lastSentAt: number; // epoch ms
};

const OTP_LEN = Number(env.AUTH_OTP_DIGITS || 6);
const OTP_TTL_SEC = Number(env.AUTH_OTP_TTL_SEC || 120); // 2 min
const OTP_MAX_ATTEMPTS = Number(env.AUTH_OTP_MAX_ATTEMPTS || 6);
const OTP_RESEND_DELAY_SEC = Number(env.AUTH_OTP_RESEND_DELAY_SEC || 45);

const SEND_LIMIT_WINDOW_SEC = Number(env.AUTH_OTP_SEND_LIMIT_WINDOW_SEC || 600); // 10m
const SEND_LIMIT_PER_PHONE = Number(env.AUTH_OTP_SEND_LIMIT_PER_PHONE || 5);
const SEND_LIMIT_PER_IP = Number(env.AUTH_OTP_SEND_LIMIT_PER_IP || 10);

const ACCESS_EXPIRES = String(env.JWT_ACCESS_EXPIRES_IN || "15m");
const REFRESH_EXPIRES = String(env.JWT_REFRESH_EXPIRES_IN || "30d");
const ACCESS_SECRET = String(env.JWT_ACCESS_SECRET || env.JWT_SECRET || "access-secret-dev");
const REFRESH_SECRET = String(env.JWT_REFRESH_SECRET || env.JWT_SECRET || "refresh-secret-dev");

const APP_NAME = env.APP_NAME || "KOALAW";

// Redis key helpers
const kOtp = (phone: string) => `auth:otp:${phone}`;
const kSendPhone = (phone: string) => `rlim:otp:send:phone:${phone}`;
const kSendIp = (ip: string) => `rlim:otp:send:ip:${ip}`;
const kRefresh = (userId: string, jti: string) => `rtk:${userId}:${jti}`;

// Utilities
const now = () => Date.now();
const msUntil = (epochMs: number) => Math.max(0, epochMs - now());
const sec = (n: number) => n * 1000;

function maskPhone(p: string) {
  const d = p.replace(/\D/g, "");
  return d.replace(/\d(?=\d{4})/g, "•");
}

function parseJwtExpToMs(expiresIn: string | number) {
  // If number is provided as seconds, convert to ms. If string like "15m", "30d" we estimate via jwt sign return.
  // We'll actually compute exact epoch via decoding the token "exp".
  return undefined;
}

function signAccessToken(payload: object): { token: string; expMs: number } {
  const token = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  const { exp } = jwt.decode(token) as { exp: number };
  return { token, expMs: exp * 1000 };
}

function signRefreshToken(payload: object & { jti: string }): { token: string; expMs: number } {
  const token = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  const { exp } = jwt.decode(token) as { exp: number };
  return { token, expMs: exp * 1000 };
}

async function storeRefreshToken(userId: string, jti: string, ttlMs: number, meta?: Record<string, any>) {
  const key = kRefresh(userId, jti);
  const value = JSON.stringify({ ...meta, at: now() });
  // Use PX to set TTL in ms if client supports; fall back to EX seconds
  const ttlSec = Math.ceil(ttlMs / 1000);
  await redis.set(key, value, "EX", ttlSec);
}

async function ensureNotExceeded(key: string, windowSec: number, max: number) {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSec);
  if (count > max) {
    const ttl = (await redis.ttl(key)) || windowSec;
    throw new AppError(`Too many requests. Try again in ${ttl} seconds.`, 429, "TOO_MANY_REQUESTS");
  }
}

async function verifyRecaptcha(token?: string): Promise<boolean> {
  try {
    if (!token) return true; // optional
    const secret = env.RECAPTCHA_SECRET;
    if (!secret) return true; // skip if not configured
    // Node 18+ has global fetch
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (e) {
    logger.warn({ err: e }, "recaptcha verify failed");
    return false;
  }
}

// Service
class AuthService {
  // Send a fresh OTP, enforce resend delay, and per-phone/IP rate limits.
  async sendOtp(params: { phone: string; ip?: string; recaptchaToken?: string }) {
    const { phone, ip, recaptchaToken } = params;

    // Rate limit by phone and IP
    await ensureNotExceeded(kSendPhone(phone), SEND_LIMIT_WINDOW_SEC, SEND_LIMIT_PER_PHONE);
    if (ip) await ensureNotExceeded(kSendIp(ip), SEND_LIMIT_WINDOW_SEC, SEND_LIMIT_PER_IP);

    // Optional reCAPTCHA
    const captchaOk = await verifyRecaptcha(recaptchaToken);
    if (!captchaOk) {
      throw new AppError("اعتبارسنجی امنیتی ناموفق بود.", 400, "BAD_CAPTCHA");
    }

    const key = kOtp(phone);
    const existingRaw = await redis.get(key);
    let record: OtpRecord | null = existingRaw ? (JSON.parse(existingRaw) as OtpRecord) : null;

    // Enforce resend delay if not expired
    if (record) {
      const stillValid = record.expiresAt > now();
      if (stillValid) {
        const nextAllowed = record.lastSentAt + sec(OTP_RESEND_DELAY_SEC);
        if (now() < nextAllowed) {
          const waitSec = Math.ceil(msUntil(nextAllowed) / 1000);
          throw new AppError(`لطفاً ${waitSec} ثانیه صبر کنید.`, 429, "RESEND_TOO_SOON");
        }
      }
    }

    // Generate new OTP
    const code = randomNumeric(OTP_LEN);
    const salt = crypto.randomBytes(8).toString("hex");
    const hash = sha256(`${phone}:${code}:${salt}`);
    const expiresAt = now() + sec(OTP_TTL_SEC);

    const newRecord: OtpRecord = {
      hash,
      salt,
      attempts: record ? record.attempts : 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      expiresAt,
      resentCount: record ? record.resentCount + 1 : 0,
      lastSentAt: now(),
    };
    await redis.set(key, JSON.stringify(newRecord), "EX", OTP_TTL_SEC + 60); // small buffer after expiry

    // Dispatch SMS via eventBus (plug your provider in an event handler)
    const smsPayload = {
      to: phone,
      template: "otp_login",
      code,
      app: APP_NAME,
      ttlSec: OTP_TTL_SEC,
    };
    eventBus.emit("auth.otp.sent", smsPayload);

    if (env.NODE_ENV !== "production") {
      logger.info({ phone: maskPhone(phone), code, ttl: OTP_TTL_SEC }, "OTP sent (dev log)");
    } else {
      logger.info({ phone: maskPhone(phone), ttl: OTP_TTL_SEC }, "OTP sent");
    }

    return {
      phone,
      expiresInSec: OTP_TTL_SEC,
      resendDelaySec: OTP_RESEND_DELAY_SEC,
    };
  }

  // Verify OTP, create/find user, consume OTP, issue tokens, persist refresh token handle.
  async verifyOtp(params: {
    phone: string;
    code: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{ user: AuthUser; tokens: JwtTokens }> {
    const { phone, code, ip, userAgent } = params;
    const key = kOtp(phone);
    const raw = await redis.get(key);

    if (!raw) {
      throw new AppError("کد تایید منقضی شده یا یافت نشد.", 400, "OTP_NOT_FOUND");
    }

    const record = JSON.parse(raw) as OtpRecord;
    if (record.expiresAt <= now()) {
      await redis.del(key);
      throw new AppError("کد تایید منقضی شده است.", 400, "OTP_EXPIRED");
    }
    if (record.attempts >= record.maxAttempts) {
      await redis.del(key);
      throw new AppError("تلاش بیش از حد. لطفاً مجدداً درخواست کد بدهید.", 429, "OTP_ATTEMPTS_EXCEEDED");
    }

    const computed = sha256(`${phone}:${code}:${record.salt}`);
    if (computed !== record.hash) {
      // increment attempts
      record.attempts += 1;
      const remaining = Math.max(0, record.maxAttempts - record.attempts);
      await redis.set(key, JSON.stringify(record), "PX", msUntil(record.expiresAt) + 1000);
      throw new AppError(`کد اشتباه است. تعداد تلاش‌های باقی‌مانده: ${remaining}`, 401, "OTP_INVALID");
    }

    // OTP OK: consume
    await redis.del(key);

    // Upsert user
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, role: "customer" },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Issue tokens
    const jti = crypto.randomUUID();
    const accessPayload = { sub: user.id, role: user.role, typ: "access" as const };
    const refreshPayload = { sub: user.id, role: user.role, typ: "refresh" as const, jti };

    const { token: accessToken, expMs: accessExp } = signAccessToken(accessPayload);
    const { token: refreshToken, expMs: refreshExp } = signRefreshToken(refreshPayload);

    // Store refresh "session" in Redis for blacklist/invalidation
    await storeRefreshToken(user.id, jti, refreshExp - now(), { ip, userAgent });

    eventBus.emit("auth.login", {
      userId: user.id,
      phone: maskPhone(user.phone),
      ip,
      userAgent,
      method: "otp",
    });

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
        accessTokenExpiresAt: accessExp,
        refreshTokenExpiresAt: refreshExp,
        jti,
      },
    };
  }

  // Refresh flow: validate token signature, check Redis allow-list, issue new tokens.
  async refresh(params: {
    refreshToken?: string; // may be read from cookie in controller
    ip?: string;
    userAgent?: string;
  }): Promise<{ user: AuthUser; tokens: JwtTokens }> {
    const { refreshToken, ip, userAgent } = params;
    if (!refreshToken) {
      throw new AppError("توکن یافت نشد.", 401, "NO_TOKEN");
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch {
      throw new AppError("توکن نامعتبر یا منقضی است.", 401, "INVALID_TOKEN");
    }
    const { sub: userId, jti, typ } = decoded || {};
    if (!userId || !jti || typ !== "refresh") {
      throw new AppError("توکن نامعتبر است.", 401, "INVALID_TOKEN");
    }

    // Check store
    const ok = await redis.get(kRefresh(String(userId), String(jti)));
    if (!ok) {
      throw new AppError("نشست منقضی یا لغو شده است.", 401, "SESSION_REVOKED");
    }

    // Load user
    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new AppError("کاربر یافت نشد.", 404, "USER_NOT_FOUND");

    // Rotate jti on refresh
    const newJti = crypto.randomUUID();
    const { token: accessToken, expMs: accessExp } = signAccessToken({ sub: user.id, role: user.role, typ: "access" });
    const { token: newRefresh, expMs: refreshExp } = signRefreshToken({
      sub: user.id,
      role: user.role,
      typ: "refresh",
      jti: newJti,
    });

    // Persist new and revoke old
    await storeRefreshToken(user.id, newJti, refreshExp - now(), { ip, userAgent });
    await redis.del(kRefresh(user.id, jti));

    return {
      user,
      tokens: {
        accessToken,
        refreshToken: newRefresh,
        accessTokenExpiresAt: accessExp,
        refreshTokenExpiresAt: refreshExp,
        jti: newJti,
      },
    };
  }

  // Logout: remove the specific refresh token (by jti decoded from cookie) or all sessions.
  async logout(params: { userId: string; jti?: string; all?: boolean }) {
    const { userId, jti, all } = params;
    if (all) {
      // delete all pattern rtk:userId:*
      const pattern = kRefresh(userId, "*");
      let cursor = "0";
      let total = 0;
      do {
        const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = next;
        if (keys.length) {
          total += keys.length;
          await redis.del(...keys);
        }
      } while (cursor !== "0");
      return { revoked: total };
    } else if (jti) {
      const key = kRefresh(userId, jti);
      const res = await redis.del(key);
      return { revoked: res > 0 ? 1 : 0 };
    } else {
      throw new AppError("پارامتر نامعتبر.", 400, "BAD_REQUEST");
    }
  }

  // Get current user profile
  async me(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new AppError("کاربر یافت نشد.", 404, "USER_NOT_FOUND");
    return user;
  }
}

export const authService = new AuthService();