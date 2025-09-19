// src/modules/auth/auth.controller.ts
// Thin HTTP handlers for OTP auth flows. Uses zod validators and authService.

import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { authService } from "./auth.service";
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  logoutSchema,
} from "./auth.validators";

import { AppError } from "../../common/errors/AppError";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

// Cookie config
const ACCESS_COOKIE = env.ACCESS_TOKEN_COOKIE_NAME || "at";
const REFRESH_COOKIE = env.REFRESH_TOKEN_COOKIE_NAME || "rt";
const COOKIE_DOMAIN = env.COOKIE_DOMAIN || undefined;
const COOKIE_PATH = env.COOKIE_PATH || "/";
const COOKIE_SECURE =
  typeof env.COOKIE_SECURE === "string"
    ? env.COOKIE_SECURE === "true"
    : env.NODE_ENV === "production";
const COOKIE_SAME_SITE = (env.COOKIE_SAME_SITE as "lax" | "strict" | "none") || "lax";

// JWT secrets (for decoding logout jti if needed)
const REFRESH_SECRET = String(env.JWT_REFRESH_SECRET || env.JWT_SECRET || "refresh-secret-dev");

type SameSiteOpt = boolean | "lax" | "strict" | "none";

function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

function getClientIp(req: Request): string | undefined {
  const xfwd = (req.headers["x-forwarded-for"] as string) || "";
  return (xfwd.split(",")[0] || req.ip || "").trim() || undefined;
}

function setAuthCookies(
  res: Response,
  opts: {
    accessToken: string;
    accessTokenExpiresAt: number; // epoch ms
    refreshToken: string;
    refreshTokenExpiresAt: number; // epoch ms
  }
) {
  const now = Date.now();
  const accessMs = Math.max(1, opts.accessTokenExpiresAt - now);
  const refreshMs = Math.max(1, opts.refreshTokenExpiresAt - now);

  const base = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE as SameSiteOpt,
    domain: COOKIE_DOMAIN,
    path: COOKIE_PATH,
  } as const;

  res.cookie(ACCESS_COOKIE, opts.accessToken, { ...base, maxAge: accessMs });
  res.cookie(REFRESH_COOKIE, opts.refreshToken, { ...base, maxAge: refreshMs });
}

function clearAuthCookies(res: Response) {
  const base = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE as SameSiteOpt,
    domain: COOKIE_DOMAIN,
    path: COOKIE_PATH,
  } as const;
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}

// If you attach user on req in authGuard, you can add a local type
interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}

class AuthController {
  sendOtp: RequestHandler = async (req, res, next) => {
    try {
      const { phone, recaptchaToken } = await sendOtpSchema.parseAsync(req.body);
      const ip = getClientIp(req);
      const result = await authService.sendOtp({ phone, ip, recaptchaToken });
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      return next(err);
    }
  };

  verifyOtp: RequestHandler = async (req, res, next) => {
    try {
      const { phone, code } = await verifyOtpSchema.parseAsync(req.body);
      const ip = getClientIp(req);
      const userAgent = req.get("user-agent") || undefined;

      const { user, tokens } = await authService.verifyOtp({ phone, code, ip, userAgent });

      // Set httpOnly cookies
      setAuthCookies(res, {
        accessToken: tokens.accessToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshToken: tokens.refreshToken,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      });

      // Return user and token meta (omit raw refreshToken if you prefer cookie-only)
      return ok(
        res,
        {
          user,
          tokens: {
            accessToken: tokens.accessToken,
            accessTokenExpiresAt: tokens.accessTokenExpiresAt,
            refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
            jti: tokens.jti,
          },
        },
        200
      );
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      return next(err);
    }
  };

  refresh: RequestHandler = async (req, res, next) => {
    try {
      const body = await refreshTokenSchema.parseAsync(req.body ?? {});
      const cookieToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      const token = body.refreshToken || cookieToken;
      const ip = getClientIp(req);
      const userAgent = req.get("user-agent") || undefined;

      const { user, tokens } = await authService.refresh({ refreshToken: token, ip, userAgent });

      setAuthCookies(res, {
        accessToken: tokens.accessToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshToken: tokens.refreshToken,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      });

      return ok(
        res,
        {
          user,
          tokens: {
            accessToken: tokens.accessToken,
            accessTokenExpiresAt: tokens.accessTokenExpiresAt,
            refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
            jti: tokens.jti,
          },
        },
        200
      );
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      return next(err);
    }
  };

  logout: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const { all } = await logoutSchema.parseAsync(req.body ?? {});
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      // Try to extract jti from refresh cookie if present
      const rt = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      let jti: string | undefined;
      if (rt) {
        try {
          const dec: any = jwt.verify(rt, REFRESH_SECRET);
          jti = dec?.jti;
        } catch (e) {
          logger.warn({ e }, "Failed to verify refresh cookie during logout");
        }
      }

      const result = await authService.logout({ userId, jti, all });
      clearAuthCookies(res);
      return ok(res, { revoked: result.revoked }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      return next(err);
    }
  };

  me: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const user = await authService.me(String(userId));
      return ok(res, { user }, 200);
    } catch (err) {
      return next(err);
    }
  };
}

export const authController = new AuthController();