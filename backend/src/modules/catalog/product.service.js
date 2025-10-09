// src/modules/catalog/product.service.ts
// Products service: listing, read (id/slug), create/update, and child resources (images/variants).
// Now also loads badges, approved reviews, and related products from DB.
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { logger } from "../../config/logger.js";
import { eventBus } from "../../events/eventBus.js";
import { AppError } from "../../common/errors/AppError.js";
import { mapDbProductToEntity, mapDbImageToEntity, mapDbVariantToEntity, toProductCardDto, toProductDetailDto, toPrismaWhere, toPrismaOrderBy, } from "./product.entity.js";
import {} from "./product.validators.js";
import { listCategories, normalizeCategories } from "./category.entity.js"; // NEW
// ---------------- Utils ----------------
function slugify(input) {
    const s = (input || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return s || "product";
}
async function ensureUniqueSlug(base, excludeId) {
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
        if (!existing)
            return slug;
        n += 1;
        slug = `${base}-${n}`;
        if (n > 50) {
            slug = `${base}-${Date.now().toString().slice(-6)}`;
        }
    }
}
async function resolveBrandId(input) {
    if (input.brandId)
        return input.brandId;
    if (input.brandSlug) {
        const b = await prisma.brand.findUnique({ where: { slug: input.brandSlug }, select: { id: true } });
        if (!b)
            throw new AppError("برند یافت نشد.", 404, "BRAND_NOT_FOUND");
        return b.id;
    }
    throw new AppError("شناسه یا اسلاگ برند الزامی است.", 400, "BRAND_REQUIRED");
}
function pickCoreProductData(input, brandId) {
    const data = {
        // Relations
        ...(brandId ? { brandId } : {}),
        ...(input.colorThemeId !== undefined ? { colorThemeId: input.colorThemeId || null } : {}),
        ...(input.collectionId !== undefined ? { collectionId: input.collectionId || null } : {}),
        // Scalars
        ...(input.category ? { category: input.category } : {}),
        ...(input.title ? { title: input.title } : {}),
        ...(input.subtitle !== undefined ? { subtitle: input.subtitle || null } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.ingredients !== undefined ? { ingredients: input.ingredients || null } : {}),
        ...(input.howToUse !== undefined ? { howToUse: input.howToUse || null } : {}),
        ...(typeof input.price === "number" ? { price: input.price } : {}),
        ...(input.compareAtPrice !== undefined ? { compareAtPrice: input.compareAtPrice || null } : {}),
        ...(input.currencyCode ? { currencyCode: input.currencyCode } : {}),
        ...(typeof input.ratingAvg === "number" ? { ratingAvg: input.ratingAvg } : {}),
        ...(typeof input.ratingCount === "number" ? { ratingCount: input.ratingCount } : {}),
        ...(typeof input.isBestseller === "boolean" ? { isBestseller: input.isBestseller } : {}),
        ...(typeof input.isFeatured === "boolean" ? { isFeatured: input.isFeatured } : {}),
        ...(typeof input.isSpecialProduct === "boolean" ? { isSpecialProduct: input.isSpecialProduct } : {}),
        ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
        // Fix heroImageUrl handling - accept null, undefined, or valid URL
        ...(input.heroImageUrl !== undefined ? {
            heroImageUrl: input.heroImageUrl
        } : {}),
        ...(input.internalNotes !== undefined ? { internalNotes: input.internalNotes || null } : {}),
    };
    return data;
}
function includeForList(opts) {
    return {
        brand: true,
        colorTheme: true,
        images: opts?.includeImages
            ? { orderBy: { position: "asc" } }
            : undefined,
        variants: opts?.includeVariants
            ? { where: { isActive: true }, orderBy: { position: "asc" } }
            : undefined,
    };
}
const includeForDetail = {
    brand: true,
    colorTheme: true,
    images: { orderBy: { position: "asc" } },
    variants: { orderBy: { position: "asc" } },
    badges: { select: { id: true, title: true, icon: true } },
    reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 20, // latest 20 approved
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
    },
    relatedOut: {
        orderBy: { position: "asc" },
        include: {
            relatedProduct: {
                include: includeForList({ includeImages: true, includeVariants: true }),
            },
        },
    },
};
// ---------------- Service ----------------
class ProductService {
    // List products with filters/sort/pagination
    async list(query) {
        const { page, perPage, sort, includeImages, includeVariants, ...rest } = query;
        // Normalize categories into canonical slugs (skincare/makeup/...) regardless of input format
        const normalizedCategories = normalizeCategories(rest.categories);
        const where = toPrismaWhere({
            search: rest.search,
            categories: normalizedCategories,
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
        });
        const orderBy = toPrismaOrderBy(sort);
        const skip = (page - 1) * perPage;
        const take = perPage;
        const [total, rows] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                orderBy: orderBy,
                skip,
                take,
                include: includeForList({ includeImages, includeVariants }),
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
    async getById(id) {
        const row = await prisma.product.findUnique({
            where: { id },
            include: includeForDetail,
        });
        if (!row)
            throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
        // Aggregate approved reviews (full count/avg)
        const agg = await prisma.productReview.aggregate({
            where: { productId: id, status: "APPROVED" },
            _avg: { rating: true },
            _count: true,
        });
        const entity = mapDbProductToEntity(row);
        entity.ratingAvg = Number(agg._avg?.rating ?? 0);
        entity.ratingCount = Number(agg._count ?? 0);
        // Related cards (ordered by position)
        const relatedCards = (row.relatedOut ?? [])
            .map((rp) => rp.relatedProduct)
            .filter(Boolean)
            .map((p) => toProductCardDto(mapDbProductToEntity(p)));
        const dto = toProductDetailDto(entity);
        dto.related = relatedCards;
        return dto;
    }
    // Get one product by slug (detailed)
    async getBySlug(slug) {
        const row = await prisma.product.findUnique({
            where: { slug },
            include: includeForDetail,
        });
        if (!row)
            throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
        // Aggregate approved reviews (full count/avg)
        const agg = await prisma.productReview.aggregate({
            where: { productId: row.id, status: "APPROVED" },
            _avg: { rating: true },
            _count: true,
        });
        const entity = mapDbProductToEntity(row);
        entity.ratingAvg = Number(agg._avg?.rating ?? 0);
        entity.ratingCount = Number(agg._count ?? 0);
        // Related cards (ordered by position)
        const relatedCards = (row.relatedOut ?? [])
            .map((rp) => rp.relatedProduct)
            .filter(Boolean)
            .map((p) => toProductCardDto(mapDbProductToEntity(p)));
        const dto = toProductDetailDto(entity);
        dto.related = relatedCards;
        return dto;
    }
    // Create product with optional images/variants
    async create(input) {
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
            include: includeForDetail,
        });
        const entity = mapDbProductToEntity(created);
        eventBus.emit("product.created", { productId: entity.id, slug: entity.slug, category: entity.category });
        // Related cards (likely empty right after create)
        const relatedCards = (created?.relatedOut ?? [])
            .map((rp) => rp.relatedProduct)
            .filter(Boolean)
            .map((p) => toProductCardDto(mapDbProductToEntity(p)));
        const dto = toProductDetailDto(entity);
        dto.related = relatedCards;
        return dto;
    }
    // Update product. If images/variants provided, replace the set transactionally.
    async update(id, input) {
        // Ensure exists
        const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true } });
        if (!existing)
            throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
        const brandId = input.brandId || input.brandSlug ? await resolveBrandId({ brandId: input.brandId, brandSlug: input.brandSlug }) : undefined;
        let slugUpdate;
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
            include: includeForDetail,
        });
        const entity = mapDbProductToEntity(updated);
        eventBus.emit("product.updated", { productId: entity.id, slug: entity.slug });
        const relatedCards = (updated?.relatedOut ?? [])
            .map((rp) => rp.relatedProduct)
            .filter(Boolean)
            .map((p) => toProductCardDto(mapDbProductToEntity(p)));
        const dto = toProductDetailDto(entity);
        dto.related = relatedCards;
        return dto;
    }
    // ---------------- Images ----------------
    async addImage(productId, input) {
        // Ensure product exists
        const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
        if (!exists)
            throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
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
    async updateImage(productId, imageId, input) {
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
    async deleteImage(productId, imageId) {
        const img = await prisma.productImage.findUnique({ where: { id: imageId } });
        if (!img || img.productId !== productId) {
            throw new AppError("تصویر یافت نشد.", 404, "IMAGE_NOT_FOUND");
        }
        await prisma.productImage.delete({ where: { id: imageId } });
        eventBus.emit("product.image.deleted", { productId, imageId });
        return { deleted: true };
    }
    // ---------------- Variants ----------------
    async addVariant(productId, input /* AddVariantInput */) {
        const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
        if (!exists)
            throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
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
    async updateVariant(productId, variantId, input /* UpdateVariantInput */) {
        const v = await prisma.productVariant.findUnique({ where: { id: variantId } });
        if (!v || v.productId !== productId)
            throw new AppError("واریانت یافت نشد.", 404, "VARIANT_NOT_FOUND");
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
    async deleteVariant(productId, variantId) {
        const v = await prisma.productVariant.findUnique({ where: { id: variantId } });
        if (!v || v.productId !== productId)
            throw new AppError("واریانت یافت نشد.", 404, "VARIANT_NOT_FOUND");
        await prisma.productVariant.delete({ where: { id: variantId } });
        eventBus.emit("product.variant.deleted", { productId, variantId });
        return { deleted: true };
    }
    // ---------------- Reviews (existing, unchanged from previous step) ----------------
    async listReviewsByProductId(productId, query) {
        const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
        if (!exists)
            throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
        const { page, perPage } = query;
        const where = { productId, status: "APPROVED" };
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
        const items = rows.map((r) => {
            const firstName = r.user?.firstName ?? "";
            const lastName = r.user?.lastName ?? "";
            const full = `${firstName} ${lastName}`.trim();
            const authorName = full || r.guestName || "کاربر";
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
    async listReviewsBySlug(slug, query) {
        const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
        if (!product)
            throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
        return this.listReviewsByProductId(product.id, query);
    }
    async addReviewByProductId(productId, input, userId) {
        const exists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
        if (!exists)
            throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
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
    async addReviewBySlug(slug, input, userId) {
        const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
        if (!product)
            throw new AppError("محصول یافت نشد.", 404, "PRODUCT_NOT_FOUND");
        return this.addReviewByProductId(product.id, input, userId);
    }
    // ---------------- Filters for sidebar (NEW) ----------------
    async getFilterOptions() {
        const brandCounts = await prisma.product.groupBy({
            by: ["brandId"],
            where: { isActive: true },
            _count: { _all: true },
        });
        const brandIdList = brandCounts.map((b) => b.brandId);
        const brands = await prisma.brand.findMany({
            where: { id: { in: brandIdList.length ? brandIdList : ["00000000-0000-0000-0000-000000000000"] } },
            select: { id: true, name: true, slug: true },
        });
        const brandCountMap = new Map(brandCounts.map((b) => [b.brandId, b._count._all]));
        const brandOptions = brands
            .map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            count: brandCountMap.get(b.id) ?? 0,
        }))
            .sort((a, b) => a.name.localeCompare(b.name, "fa"));
        const allCollections = await prisma.collection.findMany({
            select: { id: true, name: true },
        });
        const collectionCounts = await prisma.product.groupBy({
            by: ["collectionId"],
            where: { isActive: true, collectionId: { not: null } },
            _count: { _all: true },
        });
        const collCountMap = new Map();
        for (const c of collectionCounts) {
            if (c.collectionId)
                collCountMap.set(c.collectionId, c._count._all);
        }
        const collectionOptions = allCollections
            .map((c) => ({
            id: c.id,
            name: c.name,
            count: collCountMap.get(c.id) ?? 0,
        }))
            .sort((a, b) => a.name.localeCompare(b.name, "fa"));
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
            brands: brandOptions,
            collections: collectionOptions,
            priceRange,
        };
    }
}
export const productService = new ProductService();
//# sourceMappingURL=product.service.js.map