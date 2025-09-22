// src/modules/catalog/product.entity.ts
// Domain types and helpers for products, variants, images, brand, and color theme.
// Aligned with your SQL migration while keeping camelCase in the domain layer.

import type { ProductCategory } from "./category.entity";
import type { Prisma } from "@prisma/client"; // type-only for enum typing

// ---------- Primitive/refs ----------

export type CurrencyCode = string; // DB default: 'IRR' (char(3)); keep flexible

export interface BrandRef {
  id: string;
  name: string;
  slug: string;
}
export interface ColorChip {
  hex: string;
  name?: string | null;
}
export interface ColorThemeRef {
  id: string;
  name: string;
  slug: string;
  hexCode?: string | null;
}

export interface CollectionRef {
  id: string;
  slug: string;
  title?: string | null;
}

// ---------- Core entities ----------

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt?: string | null;
  position: number;
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  variantName: string; // e.g., "50ml", "Ruby Red"
  sku?: string | null;
  price?: number | null; // if null, product.price applies
  currencyCode: CurrencyCode;
  stock: number;
  colorName?: string | null;
  colorHexCode?: string | null;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  brand: BrandRef;
  colorTheme?: ColorThemeRef | null;

  category: ProductCategory;
  title: string;
  subtitle?: string | null;
  slug: string;

  description?: string | null;
  ingredients?: string | null;
  howToUse?: string | null;

  price: number; // base unit price
  compareAtPrice?: number | null;
  currencyCode: CurrencyCode;

  ratingAvg: number;
  ratingCount: number;

  isBestseller: boolean;
  isFeatured: boolean;
  isSpecialProduct: boolean;
  isActive: boolean;

  heroImageUrl?: string | null;

  createdAt: Date;
  updatedAt: Date;

  // Optional loaded relations
  images?: ProductImage[];
  variants?: ProductVariant[];

  // Internal/private (not for clients)
  internalNotes?: string | null;
}

// ---------- DTOs for API responses ----------

export interface ProductCardDto {
  id: string;
  slug: string;
  title: string;
  brand: { id: string; name: string; slug: string };
  category: ProductCategory;
  price: number;
  compareAtPrice?: number | null;
  currencyCode: CurrencyCode;
  ratingAvg: number;
  ratingCount: number;
  isBestseller: boolean;
  isSpecialProduct: boolean;
  heroImageUrl?: string | null;

  // NEW
  colorTheme?: ColorThemeRef | null;
  colorChips?: ColorChip[];
}

