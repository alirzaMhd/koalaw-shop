// src/infrastructure/search/elastic.client.ts
// Elasticsearch client singleton and small helpers.
// Requires: npm i @elastic/elasticsearch
import { Client } from "@elastic/elasticsearch";
import { logger } from "../../config/logger.js";
const node = process.env.ELASTICSEARCH_NODE || "http://localhost:9200";
let auth;
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
    tls: rejectUnauthorizedEnv === "false" || rejectUnauthorizedEnv === "0"
        ? { rejectUnauthorized: false }
        : undefined,
});
export async function ping() {
    try {
        await elastic.ping();
        logger.info("Elasticsearch ping ok");
        return true;
    }
    catch (e) {
        logger.warn({ err: e?.message }, "Elasticsearch ping failed");
        return false;
    }
}
export async function ensureIndex(index, mapping) {
    const exists = await elastic.indices.exists({ index });
    if (!exists) {
        await elastic.indices.create({ index, body: mapping || {} });
        logger.info({ index }, "Elasticsearch index created");
    }
    else {
        logger.info({ index }, "Elasticsearch index exists");
    }
}
export async function indexDocument(index, doc, id) {
    return elastic.index({ index, id, document: doc, refresh: "wait_for" });
}
export async function searchDocuments(index, query, opts) {
    const res = await elastic.search({
        index,
        from: opts?.from || 0,
        size: opts?.size || 10,
        query,
    });
    const hits = res.hits.hits.map((h) => ({ id: h._id, ...h._source }));
    const total = typeof res.hits.total === "number"
        ? res.hits.total
        : res.hits.total?.value || 0;
    return { items: hits, total };
}
export default elastic;
//# sourceMappingURL=elastic.client.js.map