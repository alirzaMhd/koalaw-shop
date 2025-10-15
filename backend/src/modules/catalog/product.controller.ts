// src/modules/catalog/product.controller.ts
// Thin HTTP handlers for product listing, details, create/update, images, variants, and reviews.

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";

import { AppError } from "../../common/errors/AppError.js";
import { logger } from "../../config/logger.js";
import { productService } from "./product.service.js";

import {
  listProductsQuerySchema,
  createProductInputSchema as createProductSchema,
  updateProductInputSchema as updateProductSchema,
  addImageInputSchema as addImageSchema,
  updateImageInputSchema as updateImageSchema,
  addVariantInputSchema as addVariantSchema,
  updateVariantInputSchema as updateVariantSchema,
  addReviewInputSchema as addReviewSchema,
  listReviewsQuerySchema as listReviewsSchema,
} from "./product.validators.js";

// Param schemas
const productIdParamSchema = z.object({ id: z.string().uuid({ message: "شناسه نامعتبر است." }) });
const productSlugParamSchema = z.object({ slug: z.string().min(1, "اسلاگ نامعتبر است.") });
const imageIdParamSchema = z.object({ imageId: z.string().uuid({ message: "شناسه تصویر نامعتبر است." }) });
const variantIdParamSchema = z.object({ variantId: z.string().uuid({ message: "شناسه واریانت نامعتبر است." }) });

// Standard OK wrapper with no-cache headers to avoid 304
function ok(res: Response, data: any, status = 200) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  // Set a per-response ETag so If-None-Match never matches (prevents 304)
  res.setHeader("ETag", `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return res.status(status).json({ success: true, data });
}

function normalizeArrayParams(q: any) {
  const out: any = { ...q };
  const alias: [string, string][] = [
    ["categories[]", "categories"],
    ["brandIds[]", "brandIds"],
    ["brandSlugs[]", "brandSlugs"],
    ["collectionIds[]", "collectionIds"],
    ["collectionSlugs[]", "collectionSlugs"],
    ["colorThemeIds[]", "colorThemeIds"],
  ];
  for (const [from, to] of alias) {
    if (from in out && !(to in out)) out[to] = out[from];
  }
  const arrayKeys = ["categories", "brandIds", "brandSlugs", "collectionIds", "collectionSlugs", "colorThemeIds"];
  for (const key of arrayKeys) {
    if (!(key in out)) continue;
    const v = out[key];
    if (Array.isArray(v)) continue;
    if (typeof v === "string") {
      out[key] = v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (v == null) {
      delete out[key];
    } else {
      out[key] = [v];
    }
  }
  return out;
}

class ProductController {
  // GET /products
  list: RequestHandler = async (req, res, next) => {
    try {
      const normalized = normalizeArrayParams(req.query);
      const query = await listProductsQuerySchema.parseAsync(normalized);
      const result = await productService.list(query);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // GET /products/filters
  filters: RequestHandler = async (_req, res, next) => {
    try {
      const result = await productService.getFilterOptions();
      return ok(res, result, 200);
    } catch (err: any) {
      next(err);
    }
  };

  suggestions: RequestHandler = async (_req, res, next) => {
    try {
      const items = await productService.getTopSelling(4);
      return ok(res, { suggestions: items }, 200);
    } catch (err: any) {
      next(err);
    }
  };

  // GET /products/:id
  getById: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const item = await productService.getById(id);
      return ok(res, { product: item }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // GET /products/slug/:slug
  getBySlug: RequestHandler = async (req, res, next) => {
    try {
      const { slug } = await productSlugParamSchema.parseAsync(req.params);
      const item = await productService.getBySlug(slug);
      return ok(res, { product: item }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // POST /products
  create: RequestHandler = async (req, res, next) => {
    try {
      const body = await createProductSchema.parseAsync(req.body ?? {});
      const created = await productService.create(body);
      return ok(res, { product: created }, 201);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // PATCH /products/:id
  update: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const body = await updateProductSchema.parseAsync(req.body ?? {});
      const updated = await productService.update(id, body);
      return ok(res, { product: updated }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // ------- Images -------
  addImage: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const body = await addImageSchema.parseAsync(req.body ?? {});
      const image = await productService.addImage(id, body);
      return ok(res, { image }, 201);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  updateImage: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const { imageId } = await imageIdParamSchema.parseAsync(req.params);
      const body = await updateImageSchema.parseAsync(req.body ?? {});
      const image = await productService.updateImage(id, imageId, body);
      return ok(res, { image }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  deleteImage: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const { imageId } = await imageIdParamSchema.parseAsync(req.params);
      const result = await productService.deleteImage(id, imageId);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // ------- Variants -------
  addVariant: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const body = await addVariantSchema.parseAsync(req.body ?? {});
      const variant = await productService.addVariant(id, body);
      return ok(res, { variant }, 201);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  updateVariant: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const { variantId } = await variantIdParamSchema.parseAsync(req.params);
      const body = await updateVariantSchema.parseAsync(req.body ?? {});
      const variant = await productService.updateVariant(id, variantId, body);
      return ok(res, { variant }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  deleteVariant: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const { variantId } = await variantIdParamSchema.parseAsync(req.params);
      const result = await productService.deleteVariant(id, variantId);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // ------- Reviews (NEW) -------

  listReviewsById: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const query = await listReviewsSchema.parseAsync(req.query ?? {});
      const data = await productService.listReviewsByProductId(id, query);
      return ok(res, data, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  listReviewsBySlug: RequestHandler = async (req, res, next) => {
    try {
      const { slug } = await productSlugParamSchema.parseAsync(req.params);
      const query = await listReviewsSchema.parseAsync(req.query ?? {});
      const data = await productService.listReviewsBySlug(slug, query);
      return ok(res, data, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  addReviewById: RequestHandler = async (req: Request, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const body = await addReviewSchema.parseAsync(req.body ?? {});
      const userId = (req as any).user?.id || (req as any).user?.sub || null;
      const review = await productService.addReviewByProductId(id, body, userId);
      return ok(res, { review }, 201);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  addReviewBySlug: RequestHandler = async (req: Request, res, next) => {
    try {
      const { slug } = await productSlugParamSchema.parseAsync(req.params);
      const body = await addReviewSchema.parseAsync(req.body ?? {});
      const userId = (req as any).user?.id || (req as any).user?.sub || null;
      const review = await productService.addReviewBySlug(slug, body, userId);
      return ok(res, { review }, 201);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };
}

export const productController = new ProductController();