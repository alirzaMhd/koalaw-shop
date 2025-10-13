// backend/src/modules/admin/badge.controller.ts
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../infrastructure/db/prismaClient.js";

function ok(res: any, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

const idParamSchema = z.object({
  id: z.string().uuid({ message: "شناسه نامعتبر است." }),
});

const createBadgeSchema = z.object({
  title: z.string().min(1, "عنوان نشان الزامی است."),
  icon: z.string().min(1, "آیکون الزامی است."),
});

const updateBadgeSchema = z.object({
  title: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
});

export const badgeController = {
  // GET /api/admin/badges
  listBadges: (async (req, res, next) => {
    try {
      const badges = await prisma.badge.findMany({
        orderBy: { title: "asc" },
        include: {
          _count: { select: { products: true } },
        },
      });
      return ok(res, { badges }, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  // POST /api/admin/badges
  createBadge: (async (req, res, next) => {
    try {
      const data = await createBadgeSchema.parseAsync(req.body);
      const badge = await prisma.badge.create({
        data: {
          title: data.title,
          icon: data.icon,
        },
      });
      return ok(res, { badge }, 201);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  // PUT /api/admin/badges/:id
  updateBadge: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const data = await updateBadgeSchema.parseAsync(req.body);

      const badge = await prisma.badge.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.icon && { icon: data.icon }),
        },
      });
      return ok(res, { badge }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  // DELETE /api/admin/badges/:id
  deleteBadge: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      
      // Check if badge is used by products
      const productCount = await prisma.product.count({
        where: { badges: { some: { id } } },
      });

      if (productCount > 0) {
        throw new AppError(
          `این نشان توسط ${productCount} محصول استفاده می‌شود. ابتدا آن‌ها را حذف کنید.`,
          400,
          "BADGE_IN_USE"
        );
      }

      await prisma.badge.delete({ where: { id } });
      return ok(res, { deleted: true }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,
};