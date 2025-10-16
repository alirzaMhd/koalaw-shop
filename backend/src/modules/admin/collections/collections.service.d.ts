declare class CollectionsService {
    list(): Promise<{
        name: string;
        id: string;
        _count: {
            products: number;
        };
        heroImageUrl: string | null;
    }[]>;
    create(input: {
        name: string;
        heroImageUrl?: string | null;
    }): Promise<{
        collection: {
            name: string;
            id: string;
            heroImageUrl: string | null;
        };
    }>;
    update(id: string, input: {
        name?: string;
        heroImageUrl?: string | null;
    }): Promise<{
        collection: {
            name: string;
            id: string;
            heroImageUrl: string | null;
        };
    }>;
}
export declare const collectionsService: CollectionsService;
export {};
//# sourceMappingURL=collections.service.d.ts.map