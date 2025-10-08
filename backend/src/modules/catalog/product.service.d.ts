import { type ProductImage, type ProductVariant } from "./product.entity.js";
import { type ListProductsQuery, type CreateProductInput, type UpdateProductInput, type AddImageInput, type UpdateImageInput, type AddReviewInput, type ListReviewsQuery } from "./product.validators.js";
declare class ProductService {
    list(query: ListProductsQuery): Promise<{
        items: any;
        meta: {
            page: number;
            perPage: number;
            total: any;
            totalPages: number;
        };
    }>;
    getById(id: string): Promise<import("./product.entity.js").ProductDetailDto>;
    getBySlug(slug: string): Promise<import("./product.entity.js").ProductDetailDto>;
    create(input: CreateProductInput): Promise<import("./product.entity.js").ProductDetailDto>;
    update(id: string, input: UpdateProductInput): Promise<import("./product.entity.js").ProductDetailDto>;
    addImage(productId: string, input: AddImageInput): Promise<ProductImage>;
    updateImage(productId: string, imageId: string, input: UpdateImageInput): Promise<ProductImage>;
    deleteImage(productId: string, imageId: string): Promise<{
        deleted: boolean;
    }>;
    addVariant(productId: string, input: any): Promise<ProductVariant>;
    updateVariant(productId: string, variantId: string, input: any): Promise<ProductVariant>;
    deleteVariant(productId: string, variantId: string): Promise<{
        deleted: boolean;
    }>;
    listReviewsByProductId(productId: string, query: ListReviewsQuery): Promise<{
        items: any;
        meta: {
            page: number;
            perPage: number;
            total: any;
            totalPages: number;
        };
    }>;
    listReviewsBySlug(slug: string, query: ListReviewsQuery): Promise<{
        items: any;
        meta: {
            page: number;
            perPage: number;
            total: any;
            totalPages: number;
        };
    }>;
    addReviewByProductId(productId: string, input: AddReviewInput, userId?: string | null): Promise<{
        id: any;
        authorName: string;
        rating: any;
        title: any;
        body: any;
        createdAt: any;
    }>;
    addReviewBySlug(slug: string, input: AddReviewInput, userId?: string | null): Promise<{
        id: any;
        authorName: string;
        rating: any;
        title: any;
        body: any;
        createdAt: any;
    }>;
    getFilterOptions(): Promise<{
        categories: import("./category.entity.js").Category[];
        brands: any;
        collections: any;
        priceRange: {
            min: any;
            max: any;
        };
    }>;
}
export declare const productService: ProductService;
export {};
//# sourceMappingURL=product.service.d.ts.map