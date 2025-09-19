// src/config/logger.ts
// Pino logger with pretty transport in development.

import pino from "pino";
import { env } from "./env";

const transport = !env.isProd
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: true,
      },
    }
  : undefined;

export const logger = pino({
  level: process.env.LOG_LEVEL || (env.isProd ? "info" : "debug"),
  base: undefined,
  transport: transport as any,
});

export default logger;