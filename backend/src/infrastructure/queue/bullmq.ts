// src/infrastructure/queue/bullmq.ts
// BullMQ queues and optional default workers. Uses the same Redis as cache (by URL or host configs).

import { Queue, Worker, QueueEvents } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

// Export connection factory function
export function getRedisConnection() {
  if (env.REDIS_URL) return { url: String(env.REDIS_URL) };
  return {
    host: env.REDIS_HOST || "127.0.0.1",
    port: Number(env.REDIS_PORT || 6379),
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB ? Number(env.REDIS_DB) : undefined,
    tls: String(env.REDIS_TLS || "false") === "true" ? {} : undefined,
  };
}

// Legacy function name for backwards compatibility
function connection() {
  return getRedisConnection();
}

// Common queues
export const emailQueue = new Queue("email", { connection: connection() });
export const webhooksQueue = new Queue("webhooks", { connection: connection() });

export const emailQueueEvents = new QueueEvents("email", { connection: connection() });
emailQueueEvents.on("failed", ({ jobId, failedReason }) =>
  logger.warn({ jobId, failedReason }, "email job failed")
);
emailQueueEvents.on("completed", ({ jobId }) => logger.debug({ jobId }, "email job completed"));

// Optional: default email worker (process "email.send") if enabled
let emailWorker: Worker | null = null;

export function bindDefaultEmailWorker() {
  if (emailWorker) return emailWorker;
  try {
    // Lazy load mailer to avoid circular deps if not needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("../mail/mailer");
    const mailer = mod.mailer || mod.default || mod;
    if (!mailer?.sendMail && !mailer?.send) {
      logger.warn("Mailer not available; email worker not bound.");
      return null;
    }
    emailWorker = new Worker(
      "email",
      async (job) => {
        const payload = job.data;
        if (typeof mailer.sendMail === "function") {
          await mailer.sendMail(payload);
        } else if (typeof mailer.send === "function") {
          await mailer.send(payload);
        }
      },
      { connection: connection(), concurrency: Number(env.QUEUE_EMAIL_CONCURRENCY || 5) }
    );
    emailWorker.on("failed", (job, err) => logger.warn({ jobId: job?.id, err }, "email worker failed"));
    emailWorker.on("completed", (job) => logger.debug({ jobId: job?.id }, "email worker completed"));
    logger.info("Default email worker bound.");
  } catch (e) {
    logger.warn({ err: e }, "Failed to bind default email worker");
  }
  return emailWorker;
}

export const queues = { email: emailQueue, webhooks: webhooksQueue };
export default queues;