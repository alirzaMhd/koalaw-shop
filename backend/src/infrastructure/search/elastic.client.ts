// src/infrastructure/search/elastic.client.ts
// Elasticsearch client singleton and small helpers.
// Requires: npm i @elastic/elasticsearch

import { Client } from "@elastic/elasticsearch";
import { logger } from "../../config/logger";

const node = process.env.ELASTICSEARCH_NODE || "http://localhost:9200";

let auth: { username: string; password: string } | undefined;
if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
  auth = {
    username: String(process.env.ELASTICSEARCH_USERNAME),
    password: String(process.env.ELASTICSEARCH_PASSWORD),
  };
}

const rejectUnauthorizedEnv = String(process.env.ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED || "true");

export const elastic = new Client({
  node,
  auth,
  tls:
    rejectUnauthorizedEnv === "false" || rejectUnauthorizedEnv === "0"
      ? { rejectUnauthorized: false }
      : undefined,
});

export async function ping(): Promise<boolean> {
  try {
    await elastic.ping();
    logger.info("Elasticsearch ping ok");
    return true;
  } catch (e: any) {
    logger.warn({ err: e?.message }, "Elasticsearch ping failed");
    return false;
  }
}

export async function ensureIndex(index: string, mapping?: any) {
  const exists = await elastic.indices.exists({ index });
  if (!exists) {
    await elastic.indices.create({ index, body: mapping || {} });
    logger.info({ index }, "Elasticsearch index created");
  } else {
    logger.info({ index }, "Elasticsearch index exists");
  }
}

export async function indexDocument<T extends { id?: string }>(
  index: string,
  doc: T,
  id?: string
) {
  return elastic.index({ index, id, document: doc as any, refresh: "wait_for" });
}

export async function searchDocuments<T = any>(
  index: string,
  query: any,
  opts?: { from?: number; size?: number }
) {
  const res = await elastic.search({
    index,
    from: opts?.from || 0,
    size: opts?.size || 10,
    query,
  } as any);
  const hits = (res.hits as any).hits.map((h: any) => ({ id: h._id, ...(h._source as any) })) as T[];
  const total =
    typeof (res.hits as any).total === "number"
      ? (res.hits as any).total
      : (res.hits as any).total?.value || 0;
  return { items: hits, total };
}

export default elastic;