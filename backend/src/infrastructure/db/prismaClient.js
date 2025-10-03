// src/infrastructure/db/prismaClient.ts
// Prisma client singleton with sensible logging and hot-reload safety in dev.
import { PrismaClient } from "@prisma/client";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
const isProd = env.NODE_ENV === "production";
const prismaLog = [{ level: "warn", emit: "event" }, { level: "error", emit: "event" }];
if (!isProd && String(env.PRISMA_LOG_QUERIES || "false") === "true") {
    prismaLog.push({ level: "query", emit: "event" });
}
function newClient() {
    const client = new PrismaClient({ log: prismaLog });
    // bind logs to our logger
    client.$on?.("warn", (e) => logger.warn({ prisma: e }, "Prisma warn"));
    client.$on?.("error", (e) => logger.error({ prisma: e }, "Prisma error"));
    client.$on?.("query", (e) => {
        // Keep this lightweight; enable only if you need it
        if (String(env.PRISMA_LOG_QUERIES || "false") === "true") {
            logger.debug({ query: e.query, params: e.params, duration: e.duration }, "Prisma query");
        }
    });
    return client;
}
// Use a global singleton in dev to prevent exhausting DB connections during hot-reload
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || newClient();
if (!isProd)
    globalForPrisma.prisma = prisma;
// Helpful hooks
process.on("beforeExit", async () => {
    try {
        await prisma.$disconnect();
    }
    catch (e) {
        logger.warn({ err: e }, "Prisma disconnect failed");
    }
});
export default prisma;
//# sourceMappingURL=prismaClient.js.map