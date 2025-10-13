// backend/src/modules/admin/admin.controller.ts
import type { RequestHandler } from "express";
import { adminService } from "./admin.service.js";
import { z } from "zod";
import { AppError } from "../../common/errors/AppError.js";

function ok(res: any, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

// ========== VALIDATORS ==========
const uuidSchema = z.string().uuid({ message: "شناسه نامعتبر است." });

const idParamSchema = z.object({
  id: uuidSchema,
});

const orderStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "AWAITING_PAYMENT",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ], { errorMap: () => ({ message: "وضعیت نامعتبر است." }) }),
});

const userRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN", "STAFF"], {
    errorMap: () => ({ message: "نقش نامعتبر است." }),
  }),
});

const userTierSchema = z.object({
  tier: z.enum(["STANDARD", "VIP"], {
    errorMap: () => ({ message: "سطح نامعتبر است." }),
  }),
});

const brandCreateSchema = z.object({
  name: z.string().min(1, "نام برند الزامی است."),
  slug: z.string().optional(),
});

const brandUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
});

const collectionCreateSchema = z.object({
  name: z.string().min(1, "نام کالکشن الزامی است."),
});

const collectionUpdateSchema = z.object({
  name: z.string().min(1, "نام کالکشن الزامی است."),
});

const couponCreateSchema = z.object({
  code: z.string().min(1, "کد کوپن الزامی است."),
  type: z.enum(["PERCENT", "AMOUNT", "FREE_SHIPPING"], {
    errorMap: () => ({ message: "نوع کوپن نامعتبر است." }),
  }),
  percentValue: z.number().min(0).max(100).optional(),
  amountValue: z.number().min(0).optional(),
  minSubtotal: z.number().min(0).optional(),
  maxUses: z.number().min(1).optional(),
  maxUsesPerUser: z.number().min(1).optional(),
  startsAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endsAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

export const adminController = {
  // ========== DASHBOARD ==========
  getDashboard: (async (_req, res, next) => {
    try {
      const stats = await adminService.getDashboardStats();
      return ok(res, stats, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  // ========== PRODUCTS ==========
  listProducts: (async (req, res, next) => {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        perPage: parseInt(req.query.perPage as string) || 20,
        search: req.query.search as string,
        category: req.query.category as string,
        isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      };
      const result = await adminService.listAllProducts(query);
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  deleteProduct: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const result = await adminService.deleteProduct(id);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  // ========== ORDERS ==========
  listOrders: (async (req, res, next) => {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        perPage: parseInt(req.query.perPage as string) || 20,
        status: req.query.status as string,
        search: req.query.search as string,
      };
      const result = await adminService.listAllOrders(query);
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  updateOrderStatus: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const { status } = await orderStatusSchema.parseAsync(req.body);
      const result = await adminService.updateOrderStatus(id, status);
      return ok(res, { order: result }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  // ========== USERS ==========
  listUsers: (async (req, res, next) => {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        perPage: parseInt(req.query.perPage as string) || 20,
        search: req.query.search as string,
        role: req.query.role as string,
      };
      const result = await adminService.listAllUsers(query);
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  updateUserRole: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const { role } = await userRoleSchema.parseAsync(req.body);
      const result = await adminService.updateUserRole(id, role);
      return ok(res, { user: result }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  updateUserTier: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const { tier } = await userTierSchema.parseAsync(req.body);
      const result = await adminService.updateUserTier(id, tier);
      return ok(res, { user: result }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  // ========== REVIEWS ==========
  listPendingReviews: (async (req, res, next) => {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        perPage: parseInt(req.query.perPage as string) || 20,
      };
      const result = await adminService.listPendingReviews(query);
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  // ========== BRANDS ==========
  listBrands: (async (_req, res, next) => {
    try {
      const brands = await adminService.listBrands();
      return ok(res, { brands }, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  createBrand: (async (req, res, next) => {
    try {
      const data = await brandCreateSchema.parseAsync(req.body);
      const brand = await adminService.createBrand(data);
      return ok(res, { brand }, 201);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  updateBrand: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const data = await brandUpdateSchema.parseAsync(req.body);
      const brand = await adminService.updateBrand(id, data);
      return ok(res, { brand }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  deleteBrand: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const result = await adminService.deleteBrand(id);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  // ========== COLLECTIONS ==========
  listCollections: (async (_req, res, next) => {
    try {
      const collections = await adminService.listCollections();
      return ok(res, { collections }, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  createCollection: (async (req, res, next) => {
    try {
      const data = await collectionCreateSchema.parseAsync(req.body);
      const collection = await adminService.createCollection(data);
      return ok(res, { collection }, 201);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  updateCollection: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const data = await collectionUpdateSchema.parseAsync(req.body);
      const collection = await adminService.updateCollection(id, data);
      return ok(res, { collection }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  deleteCollection: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const result = await adminService.deleteCollection(id);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  // ========== NEWSLETTER ==========
  getNewsletterStats: (async (_req, res, next) => {
    try {
      const stats = await adminService.getNewsletterStats();
      return ok(res, stats, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  // ========== COUPONS ==========
  listCoupons: (async (req, res, next) => {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        perPage: parseInt(req.query.perPage as string) || 20,
      };
      const result = await adminService.listCoupons(query);
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  createCoupon: (async (req, res, next) => {
    try {
      const data = await couponCreateSchema.parseAsync(req.body);
      const coupon = await adminService.createCoupon(data as any);
      return ok(res, { coupon }, 201);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  updateCoupon: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const data = req.body; // You can add specific validation schema if needed
      const coupon = await adminService.updateCoupon(id, data);
      return ok(res, { coupon }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  deleteCoupon: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const result = await adminService.deleteCoupon(id);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,
  // Add to existing admin.controller.ts

  // ========== USERS (ENHANCED) ==========
  getUser: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const user = await adminService.getUser(id);
      return ok(res, { user }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  deleteUser: (async (req, res, next) => {
    try {
      const { id } = await idParamSchema.parseAsync(req.params);
      const result = await adminService.deleteUser(id);
      return ok(res, result, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      next(err);
    }
  }) as RequestHandler,

  // ========== NEWSLETTER (ENHANCED) ==========
  listNewsletterSubscribers: (async (req, res, next) => {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        perPage: parseInt(req.query.perPage as string) || 20,
        status: req.query.status as string, // 'active' | 'unsubscribed' | 'all'
      };
      const result = await adminService.listNewsletterSubscribers(query);
      return ok(res, result, 200);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
};