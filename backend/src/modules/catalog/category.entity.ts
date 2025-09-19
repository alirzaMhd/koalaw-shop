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

export interface Category {
  code: ProductCategory; // canonical code matching DB enum
  slug: ProductCategory; // same as code; kept for clarity in URLs
  label: string; // localized label
  icon: string; // feather icon name
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