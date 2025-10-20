// src/modules/catalog/product.service.ts
// Products service: listing, read (id/slug), create/update, and child resources (images/variants).
// Now also loads badges, approved reviews, and related products from DB.

import { prisma } from "../../infrastructure/db/prismaClient.js";
import { logger } from "../../config/logger.js";
import { eventBus } from "../../events/eventBus.js";
import { AppError } from "../../common/errors/AppError.js";

import {
  mapDbProductToEntity,
  mapDbImageToEntity,
  mapDbVariantToEntity,
  toProductCardDto,
  toProductDetailDto,
  toPrismaWhere,
  toPrismaOrderBy,
  type ProductFilters,
  type ProductSortKey,
  type Product,
  type ProductImage,
  type ProductVariant,
} from "./product.entity.js";

import {
  type ListProductsQuery,
  type CreateProductInput,
  type UpdateProductInput,
  type AddImageInput,
  type UpdateImageInput,
  type AddReviewInput,
  type ListReviewsQuery,
} from "./product.validators.js";
import { listCategories } from "./category.entity.js"; // NEW

// ---------------- Utils ----------------

function slugify(input: string): string {
  const s = (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "product";
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.product.findFirst({
      where: excludeId
        ? { slug, NOT: { id: excludeId } }
        : { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
    if (n > 50) {
      slug = `${base}-${Date.now().toString().slice(-6)}`;
    }
  }
}

async function resolveBrandId(input: { brandId?: string | undefined; brandSlug?: string | undefined }): Promise<string> {
  if (input.brandId) return input.brandId;
  if (input.brandSlug) {
    const b = await prisma.brand.findUnique({ where: { slug: input.brandSlug }, select: { id: true } });
    if (!b) throw new AppError("برند یافت نشد.", 404, "BRAND_NOT_FOUND");
    return b.id;
  }
  throw new AppError("شناسه یا اسلاگ برند الزامی است.", 400, "BRAND_REQUIRED");
}

function pickCoreProductData(input: CreateProductInput | UpdateProductInput, brandId?: string) {
  const data: any = {
    // Relations (use nested connect/disconnect)
    ...(brandId ? { brand: { connect: { id: brandId } } } : {}),

    ...(input.colorThemeId !== undefined
      ? input.colorThemeId
        ? { colorTheme: { connect: { id: input.colorThemeId } } }
        : { colorTheme: { disconnect: true } }
      : {}),

    ...(input.collectionId !== undefined
      ? input.collectionId
        ? { collection: { connect: { id: input.collectionId } } }
        : { collection: { disconnect: true } }
      : {}),

    ...((input as any).categoryId !== undefined
      ? (input as any).categoryId
        ? { dbCategory: { connect: { id: (input as any).categoryId } } }
        : { dbCategory: { disconnect: true } }
      : {}),

    // Scalars (no legacy category here)
    ...(input.title ? { title: input.title } : {}),
    ...(input.subtitle !== undefined ? { subtitle: input.subtitle || null } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.ingredients !== undefined ? { ingredients: input.ingredients || null } : {}),
    ...(input.howToUse !== undefined ? { howToUse: input.howToUse || null } : {}),

    ...(typeof input.price === "number" ? { price: input.price } : {}),
    ...(input.compareAtPrice !== undefined ? { compareAtPrice: input.compareAtPrice || null } : {}),
    ...(input.currencyCode ? { currencyCode: input.currencyCode } : {}),

    ...(typeof (input as any).ratingAvg === "number" ? { ratingAvg: (input as any).ratingAvg } : {}),
    ...(typeof (input as any).ratingCount === "number" ? { ratingCount: (input as any).ratingCount } : {}),

    ...(typeof input.isBestseller === "boolean" ? { isBestseller: input.isBestseller } : {}),
    ...(typeof input.isFeatured === "boolean" ? { isFeatured: input.isFeatured } : {}),
    ...(typeof input.isSpecialProduct === "boolean" ? { isSpecialProduct: input.isSpecialProduct } : {}),
    ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),

    ...(input.heroImageUrl !== undefined ? { heroImageUrl: input.heroImageUrl } : {}),
    ...(input.internalNotes !== undefined ? { internalNotes: input.internalNotes || null } : {}),
  };

  return data;
}

function includeForList(opts?: { includeImages?: boolean; includeVariants?: boolean }) {
  return {
    brand: true,
    dbCategory: true,
    colorTheme: true,
    images: opts?.includeImages
      ? { orderBy: { position: "asc" as const } }
      : undefined,
    variants: opts?.includeVariants
      ? { where: { isActive: true }, orderBy: { position: "asc" as const } }
      : undefined,
  };
}

const includeForDetail = {
  brand: true,
  dbCategory: true,
  colorTheme: true,
  images: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { position: "asc" as const } },
  badges: { select: { id: true, title: true, icon: true } },
  reviews: {
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" as const },
    take: 20, // latest 20 approved
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  },
  relatedOut: {
    orderBy: { position: "asc" as const },
    include: {
      relatedProduct: {
        include: includeForList({ includeImages: true, includeVariants: true }) as any,
      },
    },
  },
};

// ---------------- Service ----------------

class ProductService {
  // List products with filters/sort/pagination
  async list(query: ListProductsQuery) {
    const { page, perPage, sort, includeImages, includeVariants, ...rest } = query;

    // Normalize categories into canonical slugs (skincare/makeup/...) regardless of input format
    const categoryValues = Array.isArray(rest.categories)
      ? rest.categories
        .map((s) =>
          String(s || "").trim().toLowerCase().replace(/[\s_]+/g, "-")
        )
        .filter(Boolean)
      : [];
    const where = toPrismaWhere({
      search: rest.search,
      categories: categoryValues as any,
      brandIds: rest.brandIds as any,
      brandSlugs: rest.brandSlugs as any,
      collectionIds: rest.collectionIds as any,
      collectionSlugs: rest.collectionSlugs as any,
      colorThemeIds: rest.colorThemeIds as any,
      minPrice: rest.minPrice,
      maxPrice: rest.maxPrice,
      specialOnly: rest.specialOnly,
      featuredOnly: rest.featuredOnly,
      bestsellerOnly: rest.bestsellerOnly,
      activeOnly: rest.activeOnly,
    } as ProductFilters);

    const orderBy = toPrismaOrderBy(sort as ProductSortKey);
    const skip = (page - 1) * perPage;
    const take = perPage;

    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: orderBy as any,
        skip,
        take,
        include: includeForList({ includeImages, includeVariants }) as any,
      }),
    ]);

    const items = rows.map((r: any) => toProductCardDto(mapDbProductToEntity(r)));
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return {
      items,
      meta: { page, perPage, total, totalPages },
    };
  }

  // Get one product by ID (detailed)
  async getById(id: string) {
    const row = await prisma.product.findUnique({
      where: { id },
      include: includeForDetail as any,
    });
    if (!row) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");

    // Aggregate approved reviews (full count/avg)
    const agg = await prisma.productReview.aggregate({
      where: { productId: id, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    });

    const entity = mapDbProductToEntity(row);
    entity.ratingAvg = Number((agg as any)._avg?.rating ?? 0);
    entity.ratingCount = Number((agg as any)._count ?? 0);

    // Related cards (ordered by position)
    const relatedCards =
      (row.relatedOut ?? [])
        .map((rp: any) => rp.relatedProduct)
        .filter(Boolean)
        .map((p: any) => toProductCardDto(mapDbProductToEntity(p)));

    const dto = toProductDetailDto(entity);
    dto.related = relatedCards;
    return dto;
  }

  // Get one product by slug (detailed)
  async getBySlug(slug: string) {
    const row = await prisma.product.findUnique({
      where: { slug },
      include: includeForDetail as any,
    });
    if (!row) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");

    // Aggregate approved reviews (full count/avg)
    const agg = await prisma.productReview.aggregate({
      where: { productId: row.id, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    });

    const entity = mapDbProductToEntity(row);
    entity.ratingAvg = Number((agg as any)._avg?.rating ?? 0);
    entity.ratingCount = Number((agg as any)._count ?? 0);

    // Related cards (ordered by position)
    const relatedCards =
      (row.relatedOut ?? [])
        .map((rp: any) => rp.relatedProduct)
        .filter(Boolean)
        .map((p: any) => toProductCardDto(mapDbProductToEntity(p)));

    const dto = toProductDetailDto(entity);
    dto.related = relatedCards;
    return dto;
  }

  // Create product with optional images/variants
  async create(input: CreateProductInput) {
    const brandId = await resolveBrandId({ brandId: input.brandId, brandSlug: input.brandSlug });
    const baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);
    const slug = await ensureUniqueSlug(baseSlug);

    const coreData = { ...pickCoreProductData({ ...input, slug }, brandId) };

    const result = await prisma.$transaction(async (tx: {
      product: { create: (args: { data: any }) => any };
      productImage: { createMany: (args: { data: { productId: string; url: string; alt: string | null; position: number }[] }) => any };
      productVariant: { createMany: (args: { data: { productId: string; variantName: string; sku: string | null; price: number | null; currencyCode: "IRT" | "USD" | "EUR"; stock: number; colorName: string | null; colorHexCode: string | null; isActive: boolean; position: number }[] }) => any };
      relatedProduct: { createMany: (args: { data: { productId: string; relatedProductId: string; position: number }[] }) => any };
    }) => {
      const product = await tx.product.create({
        data: {
          ...coreData,
          ...(Array.isArray((input as any).badgeIds) && (input as any).badgeIds.length
            ? { badges: { connect: (input as any).badgeIds.map((id: string) => ({ id })) } }
            : {}),
        },
      });

      if (Array.isArray(input.images) && input.images.length) {
        await tx.productImage.createMany({
          data: input.images.map((img, idx) => ({
            productId: product.id,
            url: img.url,
            alt: img.alt ?? null,
            position: typeof img.position === "number" ? img.position : idx,
          })),
        });
      }

      if (Array.isArray(input.variants) && input.variants.length) {
        await tx.productVariant.createMany({
          data: input.variants.map((v, idx) => ({
            productId: product.id,
            variantName: v.variantName,
            sku: v.sku ?? null,
            price: typeof v.price === "number" ? v.price : null,
            currencyCode: v.currencyCode ?? "IRT",
            stock: v.stock ?? 0,
            colorName: v.colorName ?? null,
            colorHexCode: v.colorHexCode ?? null,
            isActive: typeof v.isActive === "boolean" ? v.isActive : true,
            position: typeof v.position === "number" ? v.position : idx,
          })),
        });
      }
      // Related products (optional)
      const relatedIdsRaw: string[] = Array.isArray((input as any).relatedProductIds)
        ? (input as any).relatedProductIds
        : [];
      const relatedIds = Array.from(new Set(relatedIdsRaw.filter((rid) => rid && rid !== product.id)));
      if (relatedIds.length) {
        await tx.relatedProduct.createMany({
          data: relatedIds.map((rid, idx) => ({
            productId: product.id,
            relatedProductId: rid,
            position: idx,
          })),
        });
      }
      return product.id;
    });

    const created = await prisma.product.findUnique({
      where: { id: result },
      include: includeForDetail as any,
    });

    const entity = mapDbProductToEntity(created);
    eventBus.emit("product.created", { productId: entity.id, slug: entity.slug, category: entity.category });

    // Related cards (likely empty right after create)
    const relatedCards =
      (created?.relatedOut ?? [])
        .map((rp: any) => rp.relatedProduct)
        .filter(Boolean)
        .map((p: any) => toProductCardDto(mapDbProductToEntity(p)));

    const dto = toProductDetailDto(entity);
    dto.related = relatedCards;
    return dto;
  }

  // Update product. If images/variants provided, replace the set transactionally.
  async update(id: string, input: UpdateProductInput) {
    // Ensure exists
    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");

    const brandId = input.brandId || input.brandSlug ? await resolveBrandId({ brandId: input.brandId, brandSlug: input.brandSlug }) : undefined;

    let slugUpdate: string | undefined;
    if (typeof input.slug !== "undefined" && input.slug) {
      const base = slugify(input.slug);
      slugUpdate = await ensureUniqueSlug(base, id);
    }

    const coreData = { ...pickCoreProductData({ ...input, slug: slugUpdate }, brandId) };

    await prisma.$transaction(async (tx: {
      product: { update: (args: { where: { id: string }; data: any }) => any };
      productImage: { deleteMany: (args: { where: { productId: string } }) => any; createMany: (args: { data: { productId: string; url: string; alt: string | null; position: number }[] }) => any };
      productVariant: { deleteMany: (args: { where: { productId: string } }) => any; createMany: (args: { data: { productId: string; variantName: string; sku: string | null; price: number | null; currencyCode: "IRT" | "USD" | "EUR"; stock: number; colorName: string | null; colorHexCode: string | null; isActive: boolean; position: number }[] }) => any };
      relatedProduct: { deleteMany: (args: { where: { productId: string } }) => any; createMany: (args: { data: { productId: string; relatedProductId: string; position: number }[] }) => any };
    }) => {
      await tx.product.update({
        where: { id }, data: {
          ...coreData,
          // If badgeIds is provided (even []), replace the set accordingly
          ...(Array.isArray((input as any).badgeIds)
            ? { badges: { set: (input as any).badgeIds.map((bid: string) => ({ id: bid })) } }
            : {}),
        },
      });

      if (Array.isArray(input.images)) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (input.images.length) {
          await tx.productImage.createMany({
            data: input.images.map((img, idx) => ({
              productId: id,
              url: img.url,
              alt: img.alt ?? null,
              position: typeof img.position === "number" ? img.position : idx,
            })),
          });
        }
      }

      if (Array.isArray(input.variants)) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (input.variants.length) {
          await tx.productVariant.createMany({
            data: input.variants.map((v, idx) => ({
              productId: id,
              variantName: v.variantName,
              sku: v.sku ?? null,
              price: typeof v.price === "number" ? v.price : null,
              currencyCode: v.currencyCode ?? "IRT",
              stock: v.stock ?? 0,
              colorName: v.colorName ?? null,
              colorHexCode: v.colorHexCode ?? null,
              isActive: typeof v.isActive === "boolean" ? v.isActive : true,
              position: typeof v.position === "number" ? v.position : idx,
            })),
          });
        }
      }


      // Related products (replace set if provided)
      if (Array.isArray((input as any).relatedProductIds)) {
        const relatedIds = Array.from(
          new Set(((input as any).relatedProductIds as string[]).filter((rid) => rid && rid !== id))
        );
        await tx.relatedProduct.deleteMany({ where: { productId: id } });
        if (relatedIds.length) {
          await tx.relatedProduct.createMany({
            data: relatedIds.map((rid, idx) => ({
              productId: id,
              relatedProductId: rid,
              position: idx,
            })),
          });
        }
      }
    });

    const updated = await prisma.product.findUnique({
      where: { id },
      include: includeForDetail as any,
    });

    const entity = mapDbProductToEntity(updated);
    eventBus.emit("product.updated", { productId: entity.id, slug: entity.slug });

    const relatedCards =
      (updated?.relatedOut ?? [])
        .map((rp: any) => rp.relatedProduct)
        .filter(Boolean)
        .map((p: any) => toProductCardDto(mapDbProductToEntity(p)));

    const dto = toProductDetailDto(entity);
    dto.related = relatedCards;
    return dto;
  }

  // ---------------- Images ----------------

  async addImage(productId: string, input: AddImageInput): Promise<ProductImage> {
    // Ensure product exists
    const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!exists) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");

    const row = await prisma.productImage.create({
      data: {
        productId,
        url: input.url,
        alt: input.alt ?? null,
        position: typeof input.position === "number" ? input.position : 0,
      },
    });
    eventBus.emit("product.image.added", { productId, imageId: row.id });
    return mapDbImageToEntity(row);
  }

  async updateImage(productId: string, imageId: string, input: UpdateImageInput): Promise<ProductImage> {
    const img = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img || img.productId !== productId) {
      throw new AppError("تصویر یافت نشد.", 404, "IMAGE_NOT_FOUND");
    }
    const row = await prisma.productImage.update({
      where: { id: imageId },
      data: {
        ...(input.url !== undefined && { url: input.url }),
        ...(input.alt !== undefined && { alt: input.alt }),
        ...(input.position !== undefined && { position: input.position }),
      },
    });
    eventBus.emit("product.image.updated", { productId, imageId });
    return mapDbImageToEntity(row);
  }

  async deleteImage(productId: string, imageId: string): Promise<{ deleted: boolean }> {
    const img = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img || img.productId !== productId) {
      throw new AppError("تصویر یافت نشد.", 404, "IMAGE_NOT_FOUND");
    }
    await prisma.productImage.delete({ where: { id: imageId } });
    eventBus.emit("product.image.deleted", { productId, imageId });
    return { deleted: true };
  }

  // ---------------- Variants ----------------

  async addVariant(productId: string, input: any /* AddVariantInput */): Promise<ProductVariant> {
    const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!exists) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");

    const row = await prisma.productVariant.create({
      data: {
        productId,
        variantName: input.variantName,
        sku: input.sku ?? null,
        price: typeof input.price === "number" ? input.price : null,
        currencyCode: input.currencyCode ?? "IRT",
        stock: input.stock ?? 0,
        colorName: input.colorName ?? null,
        colorHexCode: input.colorHexCode ?? null,
        isActive: typeof input.isActive === "boolean" ? input.isActive : true,
        position: typeof input.position === "number" ? input.position : 0,
      },
    });
    eventBus.emit("product.variant.added", { productId, variantId: row.id });
    return mapDbVariantToEntity(row);
  }

  async updateVariant(productId: string, variantId: string, input: any /* UpdateVariantInput */): Promise<ProductVariant> {
    const v = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!v || v.productId !== productId) throw new AppError("واریانت یافت نشد.", 404, "VARIANT_NOT_FOUND");

    const row = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(input.variantName !== undefined && { variantName: input.variantName }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.currencyCode !== undefined && { currencyCode: input.currencyCode }),
        ...(input.stock !== undefined && { stock: input.stock }),
        ...(input.colorName !== undefined && { colorName: input.colorName }),
        ...(input.colorHexCode !== undefined && { colorHexCode: input.colorHexCode }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.position !== undefined && { position: input.position }),
      },
    });
    eventBus.emit("product.variant.updated", { productId, variantId });
    return mapDbVariantToEntity(row);
  }

  async deleteVariant(productId: string, variantId: string): Promise<{ deleted: boolean }> {
    const v = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!v || v.productId !== productId) throw new AppError("واریانت یافت نشد.", 404, "VARIANT_NOT_FOUND");
    await prisma.productVariant.delete({ where: { id: variantId } });
    eventBus.emit("product.variant.deleted", { productId, variantId });
    return { deleted: true };
  }

  // ---------------- Reviews (existing, unchanged from previous step) ----------------

  async listReviewsByProductId(productId: string, query: ListReviewsQuery) {
    const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!exists) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");

    const { page, perPage } = query;
    const where = { productId, status: "APPROVED" as const };
    const [total, rows] = await Promise.all([
      prisma.productReview.count({ where }),
      prisma.productReview.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { user: { select: { firstName: true, lastName: true, id: true } } },
      }),
    ]);

    const items = rows.map((r: { id: any; rating: any; title: any; body: any; createdAt: { toISOString: () => any; }; }) => {
      const firstName = (r as any).user?.firstName ?? "";
      const lastName = (r as any).user?.lastName ?? "";
      const full = `${firstName} ${lastName}`.trim();
      const authorName = full || (r as any).guestName || "کاربر";
      return {
        id: r.id,
        authorName,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    return { items, meta: { page, perPage, total, totalPages } };
  }

  async listReviewsBySlug(slug: string, query: ListReviewsQuery) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!product) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
    return this.listReviewsByProductId(product.id, query);
  }

  async addReviewByProductId(productId: string, input: AddReviewInput, userId?: string | null) {
    const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!exists) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");

    const row = await prisma.productReview.create({
      data: {
        productId,
        userId: userId ?? null,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body,
        guestName: userId ? null : input.guestName ?? null,
        status: "APPROVED",
      },
    });

    eventBus.emit("product.review.added", { productId, reviewId: row.id, rating: row.rating });

    const authorName = userId ? "کاربر" : (input.guestName || "کاربر");

    return {
      id: row.id,
      authorName,
      rating: row.rating,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async addReviewBySlug(slug: string, input: AddReviewInput, userId?: string | null) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!product) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
    return this.addReviewByProductId(product.id, input, userId);
  }

  // ---------------- Filters for sidebar (NEW) ----------------

  async getFilterOptions() {
    // DB-backed categories with counts (optional hero image)
    const dbCatCounts = await prisma.product.groupBy({
      by: ["categoryId"],
      where: { isActive: true, categoryId: { not: null } },
      _count: { _all: true },
    }) as Array<{ categoryId: string | null; _count: { _all: number } }>;

    const dbCatCountMap = new Map<string, number>();
    for (const c of dbCatCounts) {
      if (c.categoryId) dbCatCountMap.set(c.categoryId, c._count._all);
    }
    const dbCategoriesRaw = await prisma.category.findMany({
      select: { id: true, value: true, label: true, heroImageUrl: true, icon: true },
      orderBy: { label: "asc" },
    });
    const dbCategories = dbCategoriesRaw.map((c: typeof dbCategoriesRaw[number]) => ({
      id: c.id,
      value: c.value,
      label: c.label,
      heroImageUrl: c.heroImageUrl,
      icon: c.icon || "grid",
      count: dbCatCountMap.get(c.id) ?? 0,
    }));
    const brandCounts = await prisma.product.groupBy({
      by: ["brandId"],
      where: { isActive: true },
      _count: { _all: true },
    });

    const brandIdList = brandCounts.map((b: { brandId: any; }) => b.brandId);
    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIdList.length ? brandIdList : ["00000000-0000-0000-0000-000000000000"] } },
      select: { id: true, name: true, slug: true },
    });
    const brandCountMap = new Map(brandCounts.map((b: { brandId: any; _count: { _all: any; }; }) => [b.brandId, b._count._all]));
    const brandOptions = brands
      .map((b: { id: unknown; name: any; slug: any; }) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        count: brandCountMap.get(b.id) ?? 0,
      }))
      .sort((a: { name: string; }, b: { name: any; }) => a.name.localeCompare(b.name, "fa"));

    // inside getFilterOptions() method

    const allCollections = await prisma.collection.findMany({
      select: {
        id: true,
        name: true,
        heroImageUrl: true,
        subtitle: true, // NEW
        isFeatured: true, // NEW
        displayOrder: true, // NEW
      },
    });
    const collectionCounts = await prisma.product.groupBy({
      by: ["collectionId"],
      where: { isActive: true, collectionId: { not: null } },
      _count: { _all: true },
    });
    const collCountMap = new Map<string, number>();
    for (const c of collectionCounts) {
      if (c.collectionId) collCountMap.set(c.collectionId, c._count._all);
    }
    const collectionOptions = allCollections
      .map((c: { id: string; name: string; heroImageUrl: string | null; subtitle: string | null; isFeatured: boolean; displayOrder: number }) => ({
        id: c.id,
        name: c.name,
        heroImageUrl: c.heroImageUrl || null,
        subtitle: c.subtitle || null,
        isFeatured: c.isFeatured,
        displayOrder: c.displayOrder,
        count: collCountMap.get(c.id) ?? 0,
      }))
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "fa"));
    const agg = await prisma.product.aggregate({
      where: { isActive: true },
      _min: { price: true },
      _max: { price: true },
    });
    const priceRange = {
      min: agg._min.price ?? 0,
      max: agg._max.price ?? 0,
    };

    return {
      categories: listCategories(),
      dbCategories,
      brands: brandOptions,
      collections: collectionOptions,
      priceRange,
    };
  }
  // Add after the getFilterOptions method, before the closing bracket of the class

  // Get top selling products for search suggestions
  async getTopSelling(limit: number = 4) {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [
        { isBestseller: 'desc' },
        { ratingCount: 'desc' },
        { ratingAvg: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
      }
    });

    return products.map((p: { id: string; slug: string; title: string }) => ({
      title: p.title,
      slug: p.slug,
      url: `/shop?search=${encodeURIComponent(p.title)}`
    }));
  }
}

export const productService = new ProductService();