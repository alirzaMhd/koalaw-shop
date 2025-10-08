declare class PaymentService {
    getById(paymentId: string): Promise<any>;
    listForOrder(orderId: string): Promise<any>;
    markPaid(args: {
        orderId: string;
        paymentId: string;
        transactionRef?: string | null;
        authority?: string | null;
    }): Promise<any>;
    markFailed(args: {
        orderId: string;
        paymentId: string;
        reason?: string | null;
        transactionRef?: string | null;
        authority?: string | null;
    }): Promise<any>;
    refund(args: {
        paymentId: string;
        reason?: string | null;
        amount?: number | null;
    }): Promise<any>;
    /**
     * Handle Stripe webhook. Provide the raw request body (string or Buffer) and headers.
     * - Verifies signature if STRIPE_WEBHOOK_SECRET and Stripe SDK are available.
     * - Expects metadata.orderId (and optionally authority==intent.id already stored).
     * - Updates payment row and notifies order service.
     */
    handleStripeWebhook(opts: {
        rawBody: Buffer | string;
        headers: Record<string, any>;
    }): Promise<{
        ok: boolean;
    }>;
    /**
     * Handle PayPal webhook events. Provide already-parsed JSON body and headers (for signature verification if added).
     * - Expects resource.id (authority) and optionally resource.custom_id or resource.purchase_units[0].custom_id containing orderId.
     */
    handlePaypalWebhook(opts: {
        body: any;
        headers: Record<string, any>;
    }): Promise<{
        ok: boolean;
    }>;
    /**
     * For PSPs that redirect back to your site (e.g., local gateways),
     * call this with the resolved values from their return query/body.
     */
    handleGenericGatewayReturn(args: {
        orderId?: string;
        authority?: string | null;
        transactionRef?: string | null;
        success: boolean;
        reason?: string | null;
    }): Promise<{
        ok: boolean;
    }>;
    /**
     * Mark a COD payment as paid (e.g., upon delivery confirmation).
     */
    confirmCodPaid(orderId: string): Promise<any>;
}
export declare const paymentService: PaymentService;
export {};
//# sourceMappingURL=payment.service.d.ts.map