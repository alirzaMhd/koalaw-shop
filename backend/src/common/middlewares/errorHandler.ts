// src/common/middlewares/errorHandler.ts
// Centralized error handler -> JSON response (RTL-friendly messages)

import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { logger } from "../../config/logger";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Zod validation
  if (err instanceof ZodError) {
    const first = err.issues?.[0];
    const message = first?.message || "داده‌های ارسالی نامعتبر است.";
    const details = err.issues?.map((i) => ({ path: i.path, message: i.message }));
    const status = 422;
    logger.warn({ path: req.path, message, details }, "Validation error");
    return res.status(status).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message, details },
    });
  }

  // AppError
  if (err instanceof AppError) {
    const status = err.httpStatus || 500;
    const payload: any = {
      success: false,
      error: { code: err.code || "APP_ERROR", message: err.message },
    };
    if (err.details) payload.error.details = err.details;
    if (status >= 500) {
      logger.error({ err, path: req.path }, "AppError 5xx");
    } else {
      logger.warn({ err: { code: err.code, msg: err.message }, path: req.path }, "AppError");
    }
    return res.status(status).json(payload);
  }

  // Prisma known errors (best-effort)
  const prismaCode = (err as any)?.code as string | undefined;
  if (prismaCode === "P2002") {
    logger.warn({ err, path: req.path }, "Prisma unique constraint");
    return res.status(409).json({
      success: false,
      error: { code: "CONFLICT", message: "رکورد تکراری است." },
    });
  }

  // Fallback
  logger.error({ err, path: req.path }, "Unhandled error");
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "خطای داخلی سرور." },
  });
};

export default errorHandler;