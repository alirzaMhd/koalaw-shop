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

async function bootstrap() {
  // Bind domain event handlers
  bindOrderCreatedHandler();
  bindPaymentSucceededHandler();

  // Bind default notification handlers (order.created -> confirmation, payment.succeeded -> receipt)
  // Safe to call multiple times; internal guards prevent double-binding.
  notificationService.bindDefaultHandlers();

  // Optionally start default email worker if queue + mailer are configured
  bindDefaultEmailWorker();

  // Create and start HTTP server
  const app = createApp();
  const port = env.PORT || 3000;
  const host = "0.0.0.0";

  const server = http.createServer(app);

  server.listen(port, host, () => {
    logger.info({ port, env: env.NODE_ENV }, `${env.APP_NAME} API listening on ${host}:${port}`);
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