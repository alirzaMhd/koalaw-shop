import type { RequestHandler } from "express";
declare class ProductController {
    list: RequestHandler;
    filters: RequestHandler;
    categories: RequestHandler;
    suggestions: RequestHandler;
    getById: RequestHandler;
    getBySlug: RequestHandler;
    create: RequestHandler;
    update: RequestHandler;
    addImage: RequestHandler;
    updateImage: RequestHandler;
    deleteImage: RequestHandler;
    addVariant: RequestHandler;
    updateVariant: RequestHandler;
    deleteVariant: RequestHandler;
    listReviewsById: RequestHandler;
    listReviewsBySlug: RequestHandler;
    addReviewById: RequestHandler;
    addReviewBySlug: RequestHandler;
}
export declare const productController: ProductController;
export {};
//# sourceMappingURL=product.controller.d.ts.map