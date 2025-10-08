export declare const newsletterRepo: {
    subscribe(email: string, source?: string): Promise<any>;
    unsubscribe(email: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    isSubscribed(email: string): Promise<any>;
    getAllActive(skip?: number, take?: number): Promise<any>;
    getStats(): Promise<{
        total: any;
        active: any;
        unsubscribed: any;
    }>;
};
//# sourceMappingURL=newsletter.repo.d.ts.map