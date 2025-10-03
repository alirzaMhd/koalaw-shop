// src/modules/auth/auth.service.ts
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { redis } from "../../infrastructure/cache/redisClient.js";
import { eventBus } from "../../events/eventBus.js";
import { mailer } from "../../infrastructure/mail/mailer.js";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

// JWT
const ACCESS_SECRET = String(env.JWT_ACCESS_SECRET || env.JWT_SECRET || "access-secret-dev");
const REFRESH_SECRET = String(env.JWT_REFRESH_SECRET || env.JWT_SECRET || "refresh-secret-dev");
const ACCESS_TTL_SEC = Number(env.JWT_ACCESS_TTL_SEC ?? 15 * 60);
const REFRESH_TTL_SEC = Number(env.JWT_REFRESH_TTL_SEC ?? 30 * 24 * 60 * 60);
const BCRYPT_ROUNDS = Number(env.BCRYPT_ROUNDS ?? 12);

// Email verification
const EMAIL_VERIFICATION_TTL_SEC = 600; // 10 minutes

function nowMs() {
  return Date.now();
}

function signAccessToken(userId: string, role: string) {
  const expiresAt = nowMs() + ACCESS_TTL_SEC * 1000;
  const token = jwt.sign({ sub: userId, role, typ: "access" }, ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: ACCESS_TTL_SEC,
  });
  return { token, expiresAt };
}

