declare class CollectionsService {
    list(): Promise<{
        name: string;
        id: string;
        _count: {
            products: number;
        };
        subtitle: string | null;
        isFeatured: boolean;
        heroImageUrl: string | null;
        displayOrder: number;
    }[]>;
    create(input: {
        name: string;
        heroImageUrl?: string | null;
        subtitle?: string | null;
        isFeatured?: boolean;
        displayOrder?: number;
    }): Promise<{
        collection: {
            name: string;
            id: string;
            subtitle: string | null;
            isFeatured: boolean;
            heroImageUrl: string | null;
            displayOrder: number;
        };
    }>;
    update(id: string, input: {
        name?: string;
        heroImageUrl?: string | null;
        subtitle?: string | null;
        isFeatured?: boolean;
        displayOrder?: number;
    }): Promise<{
        collection: {
            name: string;
            id: string;
            subtitle: string | null;
            isFeatured: boolean;
            heroImageUrl: string | null;
            displayOrder: number;
        };
    }>;
    delete(id: string): Promise<{
        deleted: boolean;
    }>;
}
export declare const collectionsService: CollectionsService;
export {};
//# sourceMappingURL=collections.service.d.ts.map