export declare const newsletterRepo: {
    subscribe(email: string, source?: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        source: string | null;
        consent: boolean;
        unsubscribedAt: Date | null;
    }>;
    unsubscribe(email: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        source: string | null;
        consent: boolean;
        unsubscribedAt: Date | null;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        source: string | null;
        consent: boolean;
        unsubscribedAt: Date | null;
    } | null>;
    isSubscribed(email: string): Promise<boolean | null>;
    getAllActive(skip?: number, take?: number): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        source: string | null;
        consent: boolean;
        unsubscribedAt: Date | null;
    }[]>;
    getStats(): Promise<{
        total: number;
        active: number;
        unsubscribed: number;
    }>;
};
//# sourceMappingURL=newsletter.repo.d.ts.map