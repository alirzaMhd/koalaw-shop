// src/app.ts
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { env } from "./config/env.js";
import { requestLogger } from "./common/middlewares/requestLogger.js";
import { errorHandler } from "./common/middlewares/errorHandler.js";
import { rateLimiter } from "./common/middlewares/rateLimiter.js";
import buildApiRouter from "./routes.js";
// NEW: import the auth router to expose /auth alias
import { authRouter } from "./modules/auth/auth.routes.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
export function createApp() {
    const app = express();
    app.set("trust proxy", 1);
    // Helmet with CSP relaxed for Google Maps iframe and third‑party embeds
    app.use(helmet({
        crossOriginEmbedderPolicy: false, // avoid blocking third‑party iframes
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                defaultSrc: ["'self'"],
                // Allow Google Maps in iframes
                frameSrc: [
                    "'self'",
                    "https://www.google.com",
                    "https://*.google.com",
                    "https://*.gstatic.com",
                ],
                // Backward-compatibility for older agents
                childSrc: [
                    "'self'",
                    "https://www.google.com",
                    "https://*.google.com",
                    "https://*.gstatic.com",
                ],
                // Images: allow self, data/blob, and any https CDN (Unsplash, etc.)
                imgSrc: ["'self'", "data:", "blob:", "https:"],
                // Your page uses some inline styles; allow them
                styleSrc: ["'self'", "'unsafe-inline'", "https:"],
                // All scripts are local; allow inline init (feather.replace(), etc.)
                scriptSrc: ["'self'", "'unsafe-inline'"],
                // Fonts (local/data/https)
                fontSrc: ["'self'", "data:", "https:"],
                // XHR/fetch endpoints (adjust if you call external APIs from frontend)
                connectSrc: ["'self'"],
            },
        },
    }));
    const origins = env.corsOrigins.length ? env.corsOrigins : undefined;
    app.use(cors({
        origin: origins || true,
        credentials: true,
    }));
    // Stripe webhook raw body BEFORE json parser
    app.use("/api/payments/stripe/webhook", express.raw({ type: "application/json" }));
    app.use(express.json({ limit: env.JSON_LIMIT }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(compression());
    app.use(requestLogger);
    app.use(rateLimiter({
        windowMs: env.rateLimit.windowMs,
        max: env.rateLimit.max,
        keyGenerator: (req) => `${req.ip}:${req.method}:${req.path}`,
    }));
    // Resolve important paths relative to this file
    // __dirname -> .../backend/dist (in build) or .../backend/src (in dev)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const backendRoot = path.resolve(__dirname, ".."); // .../backend
    const repoRoot = path.resolve(backendRoot, ".."); // repo root
    const frontendRoot = path.join(repoRoot, "frontend", "src");
    const frontendAssets = path.join(frontendRoot, "assets");
    const frontendPages = path.join(frontendRoot, "pages");
    const backendPublic = path.join(backendRoot, "public"); // optional folder for favicon, etc.
    // Serve static assets from frontend/src/assets at /assets
    app.use("/assets", express.static(frontendAssets));
    // Backward-compatible alias so old links like /frontend/src/assets/... still work
    app.use("/frontend/src/assets", express.static(frontendAssets));
    // Optional backend public directory (use /static/favicon.ico, etc.)
    app.use("/static", express.static(backendPublic));
    // NEW: expose /auth alias (so frontend calling /auth/... works)
    app.use("/auth", authRouter);
    // API routes under /api
    app.use("/api", buildApiRouter());
    // API 404 (JSON)
    app.use("/api", (_req, res) => {
        res.status(404).json({
            success: false,
            error: { code: "NOT_FOUND", message: "مسیر مورد نظر یافت نشد." },
        });
    });
    // Root route - serve index.html
    app.get("/", (_req, res) => {
        res.sendFile(path.join(frontendPages, "index.html"));
    });
    // Explicit endpoint for tos.html
    app.get("/tos", (_req, res) => {
        res.sendFile(path.join(frontendPages, "tos.html"));
    });
    // Magazine article
    app.get("/magazine/:slug", (_req, res) => {
        res.sendFile(path.join(frontendPages, "article.html"));
    });
    // Shop category page (e.g., /shop/skincare)
    app.get("/shop/:category", (_req, res) => {
        res.sendFile(path.join(frontendPages, "shop.html"));
    });
    // Product detail routes (serve product.html for slugged routes)
    app.get(["/product/:slug", "/products/:slug", "/p/:slug", "/shop/:category/:slug"], (_req, res) => {
        res.sendFile(path.join(frontendPages, "product.html"));
    });
    // Simple page router: /shop -> pages/shop.html, /login -> pages/login.html, etc.
    // NOTE: keep this AFTER the more specific routes above
    app.get("/:page", (req, res, next) => {
        const p = req.path;
        // Don't hijack API or static routes
        if (p.startsWith("/api") ||
            p.startsWith("/assets") ||
            p.startsWith("/static") ||
            p.startsWith("/frontend/src/assets")) {
            return next();
        }
        const file = path.join(frontendPages, `${req.params.page}.html`);
        if (fs.existsSync(file)) {
            return res.sendFile(file);
        }
        return next();
    });
    // Non-API 404 -> serve 404.html
    app.use((req, res, next) => {
        if (req.path.startsWith("/api"))
            return next();
        res.status(404).sendFile(path.join(frontendPages, "404.html"));
    });
    // Error handler LAST
    app.use(errorHandler);
    return app;
}
export default createApp;
//# sourceMappingURL=app.js.map