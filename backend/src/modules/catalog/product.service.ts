// src/modules/catalog/product.service.ts
// Products service: listing, read (id/slug), create/update, and child resources (images/variants).
// Works with your SQL schema via Prisma and maps rows to domain entities/DTOs.

import { prisma } from "../../infrastructure/db/prismaClient";
import { logger } from "../../config/logger";
import { eventBus } from "../../events/eventBus";
import { AppError } from "../../common/errors/AppError";

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
} from "./product.entity";

import {
  type ListProductsQuery,
  type CreateProductInput,
  type UpdateProductInput,
  type AddImageInput,
  type UpdateImageInput,
} from "./product.validators";

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

async function resolveBrandId(input: { brandId?: string; brandSlug?: string }): Promise<string> {
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
    // Relations
    ...(brandId ? { brandId } : {}),
    ...(input.colorThemeId ? { colorThemeId: input.colorThemeId } : {}),

    // Scalars
    ...(input.category ? { category: input.category } : {}),
    ...(input.title ? { title: input.title } : {}),
    ...(typeof input.subtitle !== "undefined" ? { subtitle: input.subtitle } : {}),
    ...(typeof input.slug !== "undefined" ? { slug: input.slug } : {}),
    ...(typeof input.description !== "undefined" ? { description: input.description } : {}),
    ...(typeof input.ingredients !== "undefined" ? { ingredients: input.ingredients } : {}),
    ...(typeof input.howToUse !== "undefined" ? { howToUse: input.howToUse } : {}),

    ...(typeof input.price === "number" ? { price: input.price } : {}),
    ...(typeof input.compareAtPrice !== "undefined" ? { compareAtPrice: input.compareAtPrice } : {}),
    ...(input.currencyCode ? { currencyCode: input.currencyCode } : {}),

    ...(typeof (input as any).ratingAvg === "number" ? { ratingAvg: (input as any).ratingAvg } : {}),
    ...(typeof (input as any).ratingCount === "number" ? { ratingCount: (input as any).ratingCount } : {}),

    ...(typeof input.isBestseller === "boolean" ? { isBestseller: input.isBestseller } : {}),
    ...(typeof input.isFeatured === "boolean" ? { isFeatured: input.isFeatured } : {}),
    ...(typeof input.isSpecialProduct === "boolean" ? { isSpecialProduct: input.isSpecialProduct } : {}),
    ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),

    ...(typeof input.heroImageUrl !== "undefined" ? { heroImageUrl: input.heroImageUrl } : {}),
  };
  return data;
}

function includeForList(opts?: { includeImages?: boolean; includeVariants?: boolean }) {
  return {
    brand: true,
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
  colorTheme: true,
  images: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { position: "asc" as const } },
};

// ---------------- Service ----------------

class ProductService {
  // List products with filters/sort/pagination
  async list(query: ListProductsQuery) {
    const { page, perPage, sort, includeImages, includeVariants, ...rest } = query;

    const where = toPrismaWhere({
      search: rest.search,
      categories: rest.categories,
      brandIds: rest.brandIds,
      brandSlugs: rest.brandSlugs,
      collectionIds: rest.collectionIds,
      collectionSlugs: rest.collectionSlugs,
      colorThemeIds: rest.colorThemeIds,
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

    const items = rows.map((r) => toProductCardDto(mapDbProductToEntity(r)));
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
    const entity = mapDbProductToEntity(row);
    return toProductDetailDto(entity);
  }

  // Get one product by slug (detailed)
  async getBySlug(slug: string) {
    const row = await prisma.product.findUnique({
      where: { slug },
      include: includeForDetail as any,
    });
    if (!row) throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
    const entity = mapDbProductToEntity(row);
    return toProductDetailDto(entity);
  }

  // Create product with optional images/variants
  async create(input: CreateProductInput) {
    const brandId = await resolveBrandId({ brandId: input.brandId, brandSlug: input.brandSlug });
    const baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);
    const slug = await ensureUniqueSlug(baseSlug);

    const coreData = { ...pickCoreProductData({ ...input, slug }, brandId) };

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: coreData,
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
            currencyCode: v.currencyCode ?? "IRR",
            stock: v.stock ?? 0,
            colorName: v.colorName ?? null,
            colorHexCode: v.colorHexCode ?? null,
            isActive: typeof v.isActive === "boolean" ? v.isActive : true,
            position: typeof v.position === "number" ? v.position : idx,
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
    return toProductDetailDto(entity);
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

    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: coreData });

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
              currencyCode: v.currencyCode ?? "IRR",
              stock: v.stock ?? 0,
              colorName: v.colorName ?? null,
              colorHexCode: v.colorHexCode ?? null,
              isActive: typeof v.isActive === "boolean" ? v.isActive : true,
              position: typeof v.position === "number" ? v.position : idx,
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
    return toProductDetailDto(entity);
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
        url: input.url ?? undefined,
        alt: typeof input.alt !== "undefined" ? input.alt : undefined,
        position: typeof input.position === "number" ? input.position : undefined,
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
        currencyCode: input.currencyCode ?? "IRR",
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
        variantName: input.variantName ?? undefined,
        sku: typeof input.sku !== "undefined" ? input.sku : undefined,
        price: typeof input.price === "number" ? input.price : input.price === null ? null : undefined,
        currencyCode: input.currencyCode ?? undefined,
        stock: typeof input.stock === "number" ? input.stock : undefined,
        colorName: typeof input.colorName !== "undefined" ? input.colorName : undefined,
        colorHexCode: typeof input.colorHexCode !== "undefined" ? input.colorHexCode : undefined,
        isActive: typeof input.isActive === "boolean" ? input.isActive : undefined,
        position: typeof input.position === "number" ? input.position : undefined,
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
}

export const productService = new ProductService();