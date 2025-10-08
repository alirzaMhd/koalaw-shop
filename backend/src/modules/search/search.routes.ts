// src/modules/search/search.routes.ts
import { Router } from "express";
import { ping } from "../../infrastructure/search/elastic.client.js";
import {
  ensureSearchIndices,
  reindexAllProducts,
  searchProducts,
  reindexAllMagazinePosts,
  searchMagazinePosts,
} from "./search.service.js";
import { logger } from "../../config/logger.js";

const router = Router();

/**
 * GET /api/search/healthz
 * Check Elasticsearch health
 */
router.get("/healthz", async (_req, res) => {
  try {
    const ok = await ping();
    res.json({ 
      ok, 
      status: ok ? "connected" : "disconnected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      ok: false, 
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/search/setup
 * Create search indices
 */
router.post("/setup", async (_req, res, next) => {
  try {
    await ensureSearchIndices();
    res.json({ 
      ok: true, 
      message: "Search indices created successfully" 
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/search/reindex/products
 * Reindex all products
 */
router.post("/reindex/products", async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      const key = req.headers["x-admin-key"];
      if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
        return res.status(403).json({ ok: false, error: "Forbidden" });
      }
    }
    const out = await reindexAllProducts();
    res.json({ ok: true, ...out });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/search/reindex/magazine
 * Reindex all magazine posts
 */
router.post("/reindex/magazine", async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      const key = req.headers["x-admin-key"];
      if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
        return res.status(403).json({ ok: false, error: "Forbidden" });
      }
    }
    
    logger.info("Starting magazine reindex...");
    const out = await reindexAllMagazinePosts();
    logger.info({ count: out.count }, "Magazine reindex completed");
    
    res.json({ 
      ok: true, 
      ...out,
      message: `Successfully indexed ${out.count} magazine posts`
    });
  } catch (e) {
    logger.error({ error: e }, "Magazine reindex failed");
    next(e);
  }
});

/**
 * GET /api/search/products
 * Search products
 */
router.get("/products", async (req, res, next) => {
  try {
    const q = (req.query.q as string) || (req.query.search as string) || "";
    const category = (req.query.category as string) || undefined;
    const priceMin = req.query.priceMin ? Number(req.query.priceMin) : undefined;
    const priceMax = req.query.priceMax ? Number(req.query.priceMax) : undefined;
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const size = req.query.size ? Math.min(50, Math.max(1, Number(req.query.size))) : 12;
    const sort = (req.query.sort as any) || "relevance";

    const params: {
      q?: string;
      category?: string;
      priceMin?: number;
      priceMax?: number;
      page?: number;
      size?: number;
      sort?: "relevance" | "newest" | "price_asc" | "price_desc" | "rating_desc";
    } = { q, page, size, sort };

    if (category !== undefined) params.category = category;
    if (priceMin !== undefined) params.priceMin = priceMin;
    if (priceMax !== undefined) params.priceMax = priceMax;

    const result = await searchProducts(params);
    
    res.json({ 
      ok: true, 
      success: true,
      ...result,
      meta: {
        page: result.page,
        size: result.size,
        total: result.total,
        totalPages: Math.ceil(result.total / result.size)
      }
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/search/magazine
 * Search magazine posts
 */
router.get("/magazine", async (req, res, next) => {
  try {
    const q = (req.query.q as string) || (req.query.search as string) || "";
    const category = (req.query.category as string) || undefined;
    const tags = req.query.tags
      ? Array.isArray(req.query.tags)
        ? (req.query.tags as string[])
        : [(req.query.tags as string)]
      : undefined;
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const size = req.query.size ? Math.min(50, Math.max(1, Number(req.query.size))) : 9;
    const sort = (req.query.sort as any) || "newest"; // Default to newest for magazine

    logger.info({ q, category, tags, page, size, sort }, "Magazine search request");

    const params: {
      q?: string;
      category?: string;
      tags?: string[];
      page?: number;
      size?: number;
      sort?: "relevance" | "newest" | "oldest";
    } = { page, size, sort: sort as "relevance" | "newest" | "oldest" };

    if (q && q.trim()) params.q = q.trim();
    if (category !== undefined) params.category = category;
    if (tags !== undefined) params.tags = tags;

    const result = await searchMagazinePosts(params);

    logger.info(
      { total: result.total, page: result.page, source: result.source },
      "Magazine search response"
    );

    res.json({
      ok: true,
      success: true,
      items: result.items,
      total: result.total,
      page: result.page,
      size: result.size,
      meta: {
        page: result.page,
        size: result.size,
        total: result.total,
        totalPages: result.totalPages,
      },
      source: result.source,
      ...(result.took !== undefined && { took: result.took }),
    });
  } catch (e) {
    logger.error({ error: e, query: req.query }, "Magazine search error");
    next(e);
  }
});

export default router;