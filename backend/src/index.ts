// src/index.ts
// Server bootstrap: loads env, creates Express app, binds event handlers/workers, and starts HTTP.

import http from "http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import createApp from "./app";

// Infra for graceful shutdown
import { prisma } from "./infrastructure/db/prismaClient";
import { redis } from "./infrastructure/cache/redisClient";
import { emailQueue, webhooksQueue, bindDefaultEmailWorker } from "./infrastructure/queue/bullmq";

// Domain event handlers
import { bindOrderCreatedHandler } from "./events/handlers/order.created.handler";
import { bindPaymentSucceededHandler } from "./events/handlers/payment.succeeded.handler";
import { notificationService } from "./modules/notifications/notification.service";
// NEW: bind OTP SMS handler
import { bindAuthOtpSentHandler } from "./events/handlers/auth.otp.handler";

// Elasticsearch
import { ping as esPing } from "./infrastructure/search/elastic.client";
import { ensureSearchIndices } from "./modules/search/search.service";

async function bootstrap() {
  // Bind domain event handlers
  bindOrderCreatedHandler();
  bindPaymentSucceededHandler();
  // NEW: bind Kavenegar OTP sender
  bindAuthOtpSentHandler();

  // Bind default notification handlers
  notificationService.bindDefaultHandlers();

  // Optionally start default email worker if queue + mailer are configured
  bindDefaultEmailWorker();

  // Ensure Elasticsearch is reachable and indices exist
  try {
    const ok = await esPing();
    if (!ok) logger.warn("Elasticsearch not reachable at startup");
    await ensureSearchIndices();
  } catch (e) {
    logger.warn({ err: e }, "Failed ensuring Elasticsearch indices");
  }

  // Create and start HTTP server
  const app = createApp();
  const port = env.PORT || 3000;
  const host = "0.0.0.0";

  const server = http.createServer(app);

  server.listen(port, host, () => {
    logger.info(
      { port, env: env.NODE_ENV },
      `${env.APP_NAME} API listening on ${host}:${port}`
    );
  });

  // ---- Graceful shutdown ----
  const shutdown = async (signal?: string) => {
    try {
      logger.info({ signal }, "Shutting down gracefully…");
      await new Promise<void>((resolve) => server.close(() => resolve()));

      // Close queues
      try {
        await emailQueue.close();
        await webhooksQueue.close();
      } catch (e) {
        logger.warn({ err: e }, "Failed closing BullMQ queues");
      }

      // Disconnect prisma
      try {
        await prisma.$disconnect();
      } catch (e) {
        logger.warn({ err: e }, "Prisma disconnect failed");
      }

      // Quit redis
      try {
        await redis.quit();
      } catch (e) {
        logger.warn({ err: e }, "Redis quit failed");
      }

      logger.info("Shutdown complete. Bye!");
      process.exit(0);
    } catch (e) {
      logger.error({ err: e }, "Shutdown error");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception");
    shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason: any) => {
    logger.error({ err: reason }, "Unhandled promise rejection");
    shutdown("unhandledRejection");
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Bootstrap failed");
  process.exit(1);
});