// src/modules/catalo g/category.entity.ts
// Product categories domain types and helpers.
// Matches DB enum product_category_enum: ('skincare','makeup','fragrance','haircare','body-bath')
export const ALL_CATEGORIES = [
    "skincare",
    "makeup",
    "fragrance",
    "haircare",
    "body-bath",
];
/**
 * Farsi display labels used across UI
 */
export const CATEGORY_LABELS_FA = {
    skincare: "مراقبت از پوست",
    makeup: "آرایش",
    fragrance: "عطر",
    haircare: "مراقبت از مو",
    "body-bath": "بدن و حمام",
};
/**
 * Feather icon names used by the frontend for each category
 */
export const CATEGORY_FEATHER_ICONS = {
    skincare: "shield",
    makeup: "pen-tool",
    fragrance: "wind",
    haircare: "git-branch",
    "body-bath": "droplet",
};
export const CATEGORY_HERO_IMAGES = {
    skincare: "/assets/images/products/skin.png",
    makeup: "/assets/images/products/cosmetic.png",
    fragrance: "/assets/images/products/perfume.png",
    haircare: "/assets/images/products/hair.png",
    "body-bath": "/assets/images/products/body.png",
};
/**
 * Returns the static list of categories with display metadata.
 */
export function listCategories() {
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
export function isProductCategory(x) {
    return typeof x === "string" && ALL_CATEGORIES.includes(x);
}
/**
 * Asserts a value is a valid ProductCategory or throws.
 */
export function assertCategory(x) {
    if (!isProductCategory(x)) {
        throw new Error("Invalid product category");
    }
}
/**
 * Parses a single category from query/params.
 * Accepts minor variants like underscores/spaces; normalizes to hyphenated slug.
 */
export function parseCategory(input) {
    if (!input)
        return null;
    const normalized = String(input).trim().toLowerCase().replace(/[\s_]+/g, "-");
    return isProductCategory(normalized) ? normalized : null;
}
/**
 * Normalize an arbitrary category value/slug (from DB or URL) to our canonical hyphenated slug.
 * If it's not one of the known static categories, returns the normalized slug string (not typed).
 */
export function toCategorySlug(value) {
    return String(value || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
}
/**
 * Returns a Farsi label for a given category value/slug.
 * Falls back to the raw slug if it's not a known static category.
 */
export function getCategoryLabel(value) {
    const slug = toCategorySlug(value);
    return CATEGORY_LABELS_FA[slug] ?? slug;
}
/**
 * Normalizes a list of categories from a mixed input (string, CSV, array).
 * Deduplicates and filters invalid values.
 */
export function normalizeCategories(input) {
    if (!input)
        return [];
    const items = Array.isArray(input)
        ? input
        : String(input)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    const out = [];
    for (const raw of items) {
        const c = parseCategory(raw);
        if (c && !out.includes(c))
            out.push(c);
    }
    return out;
}
export function toCategoryWhere(categories) {
    if (!categories || categories.length === 0)
        return {};
    return { category: { in: categories } };
}
//# sourceMappingURL=category.entity.js.map