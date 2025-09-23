// src/modules/auth/auth.service.ts
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../infrastructure/db/prismaClient";
import { redis } from "../../infrastructure/cache/redisClient";
import { eventBus } from "../../events/eventBus";
import { AppError } from "../../common/errors/AppError";
import { env } from "../../config/env";

import { logger } from "../../config/logger";
import {
  normalizeIranPhone,
  isValidIranMobile,
  toLatinDigits,
} from "./auth.validators";

const OTP_DIGITS = Number(env.OTP_DIGITS ?? 6);
const OTP_TTL_SEC = Number(env.OTP_TTL_SEC ?? 120);
const OTP_MAX_ATTEMPTS = Number(env.OTP_MAX_ATTEMPTS ?? 5);
const OTP_RATE_LIMIT_MAX = Number(env.OTP_RATE_LIMIT_MAX ?? 3);
const OTP_RATE_LIMIT_WINDOW_SEC = Number(env.OTP_RATE_LIMIT_WINDOW_SEC ?? 60);
const OTP_PEPPER = String(env.OTP_CODE_PEPPER ?? "otp-pepper");

// JWT
const ACCESS_SECRET = String(env.JWT_ACCESS_SECRET || env.JWT_SECRET || "access-secret-dev");
const REFRESH_SECRET = String(env.JWT_REFRESH_SECRET || env.JWT_SECRET || "refresh-secret-dev");
const ACCESS_TTL_SEC = Number(env.JWT_ACCESS_TTL_SEC ?? 15 * 60); // 15m
const REFRESH_TTL_SEC = Number(env.JWT_REFRESH_TTL_SEC ?? 30 * 24 * 60 * 60); // 30d

// App name/template for SMS
const APP_NAME = String(env.APP_NAME || "App");
const VERIFY_TEMPLATE =
  (env as any).KAVENEGAR_VERIFY_TEMPLATE || process.env.KAVENEGAR_VERIFY_TEMPLATE;

function randomCode(digits: number): string {
  const max = 10 ** digits;
  return crypto.randomInt(0, max).toString().padStart(digits, "0");
}

function hashCode(phone: string, code: string): string {
  return crypto
    .createHash("sha256")
    .update(`${phone}:${code}:${OTP_PEPPER}`)
    .digest("hex");
}

function nowMs() {
  return Date.now();
}

function signAccessToken(userId: string) {
  const expiresAt = nowMs() + ACCESS_TTL_SEC * 1000;
  const token = jwt.sign({ sub: userId }, ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: ACCESS_TTL_SEC,
  });
  return { token, expiresAt };
}

function signRefreshToken(userId: string) {
  const jti = crypto.randomUUID();
  const expiresAt = nowMs() + REFRESH_TTL_SEC * 1000;
  const token = jwt.sign({ sub: userId, jti }, REFRESH_SECRET, {
    algorithm: "HS256",
    expiresIn: REFRESH_TTL_SEC,
  });
  return { token, expiresAt, jti };
}

async function storeRefreshSession(jti: string, payload: any) {
  const key = `session:rt:${jti}`;
  await redis.set(key, JSON.stringify(payload), "EX", REFRESH_TTL_SEC);
}

async function getRefreshSession(jti: string) {
  const key = `session:rt:${jti}`;
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
}

async function revokeRefreshSession(jti: string) {
  const key = `session:rt:${jti}`;
  const del = await redis.del(key);
  return del > 0;
}

