import { type ProductImage, type ProductVariant } from "./product.entity.js";
import { type ListProductsQuery, type CreateProductInput, type UpdateProductInput, type AddImageInput, type UpdateImageInput, type AddReviewInput, type ListReviewsQuery } from "./product.validators.js";
declare class ProductService {
    list(query: ListProductsQuery): Promise<{
        items: import("./product.entity.js").ProductCardDto[];
        meta: {
            page: number;
            perPage: number;
            total: number;
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
        items: {
            id: any;
            authorName: any;
            rating: any;
            title: any;
            body: any;
            createdAt: any;
        }[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    listReviewsBySlug(slug: string, query: ListReviewsQuery): Promise<{
        items: {
            id: any;
            authorName: any;
            rating: any;
            title: any;
            body: any;
            createdAt: any;
        }[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    addReviewByProductId(productId: string, input: AddReviewInput, userId?: string | null): Promise<{
        id: string;
        authorName: string;
        rating: number;
        title: string | null;
        body: string;
        createdAt: string;
    }>;
    addReviewBySlug(slug: string, input: AddReviewInput, userId?: string | null): Promise<{
        id: string;
        authorName: string;
        rating: number;
        title: string | null;
        body: string;
        createdAt: string;
    }>;
    getFilterOptions(): Promise<{
        categories: import("./category.entity.js").Category[];
        dbCategories: {
            id: string;
            value: string;
            label: string;
            heroImageUrl: string | null;
            icon: string;
            count: number;
        }[];
        brands: {
            id: unknown;
            name: any;
            slug: any;
            count: any;
        }[];
        collections: {
            id: string;
            name: string;
            heroImageUrl: string | null;
            count: number;
        }[];
        priceRange: {
            min: number;
            max: number;
        };
    }>;
    getTopSelling(limit?: number): Promise<{
        title: string;
        slug: string;
        url: string;
    }[]>;
}
export declare const productService: ProductService;
export {};
//# sourceMappingURL=product.service.d.ts.map