// src/modules/search/search.routes.ts
import { Router } from "express";
import { ping } from "../../infrastructure/search/elastic.client.js";
import { ensureSearchIndices, reindexAllProducts, searchProducts, reindexAllMagazinePosts, searchMagazinePosts, } from "./search.service.js";
const router = Router();
router.get("/healthz", async (_req, res) => {
    const ok = await ping();
    res.json({ ok });
});
router.post("/setup", async (_req, res, next) => {
    try {
        await ensureSearchIndices();
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
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
    }
    catch (e) {
        next(e);
    }
});
router.post("/reindex/magazine", async (req, res, next) => {
    try {
        if (process.env.NODE_ENV === "production") {
            const key = req.headers["x-admin-key"];
            if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
                return res.status(403).json({ ok: false, error: "Forbidden" });
            }
        }
        const out = await reindexAllMagazinePosts();
        res.json({ ok: true, ...out });
    }
    catch (e) {
        next(e);
    }
});
router.get("/products", async (req, res, next) => {
    try {
        const q = req.query.q || req.query.search || "";
        const category = req.query.category || undefined;
        const priceMin = req.query.priceMin ? Number(req.query.priceMin) : undefined;
        const priceMax = req.query.priceMax ? Number(req.query.priceMax) : undefined;
        const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
        const size = req.query.size ? Math.min(50, Math.max(1, Number(req.query.size))) : 12;
        const sort = req.query.sort || "relevance";
        const result = await searchProducts({ q, category, priceMin, priceMax, page, size, sort });
        res.json({ ok: true, ...result });
    }
    catch (e) {
        next(e);
    }
});
router.get("/magazine", async (req, res, next) => {
    try {
        const q = req.query.q || req.query.search || "";
        const category = req.query.category || undefined;
        const tags = req.query.tags
            ? Array.isArray(req.query.tags)
                ? req.query.tags
                : [req.query.tags]
            : undefined;
        const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
        const size = req.query.size ? Math.min(50, Math.max(1, Number(req.query.size))) : 9;
        const sort = req.query.sort || "relevance";
        const result = await searchMagazinePosts({ q, category, tags, page, size, sort });
        res.json({ ok: true, ...result });
    }
    catch (e) {
        next(e);
    }
});
export default router;
//# sourceMappingURL=search.routes.js.map