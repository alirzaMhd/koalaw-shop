// src/modules/catalog/product.controller.ts
// Thin HTTP handlers for product listing, details, create/update, images, and variants.

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";

import { AppError } from "../../common/errors/AppError";
import { logger } from "../../config/logger";
import { productService } from "./product.service";

import {
  listProductsQuerySchema,
  productIdParamSchema,
  productSlugParamSchema,
  createProductSchema,
  updateProductSchema,
  addImageSchema,
  updateImageSchema,
  addVariantSchema,
  updateVariantSchema,
} from "./product.validators";

const uuidParam = z.object({ id: z.string().uuid({ message: "شناسه نامعتبر است." }) });
const imageIdParam = z.object({ imageId: z.string().uuid({ message: "شناسه تصویر نامعتبر است." }) });
const variantIdParam = z.object({ variantId: z.string().uuid({ message: "شناسه واریانت نامعتبر است." }) });

function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

class ProductController {
  // GET /products
  list: RequestHandler = async (req, res, next) => {
    try {
      const query = await listProductsQuerySchema.parseAsync(req.query);
      const result = await productService.list(query);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
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

  // POST /products/:id/images
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

  // PATCH /products/:id/images/:imageId
  updateImage: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const { imageId } = await imageIdParam.parseAsync(req.params);
      const body = await updateImageSchema.parseAsync(req.body ?? {});
      const image = await productService.updateImage(id, imageId, body);
      return ok(res, { image }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // DELETE /products/:id/images/:imageId
  deleteImage: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const { imageId } = await imageIdParam.parseAsync(req.params);
      const result = await productService.deleteImage(id, imageId);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // ------- Variants -------

  // POST /products/:id/variants
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

  // PATCH /products/:id/variants/:variantId
  updateVariant: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const { variantId } = await variantIdParam.parseAsync(req.params);
      const body = await updateVariantSchema.parseAsync(req.body ?? {});
      const variant = await productService.updateVariant(id, variantId, body);
      return ok(res, { variant }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // DELETE /products/:id/variants/:variantId
  deleteVariant: RequestHandler = async (req, res, next) => {
    try {
      const { id } = await productIdParamSchema.parseAsync(req.params);
      const { variantId } = await variantIdParam.parseAsync(req.params);
      const result = await productService.deleteVariant(id, variantId);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };
}

export const productController = new ProductController();