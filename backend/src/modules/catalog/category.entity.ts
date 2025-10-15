// src/modules/catalo g/category.entity.ts
// Product categories domain types and helpers.
// Matches DB enum product_category_enum: ('skincare','makeup','fragrance','haircare','body-bath')

export type ProductCategory =
  | "skincare"
  | "makeup"
  | "fragrance"
  | "haircare"
  | "body-bath";

export const ALL_CATEGORIES: readonly ProductCategory[] = [
  "skincare",
  "makeup",
  "fragrance",
  "haircare",
  "body-bath",
] as const;

/**
 * Farsi display labels used across UI
 */
export const CATEGORY_LABELS_FA: Record<ProductCategory, string> = {
  skincare: "مراقبت از پوست",
  makeup: "آرایش",
  fragrance: "عطر",
  haircare: "مراقبت از مو",
  "body-bath": "بدن و حمام",
};

/**
 * Feather icon names used by the frontend for each category
 */
export const CATEGORY_FEATHER_ICONS: Record<ProductCategory, string> = {
  skincare: "shield",
  makeup: "pen-tool",
  fragrance: "wind",
  haircare: "git-branch",
  "body-bath": "droplet",
};

export const CATEGORY_HERO_IMAGES: Record<ProductCategory, string> = {
  skincare: "/assets/images/products/skin.png",
  makeup: "/assets/images/products/cosmetic.png",
  fragrance: "/assets/images/products/perfume.png",
  haircare: "/assets/images/products/hair.png",
  "body-bath": "/assets/images/products/body.png",
};

export interface Category {
  code: ProductCategory; // canonical code matching DB enum
  slug: ProductCategory; // same as code; kept for clarity in URLs
  label: string; // localized label
  icon: string; // feather icon name
  heroImageUrl?: string;
}

/**
 * Returns the static list of categories with display metadata.
 */
export function listCategories(): Category[] {
  return ALL_CATEGORIES.map((code) => ({
    code,
    slug: code,
    label: CATEGORY_LABELS_FA[code],
    icon: CATEGORY_FEATHER_ICONS[code],
    heroImageUrl: CATEGORY_HERO_IMAGES[code],
  }));
}

/**
 * Type guard for ProductCategory
 */
export function isProductCategory(x: any): x is ProductCategory {
  return typeof x === "string" && (ALL_CATEGORIES as readonly string[]).includes(x);
}

/**
 * Asserts a value is a valid ProductCategory or throws.
 */
export function assertCategory(x: any): asserts x is ProductCategory {
  if (!isProductCategory(x)) {
    throw new Error("Invalid product category");
  }
}

/**
 * Parses a single category from query/params.
 * Accepts minor variants like underscores/spaces; normalizes to hyphenated slug.
 */
export function parseCategory(input?: string | null): ProductCategory | null {
  if (!input) return null;
  const normalized = String(input).trim().toLowerCase().replace(/[\s_]+/g, "-");
  return isProductCategory(normalized) ? (normalized as ProductCategory) : null;
}

/**
 * Normalize an arbitrary category value/slug (from DB or URL) to our canonical hyphenated slug.
 * If it's not one of the known static categories, returns the normalized slug string (not typed).
 */
export function toCategorySlug(value: string): string {
  return String(value || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
}

/**
 * Returns a Farsi label for a given category value/slug.
 * Falls back to the raw slug if it's not a known static category.
 */
export function getCategoryLabel(value: string): string {
  const slug = toCategorySlug(value);
  return (CATEGORY_LABELS_FA as any)[slug] ?? slug;
}

// Optional: DB-backed category type for convenience
export interface DbCategory {
  id: string;
  value: string;        // canonical slug (e.g., "skincare" or custom)
  label: string;        // display label (fa)
  heroImageUrl?: string | null;
}

/**
 * Normalizes a list of categories from a mixed input (string, CSV, array).
 * Deduplicates and filters invalid values.
 */
export function normalizeCategories(input: unknown): ProductCategory[] {
  if (!input) return [];
  const items: string[] = Array.isArray(input)
    ? (input as string[])
    : String(input)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const out: ProductCategory[] = [];
  for (const raw of items) {
    const c = parseCategory(raw);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

/**
 * Helper to build a Prisma where-clause for filtering by categories.
 * Keeps usage local to the module; adapt if you use another ORM.
 */
export type CategoryWhere = { category?: { in?: ProductCategory[] } };

export function toCategoryWhere(categories?: ProductCategory[] | null): CategoryWhere {
  if (!categories || categories.length === 0) return {};
  return { category: { in: categories } };
}