import { type ProductCategory as DomainProductCategory } from "./category.entity.js";
export type CurrencyCode = string;
export interface BrandRef {
    id: string;
    name: string;
    slug: string;
}
export interface DbCategoryRef {
    id: string;
    value: string;
    label: string;
    heroImageUrl?: string | null;
    icon?: string | null;
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
export interface BadgeRef {
    id: string;
    title: string;
    icon: string;
}
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
    variantName: string;
    sku?: string | null;
    price?: number | null;
    currencyCode: CurrencyCode;
    stock: number;
    colorName?: string | null;
    colorHexCode?: string | null;
    isActive: boolean;
    position: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProductReview {
    id: string;
    productId: string;
    userId?: string | null;
    authorName: string;
    rating: number;
    title?: string | null;
    body: string;
    createdAt: Date;
    status?: string;
}
export interface Product {
    id: string;
    brand: BrandRef;
    dbCategory?: DbCategoryRef | null;
    colorTheme?: ColorThemeRef | null;
    category: DomainProductCategory;
    title: string;
    subtitle?: string | null;
    slug: string;
    description?: string | null;
    ingredients?: string | null;
    howToUse?: string | null;
    price: number;
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
    images?: ProductImage[];
    variants?: ProductVariant[];
    badges?: BadgeRef[];
    reviews?: ProductReview[];
    internalNotes?: string | null;
}
export interface ProductCardDto {
    id: string;
    slug: string;
    title: string;
    brand: {
        id: string;
        name: string;
        slug: string;
    };
    category: DomainProductCategory;
    categoryValue?: string;
    categoryLabel?: string;
    categoryHeroImageUrl?: string | null;
    categoryIcon?: string | null;
    price: number;
    compareAtPrice?: number | null;
    currencyCode: CurrencyCode;
    ratingAvg: number;
    ratingCount: number;
    isBestseller: boolean;
    isSpecialProduct: boolean;
    heroImageUrl?: string | null;
    colorTheme?: ColorThemeRef | null;
    colorChips?: ColorChip[];
}
export interface ProductReviewDto {
    id: string;
    authorName: string;
    rating: number;
    title?: string | null;
    body: string;
    createdAt: string;
}
export interface ProductDetailDto extends ProductCardDto {
    subtitle?: string | null;
    description?: string | null;
    ingredients?: string | null;
    howToUse?: string | null;
    colorTheme?: ColorThemeRef | null;
    images: ProductImage[];
    variants: ProductVariant[];
    badges: BadgeRef[];
    reviews: ProductReviewDto[];
    createdAt: string;
    updatedAt: string;
    reviewSummary?: {
        ratingAvg: number;
        ratingCount: number;
    };
    related?: ProductCardDto[];
}
export declare function mapDbBrandToRef(row: any): BrandRef;
export declare function mapDbCategoryToRef(row: any): DbCategoryRef;
export declare function mapDbColorThemeToRef(row: any): ColorThemeRef | null;
export declare function mapDbBadgeToRef(row: any): BadgeRef;
export declare function mapDbImageToEntity(row: any): ProductImage;
export declare function mapDbVariantToEntity(row: any): ProductVariant;
export declare function mapDbReviewToEntity(row: any): ProductReview;
export declare function mapDbProductToEntity(row: any): Product;
export declare function isDiscounted(p: Pick<Product, "price" | "compareAtPrice">): boolean;
export declare function effectiveVariantPrice(p: Product, v?: ProductVariant | null): number;
export declare function toProductCardDto(p: Product): ProductCardDto;
export declare function toProductDetailDto(p: Product): ProductDetailDto;
export type ProductSortKey = "newest" | "popular" | "price-asc" | "price-desc";
export interface ProductFilters {
    search?: string;
    categories?: DomainProductCategory[];
    brandIds?: string[];
    brandSlugs?: string[];
    collectionIds?: string[];
    collectionSlugs?: string[];
    colorThemeIds?: string[];
    minPrice?: number;
    maxPrice?: number;
    specialOnly?: boolean;
    featuredOnly?: boolean;
    bestsellerOnly?: boolean;
    activeOnly?: boolean;
}
export declare function toPrismaOrderBy(sort: ProductSortKey | undefined): readonly [{
    readonly ratingAvg: "desc";
}, {
    readonly ratingCount: "desc";
}, {
    readonly createdAt: "desc";
}] | readonly [{
    readonly price: "asc";
}, {
    readonly createdAt: "desc";
}] | readonly [{
    readonly price: "desc";
}, {
    readonly createdAt: "desc";
}] | readonly [{
    readonly createdAt: "desc";
}];
export declare function toPrismaWhere(filters?: ProductFilters): any;
//# sourceMappingURL=product.entity.d.ts.map