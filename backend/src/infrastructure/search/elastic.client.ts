// src/infrastructure/search/elastic.client.ts
// Elasticsearch client singleton and small helpers.
// Requires @elastic/elasticsearch and ELASTICSEARCH_NODE env.

import { Client } from "@elastic/elasticsearch";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

const node = env.ELASTICSEARCH_NODE || "http://localhost:9200";

let auth: { username: string; password: string } | undefined;
if (env.ELASTICSEARCH_USERNAME && env.ELASTICSEARCH_PASSWORD) {
  auth = { username: String(env.ELASTICSEARCH_USERNAME), password: String(env.ELASTICSEARCH_PASSWORD) };
}

export const elastic = new Client({
  node,
  auth,
  tls: String(env.ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED || "true") === "false" ? { rejectUnauthorized: false } : undefined,
});

export async function ping(): Promise<boolean> {
  try {
    await elastic.ping();
    logger.info("Elasticsearch ping ok");
    return true;
  } catch (e) {
    logger.warn({ err: (e as any)?.message }, "Elasticsearch ping failed");
    return false;
  }
}

export async function ensureIndex(index: string, mapping?: any) {
  const exists = await elastic.indices.exists({ index });
  if (!exists) {
    await elastic.indices.create({ index, body: mapping || {} });
    logger.info({ index }, "Elasticsearch index created");
  }
}

export async function indexDocument<T extends { id?: string }>(index: string, doc: T, id?: string) {
  const res = await elastic.index({ index, id, document: doc as any, refresh: "wait_for" });
  return res;
}

export async function searchDocuments<T = any>(index: string, query: any, opts?: { from?: number; size?: number }) {
  const res = await elastic.search({
    index,
    from: opts?.from || 0,
    size: opts?.size || 10,
    query,
  });
  const hits = res.hits.hits.map((h: any) => ({ id: h._id, ...(h._source as any) })) as T[];
  return { items: hits, total: res.hits.total };
}

export default elastic;