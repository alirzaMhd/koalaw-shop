// src/modules/inventory/inventory.controller.ts
// Thin HTTP handlers for inventory operations: stock read/set/adjust,
// batch reserve/release, and cart/order helpers.

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../common/errors/AppError";
import { inventoryService } from "./inventory.service";

function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

// ---------- Validators ----------

const uuidParam = z.object({ id: z.string().uuid({ message: "شناسه نامعتبر است." }) });
const variantParam = z.object({ variantId: z.string().uuid({ message: "شناسه واریانت نامعتبر است." }) });
const cartParam = z.object({ cartId: z.string().uuid({ message: "شناسه سبد خرید نامعتبر است." }) });
const orderParam = z.object({ orderId: z.string().uuid({ message: "شناسه سفارش نامعتبر است." }) });

const setStockSchema = z.object({
  stock: z.number().int("عدد صحیح وارد کنید.").min(0, "موجودی نمی‌تواند منفی باشد."),
});

const adjustStockSchema = z.object({
  delta: z.number().int("عدد صحیح وارد کنید."),
});

const reserveLinesSchema = z.object({
  lines: z
    .array(
      z.object({
        variantId: z.string().uuid({ message: "شناسه واریانت نامعتبر است." }),
        quantity: z.number().int("تعداد باید صحیح باشد.").min(1, "تعداد باید حداقل ۱ باشد."),
      })
    )
    .min(1, "حداقل یک مورد لازم است."),
});

// ---------- Controller ----------

class InventoryController {
  // GET /inventory/variants/:variantId/stock
  getStock: RequestHandler = async (req, res, next) => {
    try {
      const { variantId } = await variantParam.parseAsync(req.params);
      const stock = await inventoryService.getStock(variantId);
      return ok(res, { variantId, stock }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // PATCH /inventory/variants/:variantId/stock
  setStock: RequestHandler = async (req, res, next) => {
    try {
      const { variantId } = await variantParam.parseAsync(req.params);
      const { stock } = await setStockSchema.parseAsync(req.body ?? {});
      const newStock = await inventoryService.setStock(variantId, stock);
      return ok(res, { variantId, stock: newStock }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // PATCH /inventory/variants/:variantId/adjust
  adjustStock: RequestHandler = async (req, res, next) => {
    try {
      const { variantId } = await variantParam.parseAsync(req.params);
      const { delta } = await adjustStockSchema.parseAsync(req.body ?? {});
      const stock = await inventoryService.adjustStock(variantId, delta);
      return ok(res, { variantId, stock }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // POST /inventory/reserve
  reserve: RequestHandler = async (req, res, next) => {
    try {
      const { lines } = await reserveLinesSchema.parseAsync(req.body ?? {});
      const result = await inventoryService.reserve(lines);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // POST /inventory/release
  release: RequestHandler = async (req, res, next) => {
    try {
      const { lines } = await reserveLinesSchema.parseAsync(req.body ?? {});
      await inventoryService.release(lines);
      return ok(res, { released: true }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // GET /inventory/carts/:cartId/verify
  verifyCart: RequestHandler = async (req, res, next) => {
    try {
      const { cartId } = await cartParam.parseAsync(req.params);
      const result = await inventoryService.verifyCartAvailability(cartId);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // POST /inventory/carts/:cartId/reserve
  reserveCart: RequestHandler = async (req, res, next) => {
    try {
      const { cartId } = await cartParam.parseAsync(req.params);
      const result = await inventoryService.reserveForCart(cartId);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // POST /inventory/orders/:orderId/reserve
  reserveOrder: RequestHandler = async (req, res, next) => {
    try {
      const { orderId } = await orderParam.parseAsync(req.params);
      const result = await inventoryService.reserveForOrder(orderId);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };

  // POST /inventory/orders/:orderId/release
  releaseOrder: RequestHandler = async (req, res, next) => {
    try {
      const { orderId } = await orderParam.parseAsync(req.params);
      await inventoryService.releaseForOrder(orderId);
      return ok(res, { released: true }, 200);
    } catch (err: any) {
      if (err?.issues?.length) return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      next(err);
    }
  };
}

export const inventoryController = new InventoryController();