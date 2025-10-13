// backend/src/modules/admin/colorTheme.controller.ts
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../infrastructure/db/prismaClient.js";

const ok = (res: any, data: any, status = 200) => res.status(status).json({ success: true, data });

const idParamSchema = z.object({ id: z.string().uuid() });
const hexCodeSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "کد رنگ هگز نامعتبر است");

const createSchema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  slug: z.string().optional(),
  hexCode: hexCodeSchema.optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  hexCode: hexCodeSchema.optional(),
});

export const colorThemeController = {
  list: (async (req, res, next) => {
    try {
      const themes = await prisma.colorTheme.findMany({ 
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } } 
      });
      return ok(res, { colorThemes: themes });
    } catch (err) { next(err); }
  }) as RequestHandler,

  create: (async (req, res, next) => {
    try {
      const data = await createSchema.parseAsync(req.body);
      const theme = await prisma.colorTheme.create({ data });
      return ok(res, { colorTheme: theme }, 201);
    } catch (err: any) {
      if (err?.issues) return next(new AppError(err.issues[0].message, 422));
      next(err);
    }
  }) as RequestHandler,

  update: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const data = await updateSchema.parseAsync(req.body);
      const theme = await prisma.colorTheme.update({ where: { id }, data });
      return ok(res, { colorTheme: theme });
    } catch (err: any) {
      if (err?.issues) return next(new AppError(err.issues[0].message, 422));
      next(err);
    }
  }) as RequestHandler,

  delete: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const productCount = await prisma.product.count({ where: { colorThemeId: id } });
      if (productCount > 0) {
        throw new AppError(`این تم رنگی توسط ${productCount} محصول استفاده می‌شود.`, 400);
      }
      await prisma.colorTheme.delete({ where: { id } });
      return ok(res, { deleted: true });
    } catch (err: any) {
      if (err?.issues) return next(new AppError(err.issues[0].message, 422));
      next(err);
    }
  }) as RequestHandler,
};