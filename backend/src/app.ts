// src/app.ts
// Express app bootstrap: security, parsers, logs, CORS, routes, and error handling.

import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { requestLogger } from "./common/middlewares/requestLogger";
import { errorHandler } from "./common/middlewares/errorHandler";
import { rateLimiter } from "./common/middlewares/rateLimiter";
import buildApiRouter from "./routes";

// Create app
export function createApp() {
  const app = express();

  // Trust proxy if behind a proxy (K8s/Heroku)
  app.set("trust proxy", 1);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS
  const origins = env.corsOrigins.length ? env.corsOrigins : undefined;
  app.use(
    cors({
      origin: origins || true, // allow all in dev if not provided
      credentials: true,
    })
  );

  // Special raw body for Stripe webhook BEFORE json parser (route path-level)
  // This ensures req.body stays as Buffer for signature verification.
  app.use("/api/payments/stripe/webhook", express.raw({ type: "application/json" }));

  // Parsers
  app.use(express.json({ limit: env.JSON_LIMIT }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Compression
  app.use(compression());

  // Request logging
  app.use(requestLogger);

  // Global rate limiter (light); tune or disable if handled per-route
  app.use(
    rateLimiter({
      windowMs: env.rateLimit.windowMs,
      max: env.rateLimit.max,
      keyGenerator: (req) => `${req.ip}:${req.method}:${req.path}`,
    })
  );

  // API routes under /api
  app.use("/api", buildApiRouter());

  // 404 handler for API
  app.use("/api", (_req, res) => {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "مسیر مورد نظر یافت نشد." } });
  });

  // Error handler
  app.use(errorHandler);

  // Basic root
  app.get("/", (_req, res) => res.send(`${env.APP_NAME} API is running`));

  return app;
}

export default createApp;