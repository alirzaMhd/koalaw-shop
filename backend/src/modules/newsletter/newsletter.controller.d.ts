import type { RequestHandler } from "express";
export declare const newsletterController: {
    /**
     * POST /api/newsletter/subscribe
     */
    subscribe: RequestHandler;
    /**
     * POST /api/newsletter/unsubscribe
     * GET /api/newsletter/unsubscribe (for one-click unsubscribe)
     */
    unsubscribe: RequestHandler;
    /**
     * GET /api/newsletter/subscriptions (admin only)
     */
    getSubscriptions: RequestHandler;
    /**
     * GET /api/newsletter/statistics (admin only)
     */
    getStatistics: RequestHandler;
    /**
     * POST /api/newsletter/send (admin only)
     */
    sendNewsletter: RequestHandler;
    /**
     * GET /api/newsletter/export (admin only)
     */
    exportSubscribers: RequestHandler;
};
export default newsletterController;
//# sourceMappingURL=newsletter.controller.d.ts.map