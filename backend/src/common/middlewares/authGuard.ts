// src/common/middlewares/authGuard.ts
// JWT auth guard: reads bearer token or httpOnly access cookie, verifies, and attaches req.user.

import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";
import { env } from "../../config/env.js";

const ACCESS_COOKIE = env.ACCESS_TOKEN_COOKIE_NAME || "at";
const ACCESS_SECRET = String(env.JWT_ACCESS_SECRET || env.JWT_SECRET || "access-secret-dev");

interface Decoded {
  sub?: string;
  role?: string;
  typ?: string;
  [k: string]: any;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: { id?: string; sub?: string; role?: string; [k: string]: any };
  }
}

export const authGuard: RequestHandler = (req, _res, next) => {
  try {
    const h = req.headers.authorization || "";
    const m = /^Bearer\s+(.+)$/i.exec(h);
    const fromHeader = m?.[1];

    const fromCookie = (req as any).cookies?.[ACCESS_COOKIE];

    const token = fromHeader || fromCookie;
    if (!token) throw AppError.unauthorized();

    let decoded: Decoded;
    try {
      decoded = jwt.verify(token, ACCESS_SECRET) as any;
    } catch {
      throw AppError.unauthorized("توکن نامعتبر یا منقضی است.");
    }
    if (decoded.typ && decoded.typ !== "access") {
      throw AppError.unauthorized("نوع توکن نامعتبر است.");
    }

    req.user = {
      id: decoded.sub,
      sub: decoded.sub,
      role: decoded.role,
      ...decoded,
    };
    next();
  } catch (e) {
    next(e);
  }
};

export default authGuard;