export interface ProductDetailDto extends ProductCardDto {
  subtitle?: string | null;
  description?: string | null;
  ingredients?: string | null;
  howToUse?: string | null;
  colorTheme?: ColorThemeRef | null;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// ---------- Mappers ----------

function toDate(v: any): Date {
  return v instanceof Date ? v : new Date(v);
}

export function mapDbBrandToRef(row: any): BrandRef {
  const src = row?.brand ?? row;
  return {
    id: src.id,
    name: src.name,
    slug: src.slug,
  };
}

export function mapDbColorThemeToRef(row: any): ColorThemeRef | null {
  const src = row?.colorTheme ?? row;
  if (!src) return null;
  return {
    id: src.id,
    name: src.name,
    slug: src.slug,
    hexCode: src.hexCode ?? src.hex_code ?? null,
  };
}

export function mapDbImageToEntity(row: any): ProductImage {
  return {
    id: row.id,
    productId: row.productId ?? row.product_id,
    url: row.url,
    alt: row.alt ?? null,
    position: row.position ?? 0,
    createdAt: toDate(row.createdAt ?? row.created_at),
  };
}

export function mapDbVariantToEntity(row: any): ProductVariant {
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

export function mapDbProductToEntity(row: any): Product {
  const brand = row.brand
    ? mapDbBrandToRef(row.brand)
    : mapDbBrandToRef({
        id: row.brandId ?? row.brand_id,
        name: row.brandName ?? row.brand_name,
        slug: row.brandSlug ?? row.brand_slug,
      });

  const colorTheme =
    row.colorTheme
      ? mapDbColorThemeToRef(row.colorTheme)
      : row.colorThemeId || row.color_theme_id
      ? mapDbColorThemeToRef({
          id: row.colorThemeId ?? row.color_theme_id,
          name: row.colorThemeName ?? row.color_theme_name,
          slug: row.colorThemeSlug ?? row.color_theme_slug,
          hexCode: row.colorThemeHexCode ?? row.color_theme_hex_code ?? null,
        })
      : null;

  const images: ProductImage[] | undefined = Array.isArray(row.images)
    ? row.images.map(mapDbImageToEntity)
    : undefined;

  const variants: ProductVariant[] | undefined = Array.isArray(row.variants)
    ? row.variants.map(mapDbVariantToEntity)
    : undefined;

  return {
    id: row.id,
    brand,
    colorTheme,

    category: row.category as ProductCategory,
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

    images,
    variants,

    internalNotes: row.internalNotes ?? row.internal_notes ?? null,
  };
}

// ---------- Helpers ----------

export function isDiscounted(p: Pick<Product, "price" | "compareAtPrice">): boolean {
  const cmp = p.compareAtPrice ?? 0;
  return typeof cmp === "number" && cmp > 0 && cmp > p.price;
}

export function effectiveVariantPrice(p: Product, v?: ProductVariant | null): number {
  return typeof v?.price === "number" && v.price! > 0 ? v.price! : p.price;
}

export function toProductCardDto(p: Product): ProductCardDto {
  const chips: ColorChip[] = Array.from(
    new Map(
      (p.variants ?? [])
        .filter((v) => v.isActive && v.colorHexCode)
        .map((v) => {
          const hex = (v.colorHexCode as string).toLowerCase();
          return [hex, { hex, name: v.colorName ?? null }];
        })
    ).values()
  );

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    brand: { ...p.brand },
    category: p.category,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    currencyCode: p.currencyCode,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    isBestseller: p.isBestseller,
    isSpecialProduct: p.isSpecialProduct || isDiscounted(p),
    heroImageUrl:
      p.heroImageUrl ??
      p.images?.sort((a, b) => a.position - b.position)[0]?.url ??
      null,

    // NEW
    colorTheme: p.colorTheme ?? null,
    colorChips: chips,
  };
}

export function toProductDetailDto(p: Product): ProductDetailDto {
  return {
    ...toProductCardDto(p),
    subtitle: p.subtitle ?? null,
    description: p.description ?? null,
    ingredients: p.ingredients ?? null,
    howToUse: p.howToUse ?? null,
    colorTheme: p.colorTheme ?? null,
    images: (p.images ?? []).slice().sort((a, b) => a.position - b.position),
    variants: (p.variants ?? []).slice().sort((a, b) => a.position - b.position),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ---------- Query/filter helpers (service-level) ----------

export type ProductSortKey = "newest" | "popular" | "price-asc" | "price-desc";

export interface ProductFilters {
  search?: string;
  categories?: ProductCategory[]; // lowercase slugs in domain
  brandIds?: string[];
  brandSlugs?: string[];
  collectionIds?: string[];
  collectionSlugs?: string[];
  colorThemeIds?: string[];

  minPrice?: number;
  maxPrice?: number;

  specialOnly?: boolean; // discount/special products
  featuredOnly?: boolean;
  bestsellerOnly?: boolean;

  activeOnly?: boolean; // default true
}

// Prisma v5: use string enum literals for values; type via Prisma.$Enums
type DbProductCategory = Prisma.$Enums.ProductCategory;
const CategoryEnumBySlug: Record<string, DbProductCategory> = {
  skincare: "SKINCARE",
  makeup: "MAKEUP",
  fragrance: "FRAGRANCE",
  haircare: "HAIRCARE",
  "body-bath": "BODY_BATH",
};

// Map domain category slugs -> Prisma enum (string) values
function toPrismaCategoryEnumValue(x: unknown): DbProductCategory | null {
  const slug = String(x ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  return CategoryEnumBySlug[slug] ?? null;
}

export function toPrismaOrderBy(sort: ProductSortKey | undefined) {
  switch (sort) {
    case "popular":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { createdAt: "desc" }] as const;
    case "price-asc":
      return [{ price: "asc" }, { createdAt: "desc" }] as const;
    case "price-desc":
      return [{ price: "desc" }, { createdAt: "desc" }] as const;
    case "newest":
    default:
      return [{ createdAt: "desc" }] as const;
  }
}

export function toPrismaWhere(filters: ProductFilters = {}) {
  const where: any = {};
  const AND: any[] = [];
  const OR: any[] = [];

  if (filters.activeOnly !== false) {
    AND.push({ isActive: true });
  }

  if (filters.categories?.length) {
    const enumVals = filters.categories
      .map(toPrismaCategoryEnumValue)
      .filter((v): v is DbProductCategory => v !== null);
    if (enumVals.length) {
      AND.push({ category: { in: enumVals } });
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
    OR.push(
      { title: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } }
    );
  }

  if (AND.length) where.AND = AND;
  if (OR.length) where.OR = OR;

  return where;
}