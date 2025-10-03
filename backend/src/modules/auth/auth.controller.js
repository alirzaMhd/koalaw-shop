import jwt from "jsonwebtoken";
import { authService } from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  // NEW:
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validators.js";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
// Cookie config
const ACCESS_COOKIE = env.ACCESS_TOKEN_COOKIE_NAME || "at";
const REFRESH_COOKIE = env.REFRESH_TOKEN_COOKIE_NAME || "rt";
const COOKIE_DOMAIN = env.COOKIE_DOMAIN || undefined;
const COOKIE_PATH = env.COOKIE_PATH || "/";
const COOKIE_SECURE =
  typeof env.COOKIE_SECURE === "string"
    ? env.COOKIE_SECURE === "true"
    : env.NODE_ENV === "production";
const COOKIE_SAME_SITE = env.COOKIE_SAME_SITE || "lax";
const REFRESH_SECRET = String(
  env.JWT_REFRESH_SECRET || env.JWT_SECRET || "refresh-secret-dev"
);
function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}
function getClientIp(req) {
  const xfwd = req.headers["x-forwarded-for"] || "";
  return (xfwd.split(",")[0] || req.ip || "").trim() || undefined;
}
function setAuthCookies(res, opts) {
  const now = Date.now();
  const accessMs = Math.max(1, opts.accessTokenExpiresAt - now);
  const refreshMs = Math.max(1, opts.refreshTokenExpiresAt - now);
  const base = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    domain: COOKIE_DOMAIN,
    path: COOKIE_PATH,
  };
  res.cookie(ACCESS_COOKIE, opts.accessToken, { ...base, maxAge: accessMs });
  res.cookie(REFRESH_COOKIE, opts.refreshToken, { ...base, maxAge: refreshMs });
}
function clearAuthCookies(res) {
  const base = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    domain: COOKIE_DOMAIN,
    path: COOKIE_PATH,
  };
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}
class AuthController {
  register = async (req, res, next) => {
    try {
      const { email, password } = await registerSchema.parseAsync(req.body);
      const ip = getClientIp(req);
      const result = await authService.register({ email, password, ip });
      return ok(
        res,
        {
          user: result.user,
          needsVerification: result.needsVerification,
        },
        201
      );
    } catch (err) {
      if (err?.issues?.length) {
        return next(
          new AppError(err.issues[0].message, 422, "VALIDATION_ERROR")
        );
      }
      return next(err);
    }
  };
  login = async (req, res, next) => {
    try {
      const { email, password } = await loginSchema.parseAsync(req.body);
      const ip = getClientIp(req);
      const userAgent = req.get("user-agent") || undefined;
      const { user, tokens } = await authService.login({
        email,
        password,
        ip,
        userAgent,
      });
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
    } catch (err) {
      if (err?.issues?.length) {
        return next(
          new AppError(err.issues[0].message, 422, "VALIDATION_ERROR")
        );
      }
      return next(err);
    }
  };
  verifyEmail = async (req, res, next) => {
    try {
      const { email, code } = await verifyEmailSchema.parseAsync(req.body);
      const { user, tokens } = await authService.verifyEmail({ email, code });
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
    } catch (err) {
      if (err?.issues?.length) {
        return next(
          new AppError(err.issues[0].message, 422, "VALIDATION_ERROR")
        );
      }
      return next(err);
    }
  };
  resendVerification = async (req, res, next) => {
    try {
      const { email } = await resendVerificationSchema.parseAsync(req.body);
      const result = await authService.resendVerificationCode({ email });
      return ok(res, result, 200);
    } catch (err) {
      if (err?.issues?.length) {
        return next(
          new AppError(err.issues[0].message, 422, "VALIDATION_ERROR")
        );
      }
      return next(err);
    }
  };
  // NEW: Forgot Password
  forgotPassword = async (req, res, next) => {
    try {
      const { email } = await forgotPasswordSchema.parseAsync(req.body);
      const result = await authService.forgotPassword({ email });
      return ok(res, result, 200);
    } catch (err) {
      if (err?.issues?.length) {
        return next(
          new AppError(err.issues[0].message, 422, "VALIDATION_ERROR")
        );
      }
      return next(err);
    }
  };
  // NEW: Reset Password
  resetPassword = async (req, res, next) => {
    try {
      const { email, code, newPassword } = await resetPasswordSchema.parseAsync(
        req.body
      );
      const result = await authService.resetPassword({
        email,
        code,
        newPassword,
      });
      return ok(res, result, 200);
    } catch (err) {
      if (err?.issues?.length) {
        return next(
          new AppError(err.issues[0].message, 422, "VALIDATION_ERROR")
        );
      }
      return next(err);
    }
  };
  refresh = async (req, res, next) => {
    try {
      const body = await refreshTokenSchema.parseAsync(req.body ?? {});
      const cookieToken = req.cookies?.[REFRESH_COOKIE];
      const token = body.refreshToken || cookieToken;
      const ip = getClientIp(req);
      const userAgent = req.get("user-agent") || undefined;
      const { user, tokens } = await authService.refresh({
        refreshToken: token,
        ip,
        userAgent,
      });
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
    } catch (err) {
      if (err?.issues?.length) {
        return next(
          new AppError(err.issues[0].message, 422, "VALIDATION_ERROR")
        );
      }
      return next(err);
    }
  };
  logout = async (req, res, next) => {
    try {
      const { all } = await logoutSchema.parseAsync(req.body ?? {});
      const userId = req.user?.id || req.user?.sub;
      if (!userId)
        throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const rt = req.cookies?.[REFRESH_COOKIE];
      let jti;
      if (rt) {
        try {
          const dec = jwt.verify(rt, REFRESH_SECRET);
          jti = dec?.jti;
        } catch (e) {
          logger.warn({ e }, "Failed to verify refresh cookie during logout");
        }
      }
      const result = await authService.logout({ userId, jti, all });
      clearAuthCookies(res);
      return ok(res, { revoked: result.revoked }, 200);
    } catch (err) {
      if (err?.issues?.length) {
        return next(
          new AppError(err.issues[0].message, 422, "VALIDATION_ERROR")
        );
      }
      return next(err);
    }
  };
  me = async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId)
        throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
      const user = await authService.me(String(userId));
      return ok(res, { user }, 200);
    } catch (err) {
      return next(err);
    }
  };
}
export const authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map
