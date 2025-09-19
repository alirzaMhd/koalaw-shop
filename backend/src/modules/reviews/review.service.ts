// src/modules/reviews/review.service.ts
// Reviews domain service: create/list/moderate/delete product reviews,
// and keep product rating aggregates (rating_avg, rating_count) in sync.
//
// DB tables used:
// - product_reviews (id, product_id, user_id, rating 1..5, title, body, guest_name, status enum, created_at, updated_at)
// - products (rating_avg, rating_count)
//
// Conventions:
// - Public lists show only status='approved' by default.
// - A signed-in user can create at most one review per product (409 if exists).
// - Guests must provide guestName; users do not need guestName.
// - Auto-approve can be enabled via env.REVIEWS_AUTO_APPROVE=true
// - On approve/reject/delete, product aggregates are recalculated.

import { prisma } from "../../infrastructure/db/prismaClient";
import { AppError } from "../../common/errors/AppError";
import { env } from "../../config/env";
import { eventBus } from "../../events/eventBus";
import { logger } from "../../config/logger";

// ---- Types & helpers ----

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  productId: string;
  userId?: string | null;
  rating: number; // 1..5
  title?: string | null;
  body: string;
  guestName?: string | null;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

function mapDbReview(row: any): Review {
  return {
    id: row.id,
    productId: row.productId ?? row.product_id,
    userId: row.userId ?? row.user_id ?? null,
    rating: row.rating,
    title: row.title ?? null,
    body: row.body,
    guestName: row.guestName ?? row.guest_name ?? null,
    status: (row.status as ReviewStatus) ?? "pending",
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

function toPagination(q?: { page?: number; perPage?: number }) {
  const page = Math.max(1, Math.floor(q?.page ?? 1));
  const perPage = Math.max(1, Math.min(100, Math.floor(q?.perPage ?? 12)));
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

function clampRating(n: number) {
  const v = Math.floor(Number(n) || 0);
  return Math.min(5, Math.max(1, v));
}

const AUTO_APPROVE = String(env.REVIEWS_AUTO_APPROVE ?? "false") === "true";

// ---- Service ----

class ReviewService {
  // Public list for a product (approved only by default)
  async listForProduct(productId: string, query?: { page?: number; perPage?: number; status?: ReviewStatus }): Promise<Paginated<Review>> {
    const { page, perPage, skip, take } = toPagination(query);
    const where: any = { productId };
    if (query?.status) where.status = query.status;
    else where.status = "approved";

    const [total, rows] = await Promise.all([
      prisma.productReview.count({ where }),
      prisma.productReview.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(mapDbReview),
      meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
    };
  }

  // Admin list across products
  async listAll(query?: {
    page?: number;
    perPage?: number;
    productId?: string;
    status?: ReviewStatus;
    userId?: string;
    search?: string; // matches title/body/guest_name
  }): Promise<Paginated<Review>> {
    const { page, perPage, skip, take } = toPagination(query);
    const where: any = {};
    if (query?.productId) where.productId = query.productId;
    if (query?.status) where.status = query.status;
    if (query?.userId) where.userId = query.userId;
    if (query?.search) {
      const s = String(query.search).trim();
      where.OR = [
        { title: { contains: s, mode: "insensitive" } },
        { body: { contains: s, mode: "insensitive" } },
        { guestName: { contains: s, mode: "insensitive" } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.productReview.count({ where }),
      prisma.productReview.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(mapDbReview),
      meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
    };
  }

  // Get single review by id
  async getById(id: string): Promise<Review> {
    const row = await prisma.productReview.findUnique({ where: { id } });
    if (!row) throw new AppError("نظر یافت نشد.", 404, "REVIEW_NOT_FOUND");
    return mapDbReview(row);
  }

  // List a user's reviews (self)
  async listMine(userId: string, query?: { page?: number; perPage?: number }): Promise<Paginated<Review>> {
    const { page, perPage, skip, take } = toPagination(query);
    const where = { userId };
    const [total, rows] = await Promise.all([
      prisma.productReview.count({ where }),
      prisma.productReview.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    ]);
    return {
      items: rows.map(mapDbReview),
      meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
    };
  }

  // Create a review (user or guest)
  async create(args: {
    productId: string;
    rating: number;
    body: string;
    title?: string | null;
    userId?: string | null;
    guestName?: string | null;
  }): Promise<Review> {
    const rating = clampRating(args.rating);
    const productId = args.productId;

    // Ensure product exists and is active (if needed)
    const prod = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, isActive: true } });
    if (!prod || !prod.id) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");

    // Validate identity (one must be present)
    const isUser = !!args.userId;
    const guestName = args.guestName?.trim() || null;
    if (!isUser && !guestName) {
      throw new AppError("برای ثبت نظر، ورود یا درج نام مهمان لازم است.", 400, "BAD_REVIEWER");
    }

    // Enforce one review per user per product
    if (isUser) {
      const exists = await prisma.productReview.findFirst({
        where: { productId, userId: args.userId! },
        select: { id: true },
      });
      if (exists) throw new AppError("شما قبلاً برای این محصول نظر ثبت کرده‌اید.", 409, "REVIEW_EXISTS");
    }

    const status: ReviewStatus = AUTO_APPROVE ? "approved" : "pending";

    const created = await prisma.productReview.create({
      data: {
        productId,
        userId: args.userId ?? null,
        rating,
        title: args.title ?? null,
        body: (args.body || "").trim(),
        guestName,
        status,
      },
    });

    // Update aggregates immediately if approved
    if (status === "approved") {
      await this.recalcProductRating(productId);
    }

    eventBus.emit("review.created", {
      reviewId: created.id,
      productId,
      userId: args.userId ?? null,
      status,
      rating,
    });

    return mapDbReview(created);
  }

  // Update a review's content (owner can edit if not approved; admin can edit anytime)
  async updateContent(args: {
    id: string;
    rating?: number;
    title?: string | null;
    body?: string | null;
    requesterUserId?: string | null;
    isAdmin?: boolean;
  }): Promise<Review> {
    const review = await prisma.productReview.findUnique({ where: { id: args.id } });
    if (!review) throw new AppError("نظر یافت نشد.", 404, "REVIEW_NOT_FOUND");

    const ownerId = review.userId ?? null;
    const isOwner = !!ownerId && ownerId === (args.requesterUserId ?? null);
    const canEdit =
      args.isAdmin ||
      // Allow owner edits while pending/rejected; if already approved, require admin (to keep moderation consistent)
      (isOwner && review.status !== "approved");

    if (!canEdit) throw new AppError("اجازه ویرایش ندارید.", 403, "FORBIDDEN");

    const rating = typeof args.rating === "number" ? clampRating(args.rating) : undefined;
    const updated = await prisma.productReview.update({
      where: { id: args.id },
      data: {
        rating: typeof rating === "number" ? rating : undefined,
        title: typeof args.title !== "undefined" ? args.title : undefined,
        body: typeof args.body !== "undefined" ? (args.body || "").trim() : undefined,
        // If admin edits approved review and rating changes, aggregates will be re-evaluated below on demand
      },
    });

    // If already approved and rating changed, recompute aggregates
    if (updated.status === "approved" && typeof rating === "number" && rating !== review.rating) {
      await this.recalcProductRating(updated.productId);
    }

    eventBus.emit("review.updated", { reviewId: updated.id, productId: updated.productId });
    return mapDbReview(updated);
  }

  // Admin moderation: approve or reject
  async setStatus(id: string, status: ReviewStatus): Promise<Review> {
    const review = await prisma.productReview.findUnique({ where: { id }, select: { id: true, productId: true, status: true } });
    if (!review) throw new AppError("نظر یافت نشد.", 404, "REVIEW_NOT_FOUND");

    const updated = await prisma.productReview.update({
      where: { id },
      data: { status },
    });

    if (status === "approved") {
      await this.recalcProductRating(updated.productId);
      eventBus.emit("review.approved", { reviewId: id, productId: updated.productId });
    } else {
      // For reject, recompute only if it was previously approved (so aggregates may drop)
      if (review.status === "approved") {
        await this.recalcProductRating(updated.productId);
      }
      eventBus.emit("review.rejected", { reviewId: id, productId: updated.productId });
    }

    return mapDbReview(updated);
  }

  // Delete review (owner can delete if not approved; admin can delete always)
  async delete(id: string, args?: { requesterUserId?: string | null; isAdmin?: boolean }): Promise<{ deleted: boolean }> {
    const review = await prisma.productReview.findUnique({ where: { id } });
    if (!review) throw new AppError("نظر یافت نشد.", 404, "REVIEW_NOT_FOUND");

    const ownerId = review.userId ?? null;
    const isOwner = !!ownerId && ownerId === (args?.requesterUserId ?? null);
    const canDelete = args?.isAdmin || (isOwner && review.status !== "approved");
    if (!canDelete) throw new AppError("اجازه حذف ندارید.", 403, "FORBIDDEN");

    await prisma.productReview.delete({ where: { id } });

    // If an approved review was deleted, recompute aggregates
    if (review.status === "approved") {
      await this.recalcProductRating(review.productId);
    }

    eventBus.emit("review.deleted", { reviewId: id, productId: review.productId });
    return { deleted: true };
  }

  // ---- Aggregates ----

  async recalcProductRating(productId: string): Promise<{ ratingAvg: number; ratingCount: number }> {
    const agg = await prisma.productReview.aggregate({
      where: { productId, status: "approved" },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const avg = Math.max(0, Math.min(5, Math.round((agg._avg.rating || 0) * 100) / 100)); // 2 decimals
    const count = agg._count._all || 0;

    await prisma.product.update({
      where: { id: productId },
      data: { ratingAvg: avg, ratingCount: count },
    });

    logger.debug({ productId, avg, count }, "Product rating aggregates recalculated");
    return { ratingAvg: avg, ratingCount: count };
  }
}

export const reviewService = new ReviewService();