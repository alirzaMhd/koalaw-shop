export declare const newsletterService: {
    /**
     * Subscribe a new email to the newsletter
     */
    subscribe(email: string, source?: string, ipAddress?: string): Promise<{
        subscription: any;
        isNew: boolean;
        reactivated: boolean;
    }>;
    /**
     * Unsubscribe an email from the newsletter
     */
    unsubscribe(email: string, token?: string): Promise<{
        subscription: any;
        alreadyUnsubscribed: boolean;
    }>;
    /**
     * Get all active subscriptions (for admin/analytics)
     */
    getActiveSubscriptions(page?: number, perPage?: number): Promise<{
        subscriptions: any;
        total: any;
        page: number;
        perPage: number;
        totalPages: number;
    }>;
    /**
     * Get newsletter statistics
     */
    getStatistics(): Promise<{
        totalSubscribers: any;
        activeSubscribers: any;
        unsubscribedSubscribers: number;
        recentSubscribers: any;
        unsubscribeRate: number;
    }>;
    /**
     * Queue welcome email
     */
    queueWelcomeEmail(email: string): Promise<void>;
    /**
     * Queue unsubscribe confirmation email
     */
    queueUnsubscribeConfirmationEmail(email: string): Promise<void>;
    /**
     * Send welcome email
     */
    sendWelcomeEmail(email: string): Promise<{
        sent: boolean;
    }>;
    /**
     * Send unsubscribe confirmation email
     */
    sendUnsubscribeConfirmationEmail(email: string): Promise<{
        sent: boolean;
    }>;
    /**
     * Send newsletter to all active subscribers
     */
    sendNewsletter(opts: {
        subject: string;
        htmlContent: string;
        textContent?: string;
        testEmail?: string;
        scheduledAt?: Date;
    }): Promise<{
        sent: number;
        recipients: string[];
        test: boolean;
        queued?: undefined;
    } | {
        sent: any;
        recipients: any;
        test: boolean;
        queued: boolean;
    }>;
    /**
     * Send individual newsletter email (called by queue worker)
     */
    sendNewsletterEmail(opts: {
        email: string;
        subject: string;
        htmlContent: string;
        textContent?: string;
    }): Promise<void>;
    /**
     * Export subscribers to CSV
     */
    exportSubscribers(): Promise<string>;
};
export default newsletterService;
//# sourceMappingURL=newsletter.service.d.ts.map