function signRefreshToken(userId: string) {
  const jti = crypto.randomUUID();
  const expiresAt = nowMs() + REFRESH_TTL_SEC * 1000;
  const token = jwt.sign({ sub: userId, jti, typ: "refresh" }, REFRESH_SECRET, {
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

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function storeVerificationCode(email: string, code: string) {
  const key = `email:verify:${email}`;
  await redis.set(key, code, "EX", EMAIL_VERIFICATION_TTL_SEC);
}

async function getVerificationCode(email: string): Promise<string | null> {
  const key = `email:verify:${email}`;
  return await redis.get(key);
}

async function deleteVerificationCode(email: string) {
  const key = `email:verify:${email}`;
  await redis.del(key);
}

async function storePasswordResetCode(email: string, code: string) {
  const key = `password:reset:${email}`;
  await redis.set(key, code, "EX", EMAIL_VERIFICATION_TTL_SEC);
}

async function getPasswordResetCode(email: string): Promise<string | null> {
  const key = `password:reset:${email}`;
  return await redis.get(key);
}

async function deletePasswordResetCode(email: string) {
  const key = `password:reset:${email}`;
  await redis.del(key);
}

export const authService = {
  async register(args: { email: string; password: string; ip?: string }) {
    const { email, password } = args;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("این ایمیل قبلاً ثبت شده است.", 409, "EMAIL_EXISTS");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (unverified)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    // Emit event
    eventBus.emit("user.registered", {
      userId: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });

    // Generate and send verification code
    const code = generateVerificationCode();
    await storeVerificationCode(email, code);

    // Send email
    try {
      await mailer.sendMail({
        to: email,
        subject: "کد تایید ایمیل - KOALAW",
        html: `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px; background: #faf8f3;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #ec4899; text-align: center; margin-bottom: 20px;">خوش آمدید به KOALAW</h1>
              <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">برای تکمیل ثبت‌نام، کد زیر را وارد کنید:</p>
              <div style="background: #fef2f2; border: 2px dashed #ec4899; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <h2 style="font-size: 36px; color: #ec4899; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</h2>
              </div>
              <p style="font-size: 14px; color: #6b7280; text-align: center;">این کد تا ۱۰ دقیقه دیگر معتبر است.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p>
            </div>
          </div>
        `,
        text: `خوش آمدید به KOALAW\n\nکد تایید شما: ${code}\n\nاین کد تا ۱۰ دقیقه دیگر معتبر است.`,
      });
    } catch (err) {
      logger.error({ err }, "Failed to send verification email");
      throw new AppError("خطا در ارسال ایمیل تایید.", 500, "EMAIL_SEND_FAILED");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      needsVerification: true,
    };
  },

  async login(args: { email: string; password: string; ip?: string; userAgent?: string }) {
    const { email, password } = args;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("ایمیل یا رمز عبور اشتباه است.", 401, "INVALID_CREDENTIALS");
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError("ایمیل یا رمز عبور اشتباه است.", 401, "INVALID_CREDENTIALS");
    }

    // Check if email is verified
    if (!user.emailVerifiedAt) {
      throw new AppError("لطفاً ابتدا ایمیل خود را تایید کنید.", 403, "EMAIL_NOT_VERIFIED");
    }

    // Generate tokens
    const { token: accessToken, expiresAt: accessTokenExpiresAt } = signAccessToken(
      String(user.id),
      user.role
    );
    const {
      token: refreshToken,
      expiresAt: refreshTokenExpiresAt,
      jti,
    } = signRefreshToken(String(user.id));

    await storeRefreshSession(jti, {
      userId: String(user.id),
      email: user.email,
      ip: args.ip,
      userAgent: args.userAgent,
      createdAt: new Date().toISOString(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
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

  async verifyEmail(args: { email: string; code: string }) {
    const { email, code } = args;

    // Get stored code
    const storedCode = await getVerificationCode(email);
    if (!storedCode) {
      throw new AppError("کد تایید منقضی شده یا یافت نشد.", 400, "CODE_EXPIRED");
    }

    // Verify code
    if (storedCode !== code) {
      throw new AppError("کد تایید اشتباه است.", 400, "INVALID_CODE");
    }

    // Update user with current timestamp
    const user = await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });

    // Delete verification code
    await deleteVerificationCode(email);

    // Generate tokens
    const { token: accessToken, expiresAt: accessTokenExpiresAt } = signAccessToken(
      String(user.id),
      user.role
    );
    const {
      token: refreshToken,
      expiresAt: refreshTokenExpiresAt,
      jti,
    } = signRefreshToken(String(user.id));

    await storeRefreshSession(jti, {
      userId: String(user.id),
      email: user.email,
      createdAt: new Date().toISOString(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
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

  async resendVerificationCode(args: { email: string }) {
    const { email } = args;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("کاربر یافت نشد.", 404, "NOT_FOUND");
    }

    if (user.emailVerifiedAt) {
      throw new AppError("ایمیل قبلاً تایید شده است.", 400, "ALREADY_VERIFIED");
    }

    // Generate new code
    const code = generateVerificationCode();
    await storeVerificationCode(email, code);

    // Send email
    try {
      await mailer.sendMail({
        to: email,
        subject: "کد تایید ایمیل - KOALAW",
        html: `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px; background: #faf8f3;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #ec4899; text-align: center; margin-bottom: 20px;">کد تایید جدید</h1>
              <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">کد تایید جدید شما:</p>
              <div style="background: #fef2f2; border: 2px dashed #ec4899; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <h2 style="font-size: 36px; color: #ec4899; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</h2>
              </div>
              <p style="font-size: 14px; color: #6b7280; text-align: center;">این کد تا ۱۰ دقیقه دیگر معتبر است.</p>
            </div>
          </div>
        `,
        text: `کد تایید جدید شما: ${code}\n\nاین کد تا ۱۰ دقیقه دیگر معتبر است.`,
      });
    } catch (err) {
      logger.error({ err }, "Failed to resend verification email");
      throw new AppError("خطا در ارسال ایمیل.", 500, "EMAIL_SEND_FAILED");
    }

    return { ttlSec: EMAIL_VERIFICATION_TTL_SEC };
  },

  // In src/modules/auth/auth.service.ts

  async forgotPassword(args: { email: string }) {
    const { email } = args;

    // 1) Check if user exists — if not, don't send any code
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("کاربر یافت نشد.", 404, "NOT_FOUND");
    }

    // Optional: Require verified email to reset password
    if (!user.emailVerifiedAt) {
      throw new AppError(
        "لطفاً ابتدا ایمیل خود را تایید کنید.",
        403,
        "EMAIL_NOT_VERIFIED"
      );
    }

    // 2) Generate and store reset code
    const code = generateVerificationCode();
    await storePasswordResetCode(email, code);

    // 3) Send email with reset code
    try {
      await mailer.sendMail({
        to: email,
        subject: "بازیابی رمز عبور - KOALAW",
        html: `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px; background: #faf8f3;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h1 style="color: #ec4899; text-align: center; margin-bottom: 20px;">بازیابی رمز عبور</h1>
              <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">برای تنظیم رمز عبور جدید، کد زیر را وارد کنید:</p>
              <div style="background: #fef2f2; border: 2px dashed #ec4899; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <h2 style="font-size: 36px; color: #ec4899; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</h2>
              </div>
              <p style="font-size: 14px; color: #6b7280; text-align: center;">این کد تا ۱۰ دقیقه دیگر معتبر است.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p>
            </div>
          </div>
        `,
        text: `بازیابی رمز عبور - KOALAW\n\nکد بازیابی شما: ${code}\n\nاین کد تا ۱۰ دقیقه دیگر معتبر است.`,
      });
    } catch (err) {
      logger.error({ err }, "Failed to send password reset email");
      throw new AppError("خطا در ارسال ایمیل.", 500, "EMAIL_SEND_FAILED");
    }

    return { ttlSec: EMAIL_VERIFICATION_TTL_SEC };
  },

  async resetPassword(args: { email: string; code: string; newPassword: string }) {
    const { email, code, newPassword } = args;

    // Verify code
    const storedCode = await getPasswordResetCode(email);

    if (!storedCode) {
      throw new AppError("کد بازیابی منقضی شده یا یافت نشد.", 400, "CODE_EXPIRED");
    }

    if (storedCode !== code) {
      throw new AppError("کد بازیابی اشتباه است.", 400, "INVALID_CODE");
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("کاربر یافت نشد.", 404, "NOT_FOUND");
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete reset code
    await deletePasswordResetCode(email);

    // Emit event for security logging
    eventBus.emit("user.password.reset", {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    // Optional: Revoke all existing refresh tokens for security
    // This forces user to login again on all devices
    try {
      const pattern = `session:rt:*`;
      const keys = await redis.keys(pattern);
      
      for (const key of keys) {
        const sessionData = await redis.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.userId === String(user.id)) {
            await redis.del(key);
          }
        }
      }
    } catch (err) {
      logger.warn({ err, userId: user.id }, "Failed to revoke sessions after password reset");
      // Don't throw error, password was already reset successfully
    }

    return { success: true };
  },

  async refresh(args: { refreshToken?: string | undefined; ip?: string | undefined; userAgent?: string | undefined }) {
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

    await revokeRefreshSession(jti);
    const { token: accessToken, expiresAt: accessTokenExpiresAt } = signAccessToken(
      userId,
      user.role
    );
    const {
      token: refreshToken,
      expiresAt: refreshTokenExpiresAt,
      jti: newJti,
    } = signRefreshToken(userId);

    await storeRefreshSession(newJti, {
      userId,
      email: user.email,
      ip: args.ip,
      userAgent: args.userAgent,
      rotatedFrom: jti,
      createdAt: new Date().toISOString(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
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

  async logout(args: { userId: string; jti?: string | undefined; all?: boolean | undefined }) {
    let revoked = false;
    if (args.jti) {
      revoked = await revokeRefreshSession(args.jti);
    }
    
    // If logout all sessions
    if (args.all) {
      try {
        const pattern = `session:rt:*`;
        const keys = await redis.keys(pattern);
        let count = 0;
        
        for (const key of keys) {
          const sessionData = await redis.get(key);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.userId === args.userId) {
              await redis.del(key);
              count++;
            }
          }
        }
        
        logger.info({ userId: args.userId, count }, "Revoked all sessions for user");
        revoked = count > 0;
      } catch (err) {
        logger.error({ err, userId: args.userId }, "Failed to revoke all sessions");
      }
    }
    
    return { revoked };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("کاربر یافت نشد.", 404, "NOT_FOUND");
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  },
};