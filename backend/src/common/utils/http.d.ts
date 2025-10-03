export type PaginationInput = {
    page?: number | string;
    perPage?: number | string;
};
export declare function parsePagination(q?: PaginationInput, defaults?: {
    page: number;
    perPage: number;
}): {
    page: number;
    perPage: number;
    skip: number;
    take: number;
};
export declare function buildMeta(total: number, page: number, perPage: number): {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
};
export declare function envelope<T>(data: T): {
    success: boolean;
    data: T;
};
//# sourceMappingURL=http.d.ts.map