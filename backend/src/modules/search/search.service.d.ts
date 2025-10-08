export declare const PRODUCTS_INDEX: string;
export declare const MAGAZINE_INDEX: string;
interface MagazineSearchResult {
    items: any[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
    source: "elasticsearch" | "database";
    took?: number;
}
export declare function ensureSearchIndices(): Promise<void>;
export declare function reindexAllProducts(): Promise<{
    count: any;
}>;
export declare function indexProductById(productId: string): Promise<void>;
export declare function deleteProductById(productId: string): Promise<void>;
export declare function searchProducts(opts: {
    q?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    page?: number;
    size?: number;
    sort?: "relevance" | "newest" | "price_asc" | "price_desc" | "rating_desc";
}): Promise<{
    items: any;
    total: any;
    page: number;
    size: number;
    took: any;
}>;
export declare function reindexAllMagazinePosts(): Promise<{
    count: any;
}>;
export declare function indexMagazinePostById(postId: string): Promise<void>;
export declare function deleteMagazinePostById(postId: string): Promise<void>;
/**
 * Search magazine posts with Elasticsearch fallback to Prisma
 */
export declare function searchMagazinePosts(opts: {
    q?: string;
    category?: string;
    tags?: string[];
    page?: number;
    size?: number;
    sort?: "relevance" | "newest" | "oldest";
}): Promise<MagazineSearchResult>;
export {};
//# sourceMappingURL=search.service.d.ts.map