// src/config/logger.ts
import pino from "pino";
import { env } from "./env.js";

const level = process.env.LOG_LEVEL ?? (env.isProd ? "info" : "debug");

export const logger = pino({
  level,
  base: null, // null is allowed; undefined is not with exactOptionalPropertyTypes
  ...(env.isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            singleLine: true,
          },
        },
      }),
});

export default logger;