export const authService = {
  async sendOtp(args: { phone: string; ip?: string; recaptchaToken?: string }) {
    const phone = normalizeIranPhone(args.phone);
    if (!isValidIranMobile(phone)) {
      throw new AppError("شماره موبایل معتبر نیست.", 422, "VALIDATION_ERROR");
    }

    // Basic phone rate limit
    const rlKey = `otp:rl:${phone}`;
    const count = await redis.incr(rlKey);
    if (count === 1) {
      await redis.expire(rlKey, OTP_RATE_LIMIT_WINDOW_SEC);
    }
    if (count > OTP_RATE_LIMIT_MAX) {
      throw new AppError(
        "درخواست‌های بیش از حد. لطفاً چند لحظه بعد تلاش کنید.",
        429,
        "TOO_MANY_REQUESTS"
      );
    }

    // Generate & store hashed OTP
    const code = randomCode(OTP_DIGITS);
    const h = hashCode(phone, code);
    const otpKey = `otp:${phone}`;
    const attKey = `otp:a:${phone}`;

    // Store hash and reset attempts with same TTL
    await redis.set(otpKey, h, "EX", OTP_TTL_SEC);
    await redis.set(attKey, "0", "EX", OTP_TTL_SEC);

    // Fire event for Kavenegar sender
    eventBus.emit("auth.otp.sent", {
      to: phone,
      template: VERIFY_TEMPLATE,
      code,
      app: APP_NAME,
      ttlSec: OTP_TTL_SEC,
    });

    return { sent: true, ttlSec: OTP_TTL_SEC };
  },

  async verifyOtp(args: { phone: string; code: string; ip?: string; userAgent?: string }) {
    const phone = normalizeIranPhone(args.phone);
    const code = toLatinDigits(String(args.code)).replace(/\D/g, "");

    if (!isValidIranMobile(phone)) {
      throw new AppError("شماره موبایل معتبر نیست.", 422, "VALIDATION_ERROR");
    }
    if (!/^\d{6}$/.test(code)) {
      throw new AppError("کد تایید باید ۶ رقم باشد.", 422, "VALIDATION_ERROR");
    }

    const otpKey = `otp:${phone}`;
    const attKey = `otp:a:${phone}`;

    const storedHash = await redis.get(otpKey);
    if (!storedHash) {
      throw new AppError(
        "کد معتبر پیدا نشد یا منقضی شده است. دوباره ارسال کنید.",
        400,
        "OTP_NOT_FOUND"
      );
    }

    const attempts = Number((await redis.get(attKey)) || "0");
    if (attempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError(
        "تعداد تلاش‌ها بیش از حد است. لطفاً دوباره درخواست کد دهید.",
        429,
        "TOO_MANY_ATTEMPTS"
      );
    }

    const providedHash = hashCode(phone, code);
    if (providedHash !== storedHash) {
      await redis.incr(attKey);
      throw new AppError("کد وارد شده صحیح نیست.", 400, "OTP_INVALID");
    }

    // OTP ok: cleanup
    await redis.del(otpKey);
    await redis.del(attKey);

    // Find or create user by phone
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone },
      });
    }

    // Issue tokens
    const { token: accessToken, expiresAt: accessTokenExpiresAt } = signAccessToken(String(user.id));
    const { token: refreshToken, expiresAt: refreshTokenExpiresAt, jti } = signRefreshToken(String(user.id));

    await storeRefreshSession(jti, {
      userId: String(user.id),
      phone,
      ip: args.ip,
      userAgent: args.userAgent,
      createdAt: new Date().toISOString(),
    });

    return {
      user: {
        id: user.id,
        phone: user.phone,
      },
      tokens: {
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        jti,
      },
    };
  },

  async refresh(args: { refreshToken?: string; ip?: string; userAgent?: string }) {
    if (!args.refreshToken) {
      throw new AppError("توکن یافت نشد.", 401, "UNAUTHORIZED");
    }
    let payload: any;
    try {
      payload = jwt.verify(args.refreshToken, REFRESH_SECRET);
    } catch {
      throw new AppError("توکن نامعتبر است.", 401, "UNAUTHORIZED");
    }
    const userId = String(payload?.sub || "");
    const jti = String(payload?.jti || "");

    if (!userId || !jti) {
      throw new AppError("توکن نامعتبر است.", 401, "UNAUTHORIZED");
    }

    const session = await getRefreshSession(jti);
    if (!session) {
      throw new AppError("نشست معتبر یافت نشد.", 401, "UNAUTHORIZED");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("کاربر یافت نشد.", 401, "UNAUTHORIZED");
    }

    // Rotate refresh token
    await revokeRefreshSession(jti);
    const { token: accessToken, expiresAt: accessTokenExpiresAt } = signAccessToken(userId);
    const { token: refreshToken, expiresAt: refreshTokenExpiresAt, jti: newJti } = signRefreshToken(userId);
    await storeRefreshSession(newJti, {
      userId,
      ip: args.ip,
      userAgent: args.userAgent,
      rotatedFrom: jti,
      createdAt: new Date().toISOString(),
    });

    return {
      user: {
        id: user.id,
        phone: user.phone,
      },
      tokens: {
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        jti: newJti,
      },
    };
  },

  async logout(args: { userId: string; jti?: string; all?: boolean }) {
    let revoked = false;

    if (args.jti) {
      revoked = await revokeRefreshSession(args.jti);
    }
    // For "logout all" sessions, maintain a per-user set of jtis in Redis (not implemented here).

    return { revoked };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("کاربر یافت نشد.", 404, "NOT_FOUND");
    return {
      id: user.id,
      phone: user.phone,
    };
  },
};