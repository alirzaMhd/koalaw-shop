// src/infrastructure/queue/workers/newsletter.worker.ts
import { Worker, Job } from "bullmq";
import getRedisConnection from "../bullmq.js";
import { newsletterService } from "../../../modules/newsletter/newsletter.service.js";
import { logger } from "../../../config/logger.js";
// Create worker for the "email" queue, filtering by job name
export const newsletterWorker = new Worker("email", // Use the existing "email" queue
async (job) => {
    const { name, data } = job;
    logger.info({ jobId: job.id, name, email: data.email }, "Processing newsletter job");
    try {
        switch (name) {
            case "newsletter-welcome":
                await newsletterService.sendWelcomeEmail(data.email);
                logger.info({ jobId: job.id, email: data.email }, "Welcome email sent");
                break;
            case "newsletter-unsubscribe":
                await newsletterService.sendUnsubscribeConfirmationEmail(data.email);
                logger.info({ jobId: job.id, email: data.email }, "Unsubscribe confirmation sent");
                break;
            case "newsletter-broadcast":
                const broadcastData = data;
                await newsletterService.sendNewsletterEmail({
                    email: broadcastData.email,
                    subject: broadcastData.subject,
                    htmlContent: broadcastData.htmlContent,
                    textContent: broadcastData.textContent,
                });
                logger.info({ jobId: job.id, email: broadcastData.email }, "Newsletter broadcast sent");
                break;
            default:
                // Not a newsletter job, skip silently
                logger.debug({ jobId: job.id, name }, "Skipping non-newsletter job");
                return;
        }
    }
    catch (error) {
        logger.error({ jobId: job.id, name, data, error: error instanceof Error ? error.message : error }, "Newsletter job failed");
        throw error; // Re-throw to trigger BullMQ retry logic
    }
}, {
    connection: getRedisConnection,
    concurrency: 5, // Process 5 emails concurrently
    limiter: {
        max: 100, // Max 100 emails
        duration: 60000, // per minute (60 seconds)
    },
    // Only process newsletter jobs
    // (Note: BullMQ will still fetch all jobs, but we filter in the processor)
});
// Event listeners for monitoring
newsletterWorker.on("completed", (job) => {
    logger.info({ jobId: job.id, name: job.name }, "Newsletter job completed successfully");
});
newsletterWorker.on("failed", (job, err) => {
    logger.error({
        jobId: job?.id,
        name: job?.name,
        error: err.message,
        attempts: job?.attemptsMade,
        maxAttempts: job?.opts?.attempts,
    }, "Newsletter job failed");
});
newsletterWorker.on("error", (err) => {
    logger.error({ error: err.message }, "Newsletter worker error");
});
newsletterWorker.on("stalled", (jobId) => {
    logger.warn({ jobId }, "Newsletter job stalled");
});
logger.info("Newsletter worker started and listening for jobs");
export default newsletterWorker;
//# sourceMappingURL=newsletter.worker.js.map