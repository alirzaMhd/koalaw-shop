// src/modules/catalog/product.entity.ts
// Domain types and helpers for products, variants, images, brand, and color theme.
// Aligned with your SQL migration while keeping camelCase in the domain layer.
import { CATEGORY_LABELS_FA, CATEGORY_FEATHER_ICONS, } from "./category.entity.js";
// ---------- Mappers ----------
function toDate(v) {
    return v instanceof Date ? v : new Date(v);
}
export function mapDbBrandToRef(row) {
    const src = row?.brand ?? row;
    return {
        id: src.id,
        name: src.name,
        slug: src.slug,
    };
}
export function mapDbCategoryToRef(row) {
    const src = row?.dbCategory ?? row;
    return {
        id: src.id,
        value: src.value,
        label: src.label,
        heroImageUrl: src.heroImageUrl ?? src.hero_image_url ?? null,
        icon: src.icon ?? null,
    };
}
export function mapDbColorThemeToRef(row) {
    const src = row?.colorTheme ?? row;
    if (!src)
        return null;
    return {
        id: src.id,
        name: src.name,
        slug: src.slug,
        hexCode: src.hexCode ?? src.hex_code ?? null,
    };
}
export function mapDbBadgeToRef(row) {
    return {
        id: row.id,
        title: row.title,
        icon: row.icon,
    };
}
export function mapDbImageToEntity(row) {
    return {
        id: row.id,
        productId: row.productId ?? row.product_id,
        url: row.url,
        alt: row.alt ?? null,
        position: row.position ?? 0,
        createdAt: toDate(row.createdAt ?? row.created_at),
    };
}
export function mapDbVariantToEntity(row) {
    return {
        id: row.id,
        productId: row.productId ?? row.product_id,
        variantName: row.variantName ?? row.variant_name,
        sku: row.sku ?? null,
        price: typeof row.price === "number" ? row.price : row.price ?? null,
        currencyCode: row.currencyCode ?? row.currency_code ?? "IRR",
        stock: row.stock ?? 0,
        colorName: row.colorName ?? row.color_name ?? null,
        colorHexCode: row.colorHexCode ?? row.color_hex_code ?? null,
        isActive: Boolean(row.isActive ?? row.is_active ?? true),
        position: row.position ?? 0,
        createdAt: toDate(row.createdAt ?? row.created_at),
        updatedAt: toDate(row.updatedAt ?? row.updated_at),
    };
}
export function mapDbReviewToEntity(row) {
    const user = row.user ?? null;
    const firstName = user?.firstName ?? user?.first_name ?? "";
    const lastName = user?.lastName ?? user?.last_name ?? "";
    const full = `${firstName} ${lastName}`.trim();
    const authorName = full || row.guestName || row.guest_name || "کاربر";
    return {
        id: row.id,
        productId: row.productId ?? row.product_id,
        userId: row.userId ?? row.user_id ?? null,
        authorName,
        rating: Number(row.rating ?? 0),
        title: row.title ?? null,
        body: row.body ?? "",
        createdAt: toDate(row.createdAt ?? row.created_at),
        status: row.status ?? undefined,
    };
}
export function mapDbProductToEntity(row) {
    const brand = row.brand
        ? mapDbBrandToRef(row.brand)
        : mapDbBrandToRef({
            id: row.brandId ?? row.brand_id,
            name: row.brandName ?? row.brand_name,
            slug: row.brandSlug ?? row.brand_slug,
        });
    // Optional DB category relation (NEW)
    const dbCategory = row.dbCategory
        ? mapDbCategoryToRef(row.dbCategory)
        : row.categoryId || row.category_id
            ? mapDbCategoryToRef({
                id: row.categoryId ?? row.category_id,
                value: row.categoryValue ?? row.category_value ?? undefined,
                label: row.categoryLabel ?? row.category_label ?? undefined,
                heroImageUrl: row.categoryHeroImageUrl ?? row.category_hero_image_url ?? null,
            })
            : null;
    const colorTheme = row.colorTheme
        ? mapDbColorThemeToRef(row.colorTheme)
        : row.colorThemeId || row.color_theme_id
            ? mapDbColorThemeToRef({
                id: row.colorThemeId ?? row.color_theme_id,
                name: row.colorThemeName ?? row.color_theme_name,
                slug: row.colorThemeSlug ?? row.color_theme_slug,
                hexCode: row.colorThemeHexCode ?? row.color_theme_hex_code ?? null,
            })
            : null;
    const images = Array.isArray(row.images)
        ? row.images.map(mapDbImageToEntity)
        : undefined;
    const variants = Array.isArray(row.variants)
        ? row.variants.map(mapDbVariantToEntity)
        : undefined;
    const badges = Array.isArray(row.badges)
        ? row.badges.map(mapDbBadgeToRef)
        : undefined;
    const reviews = Array.isArray(row.reviews)
        ? row.reviews.map(mapDbReviewToEntity)
        : undefined;
    return {
        id: row.id,
        brand,
        dbCategory,
        colorTheme,
        category: row.category,
        title: row.title,
        subtitle: row.subtitle ?? null,
        slug: row.slug,
        description: row.description ?? null,
        ingredients: row.ingredients ?? null,
        howToUse: row.howToUse ?? row.how_to_use ?? null,
        price: row.price,
        compareAtPrice: row.compareAtPrice ?? row.compare_at_price ?? null,
        currencyCode: row.currencyCode ?? row.currency_code ?? "IRR",
        ratingAvg: Number(row.ratingAvg ?? row.rating_avg ?? 0),
        ratingCount: Number(row.ratingCount ?? row.rating_count ?? 0),
        isBestseller: Boolean(row.isBestseller ?? row.is_bestseller ?? false),
        isFeatured: Boolean(row.isFeatured ?? row.is_featured ?? false),
        isSpecialProduct: Boolean(row.isSpecialProduct ?? row.is_special_product ?? false),
        isActive: Boolean(row.isActive ?? row.is_active ?? true),
        heroImageUrl: row.heroImageUrl ?? row.hero_image_url ?? null,
        createdAt: toDate(row.createdAt ?? row.created_at),
        updatedAt: toDate(row.updatedAt ?? row.updated_at),
        ...(images && { images }),
        ...(variants && { variants }),
        ...(badges && { badges }),
        ...(reviews && { reviews }),
        internalNotes: row.internalNotes ?? row.internal_notes ?? null,
    };
}
// ---------- Helpers ----------
export function isDiscounted(p) {
    const cmp = p.compareAtPrice ?? 0;
    return typeof cmp === "number" && cmp > 0 && cmp > p.price;
}
export function effectiveVariantPrice(p, v) {
    return typeof v?.price === "number" && v.price > 0 ? v.price : p.price;
}
function fallbackCategoryLabel(cat) {
    if (!cat)
        return undefined;
    const slug = String(cat).trim().toLowerCase().replace(/_/g, "-");
    return CATEGORY_LABELS_FA[slug];
}
function fallbackCategoryIcon(cat) {
    if (!cat)
        return undefined;
    const slug = String(cat).trim().toLowerCase().replace(/_/g, "-");
    return CATEGORY_FEATHER_ICONS[slug];
}
export function toProductCardDto(p) {
    const chips = Array.from(new Map((p.variants ?? [])
        .filter((v) => v.isActive && v.colorHexCode)
        .map((v) => {
        const hex = v.colorHexCode.toLowerCase();
        return [hex, { hex, name: v.colorName ?? null }];
    })).values());
    const categoryValue = p.dbCategory?.value ?? p.category;
    const categoryLabel = p.dbCategory?.label ?? fallbackCategoryLabel(p.category);
    const categoryHeroImageUrl = p.dbCategory?.heroImageUrl ?? null;
    const categoryIcon = p.dbCategory?.icon ?? fallbackCategoryIcon(p.category) ?? null;
    return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        brand: { ...p.brand },
        category: p.category,
        categoryValue,
        categoryLabel,
        categoryHeroImageUrl,
        categoryIcon,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        currencyCode: p.currencyCode,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        isBestseller: p.isBestseller,
        isSpecialProduct: p.isSpecialProduct || isDiscounted(p),
        heroImageUrl: p.heroImageUrl ??
            p.images?.sort((a, b) => a.position - b.position)[0]?.url ??
            null,
        // NEW
        colorTheme: p.colorTheme ?? null,
        colorChips: chips,
    };
}
export function toProductDetailDto(p) {
    const dto = {
        ...toProductCardDto(p),
        subtitle: p.subtitle ?? null,
        description: p.description ?? null,
        ingredients: p.ingredients ?? null,
        howToUse: p.howToUse ?? null,
        colorTheme: p.colorTheme ?? null,
        images: (p.images ?? []).slice().sort((a, b) => a.position - b.position),
        variants: (p.variants ?? []).slice().sort((a, b) => a.position - b.position),
        badges: (p.badges ?? []).slice(),
        reviews: (p.reviews ?? [])
            .slice()
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((r) => ({
            id: r.id,
            authorName: r.authorName,
            rating: r.rating,
            title: r.title ?? null,
            body: r.body,
            createdAt: r.createdAt.toISOString(),
        })),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        reviewSummary: { ratingAvg: p.ratingAvg, ratingCount: p.ratingCount },
        related: [], // will be filled by service
    };
    return dto;
}
// Prisma v5: use string enum literals for values; type via Prisma.$Enums
const CategoryEnumBySlug = {
    skincare: "SKINCARE",
    makeup: "MAKEUP",
    fragrance: "FRAGRANCE",
    haircare: "HAIRCARE",
    "body-bath": "BODY_BATH",
};
// Map domain category slugs -> Prisma enum (string) values
function toPrismaCategoryEnumValue(x) {
    const slug = String(x ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, "-");
    return CategoryEnumBySlug[slug] ?? null;
}
export function toPrismaOrderBy(sort) {
    switch (sort) {
        case "popular":
            return [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { createdAt: "desc" }];
        case "price-asc":
            return [{ price: "asc" }, { createdAt: "desc" }];
        case "price-desc":
            return [{ price: "desc" }, { createdAt: "desc" }];
        case "newest":
        default:
            return [{ createdAt: "desc" }];
    }
}
export function toPrismaWhere(filters = {}) {
    const where = {};
    const AND = [];
    const OR = [];
    if (filters.activeOnly !== false) {
        AND.push({ isActive: true });
    }
    if (filters.categories?.length) {
        const slugs = filters.categories
            .map((s) => String(s || "").trim().toLowerCase().replace(/[\s_]+/g, "-"))
            .filter(Boolean);
        if (slugs.length) {
            AND.push({ dbCategory: { value: { in: slugs } } });
        }
    }
    if (filters.brandIds?.length) {
        AND.push({ brandId: { in: filters.brandIds } });
    }
    if (filters.brandSlugs?.length) {
        AND.push({ brand: { slug: { in: filters.brandSlugs } } });
    }
    // One-to-many collection relation
    if (filters.collectionIds?.length) {
        AND.push({ collectionId: { in: filters.collectionIds } });
    }
    if (filters.colorThemeIds?.length) {
        AND.push({ colorThemeId: { in: filters.colorThemeIds } });
    }
    if (typeof filters.minPrice === "number") {
        AND.push({ price: { gte: filters.minPrice } });
    }
    if (typeof filters.maxPrice === "number") {
        AND.push({ price: { lte: filters.maxPrice } });
    }
    if (filters.specialOnly) {
        AND.push({
            OR: [{ isSpecialProduct: true }, { compareAtPrice: { not: null } }],
        });
    }
    if (filters.featuredOnly) {
        AND.push({ isFeatured: true });
    }
    if (filters.bestsellerOnly) {
        AND.push({ isBestseller: true });
    }
    const q = (filters.search || "").trim();
    if (q) {
        OR.push({ title: { contains: q, mode: "insensitive" } }, { subtitle: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { brand: { name: { contains: q, mode: "insensitive" } } });
    }
    if (AND.length)
        where.AND = AND;
    if (OR.length)
        where.OR = OR;
    return where;
}
//# sourceMappingURL=product.entity.js.map