import { type ProductImage, type ProductVariant } from "./product.entity.js";
import { type ListProductsQuery, type CreateProductInput, type UpdateProductInput, type AddImageInput, type UpdateImageInput, type AddReviewInput, type ListReviewsQuery } from "./product.validators";
declare class ProductService {
    list(query: ListProductsQuery): Promise<{
        items: any;
        meta: {
            page: ListProductsQuery;
            perPage: ListProductsQuery;
            total: any;
            totalPages: number;
        };
    }>;
    getById(id: string): Promise<any>;
    getBySlug(slug: string): Promise<any>;
    create(input: CreateProductInput): Promise<any>;
    update(id: string, input: UpdateProductInput): Promise<any>;
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
            page: ListReviewsQuery;
            perPage: ListReviewsQuery;
            total: any;
            totalPages: number;
        };
    }>;
    listReviewsBySlug(slug: string, query: ListReviewsQuery): Promise<{
        items: any;
        meta: {
            page: ListReviewsQuery;
            perPage: ListReviewsQuery;
            total: any;
            totalPages: number;
        };
    }>;
    addReviewByProductId(productId: string, input: AddReviewInput, userId?: string | null): Promise<{
        id: any;
        authorName: any;
        rating: any;
        title: any;
        body: any;
        createdAt: any;
    }>;
    addReviewBySlug(slug: string, input: AddReviewInput, userId?: string | null): Promise<{
        id: any;
        authorName: any;
        rating: any;
        title: any;
        body: any;
        createdAt: any;
    }>;
    getFilterOptions(): Promise<{
        categories: any;
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