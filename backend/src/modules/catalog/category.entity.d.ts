export type ProductCategory = "skincare" | "makeup" | "fragrance" | "haircare" | "body-bath";
export declare const ALL_CATEGORIES: readonly ProductCategory[];
/**
 * Farsi display labels used across UI
 */
export declare const CATEGORY_LABELS_FA: Record<ProductCategory, string>;
/**
 * Feather icon names used by the frontend for each category
 */
export declare const CATEGORY_FEATHER_ICONS: Record<ProductCategory, string>;
export declare const CATEGORY_HERO_IMAGES: Record<ProductCategory, string>;
export interface Category {
    code: ProductCategory;
    slug: ProductCategory;
    label: string;
    icon: string;
    heroImageUrl?: string;
}
/**
 * Returns the static list of categories with display metadata.
 */
export declare function listCategories(): Category[];
/**
 * Type guard for ProductCategory
 */
export declare function isProductCategory(x: any): x is ProductCategory;
/**
 * Asserts a value is a valid ProductCategory or throws.
 */
export declare function assertCategory(x: any): asserts x is ProductCategory;
/**
 * Parses a single category from query/params.
 * Accepts minor variants like underscores/spaces; normalizes to hyphenated slug.
 */
export declare function parseCategory(input?: string | null): ProductCategory | null;
/**
 * Normalize an arbitrary category value/slug (from DB or URL) to our canonical hyphenated slug.
 * If it's not one of the known static categories, returns the normalized slug string (not typed).
 */
export declare function toCategorySlug(value: string): string;
/**
 * Returns a Farsi label for a given category value/slug.
 * Falls back to the raw slug if it's not a known static category.
 */
export declare function getCategoryLabel(value: string): string;
export interface DbCategory {
    id: string;
    value: string;
    label: string;
    heroImageUrl?: string | null;
}
/**
 * Normalizes a list of categories from a mixed input (string, CSV, array).
 * Deduplicates and filters invalid values.
 */
export declare function normalizeCategories(input: unknown): ProductCategory[];
/**
 * Helper to build a Prisma where-clause for filtering by categories.
 * Keeps usage local to the module; adapt if you use another ORM.
 */
export type CategoryWhere = {
    category?: {
        in?: ProductCategory[];
    };
};
export declare function toCategoryWhere(categories?: ProductCategory[] | null): CategoryWhere;
//# sourceMappingURL=category.entity.d.ts.map