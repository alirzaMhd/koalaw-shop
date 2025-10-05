export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface Review {
    id: string;
    productId: string;
    userId?: string | null;
    rating: number;
    title?: string | null;
    body: string;
    guestName?: string | null;
    status: ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface Paginated<T> {
    items: T[];
    meta: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}
declare class ReviewService {
    listForProduct(productId: string, query?: {
        page?: number;
        perPage?: number;
        status?: ReviewStatus;
    }): Promise<Paginated<Review>>;
    listAll(query?: {
        page?: number;
        perPage?: number;
        productId?: string;
        status?: ReviewStatus;
        userId?: string;
        search?: string;
    }): Promise<Paginated<Review>>;
    getById(id: string): Promise<Review>;
    listMine(userId: string, query?: {
        page?: number;
        perPage?: number;
    }): Promise<Paginated<Review>>;
    create(args: {
        productId: string;
        rating: number;
        body: string;
        title?: string | null;
        userId?: string | null;
        guestName?: string | null;
    }): Promise<Review>;
    updateContent(args: {
        id: string;
        rating?: number;
        title?: string | null;
        body?: string | null;
        requesterUserId?: string | null;
        isAdmin?: boolean;
    }): Promise<Review>;
    setStatus(id: string, status: ReviewStatus): Promise<Review>;
    delete(id: string, args?: {
        requesterUserId?: string | null;
        isAdmin?: boolean;
    }): Promise<{
        deleted: boolean;
    }>;
    recalcProductRating(productId: string): Promise<{
        ratingAvg: number;
        ratingCount: number;
    }>;
}
export declare const reviewService: ReviewService;
export {};
//# sourceMappingURL=review.service.d.ts.map