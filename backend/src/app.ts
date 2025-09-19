// src/app.ts
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { requestLogger } from "./common/middlewares/requestLogger";
import { errorHandler } from "./common/middlewares/errorHandler";
import { rateLimiter } from "./common/middlewares/rateLimiter";
import buildApiRouter from "./routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());

  const origins = env.corsOrigins.length ? env.corsOrigins : undefined;
  app.use(
    cors({
      origin: origins || true,
      credentials: true,
    })
  );

  // Stripe webhook raw body BEFORE json parser
  app.use("/api/payments/stripe/webhook", express.raw({ type: "application/json" }));

  app.use(express.json({ limit: env.JSON_LIMIT }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(compression());
  app.use(requestLogger);

  app.use(
    rateLimiter({
      windowMs: env.rateLimit.windowMs,
      max: env.rateLimit.max,
      keyGenerator: (req) => `${req.ip}:${req.method}:${req.path}`,
    })
  );

  // Serve static assets (put your 404.html under public/404.html)
  app.use(express.static(path.resolve(process.cwd(), "public")));

  // API routes
  app.use("/api", buildApiRouter());

  // 404 handler for API (JSON)
  app.use("/api", (_req, res) => {
    res
      .status(404)
      .json({ success: false, error: { code: "NOT_FOUND", message: "مسیر مورد نظر یافت نشد." } });
  });

  // Optional root
  app.get("/", (_req, res) => res.send(`${env.APP_NAME} API is running`));

  // Non-API 404 -> serve 404.html
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next(); // safety, though API 404 above handles it
    res.status(404).sendFile(path.resolve(process.cwd(), "../../frontend/src/pages/404.html"));
  });

  // Error handler LAST
  app.use(errorHandler);

  return app;
}

export default createApp;