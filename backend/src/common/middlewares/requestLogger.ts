// src/common/middlewares/requestLogger.ts
// Request logger (method, path, status, duration) + request id propagation.

import type { RequestHandler } from "express";
import { logger } from "../../config/logger.js";
import crypto from "crypto";

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();
  const reqId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  res.setHeader("x-request-id", reqId);
  (res as any).locals = (res as any).locals || {};
  (res as any).locals.reqId = reqId;

  const { method, originalUrl } = req;
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    logger.info(
      {
        reqId,
        method,
        path: originalUrl,
        status: res.statusCode,
        durationMs: Math.round(ms),
      },
      "HTTP"
    );
  });
  next();
};

export default requestLogger;