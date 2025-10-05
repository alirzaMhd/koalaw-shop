// scripts/migrate.ts
// Runs Prisma migrations (deploy) with basic connectivity checks.
// Usage:
//  - ts-node scripts/migrate.ts
//  - or: node -r ts-node/register scripts/migrate.ts
//  - or add to package.json: "migrate": "ts-node scripts/migrate.ts"
import { spawn } from "child_process";
import path from "path";
import dotenv from "dotenv";
import { prisma } from "../src/infrastructure/db/prismaClient.js";
import { logger } from "../src/config/logger.js";
// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
async function checkDb() {
    logger.info("Checking database connectivity…");
    try {
        await prisma.$queryRaw `SELECT 1`;
        logger.info("Database connection OK.");
    }
    catch (e) {
        logger.error({ err: e?.message }, "Database connectivity check failed.");
        process.exitCode = 1;
        process.exit();
    }
}
function runPrisma(args) {
    return new Promise((resolve, reject) => {
        const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
        const child = spawn(cmd, ["prisma", ...args], {
            stdio: "inherit",
            env: process.env,
        });
        child.on("close", (code) => {
            if (code === 0)
                resolve();
            else
                reject(new Error(`prisma ${args.join(" ")} exited with code ${code}`));
        });
    });
}
async function main() {
    await checkDb();
    logger.info("Running prisma migrate deploy…");
    await runPrisma(["migrate", "deploy"]);
    // Optional: ensure client is generated (useful in CI)
    logger.info("Ensuring Prisma client is generated…");
    await runPrisma(["generate"]);
    logger.info("Migrations deployed successfully.");
}
main()
    .catch((e) => {
    logger.error({ err: e }, "Migration failed.");
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=migrate.js.map