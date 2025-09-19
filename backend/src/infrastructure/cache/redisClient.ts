// src/infrastructure/cache/redisClient.ts
// Redis client singleton (ioredis) with helpers for JSON, counters, and graceful logs.

import Redis, { RedisOptions } from "ioredis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

function buildOptions(): RedisOptions | string {
  if (env.REDIS_URL) return String(env.REDIS_URL);
  const host = env.REDIS_HOST || "127.0.0.1";
  const port = Number(env.REDIS_PORT || 6379);
  const password = env.REDIS_PASSWORD || undefined;
  const db = env.REDIS_DB ? Number(env.REDIS_DB) : undefined;
  const tls = String(env.REDIS_TLS || "false") === "true" ? {} : undefined;
  return { host, port, password, db, tls } as RedisOptions;
}

const opts = buildOptions();
export const redis = new Redis(opts as any);

redis.on("connect", () => logger.info("Redis connected"));
redis.on("ready", () => logger.debug("Redis ready"));
redis.on("error", (err) => logger.error({ err }, "Redis error"));
redis.on("end", () => logger.warn("Redis connection ended"));
redis.on("reconnecting", () => logger.info("Redis reconnecting"));

export async function setJSON(key: string, value: any, ttlSec?: number) {
  const payload = JSON.stringify(value);
  if (ttlSec && ttlSec > 0) {
    await redis.set(key, payload, "EX", ttlSec);
  } else {
    await redis.set(key, payload);
  }
}

export async function getJSON<T = any>(key: string): Promise<T | null> {
  const v = await redis.get(key);
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

export async function incrWithTTL(key: string, ttlSec: number): Promise<number> {
  const c = await redis.incr(key);
  if (c === 1 && ttlSec > 0) await redis.expire(key, ttlSec);
  return c;
}

export default redis;