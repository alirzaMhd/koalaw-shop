export type Channel = "email" | "sms" | "push";
export interface EmailPayload {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    cc?: string[];
    bcc?: string[];
    headers?: Record<string, string>;
}
export interface SmsPayload {
    to: string;
    text: string;
    sender?: string;
}
export interface PushPayload {
    to: string | string[];
    title: string;
    body: string;
    data?: Record<string, any>;
}
export interface OrderEmailContext {
    orderId: string;
    orderNumber: string;
    name?: string | null;
    amounts: {
        subtotal: number;
        discount: number;
        shipping: number;
        giftWrap: number;
        total: number;
        currencyCode: string;
    };
    items: Array<{
        title: string;
        variantName?: string | null;
        qty: number;
        unitPrice: number;
        lineTotal: number;
        imageUrl?: string | null;
    }>;
    shipping: {
        method: string;
        province?: string | null;
        city?: string | null;
        addressLine1?: string | null;
        postalCode?: string | null;
    };
    couponCode?: string | null;
}
declare class NotificationService {
    /**
     * Send an email now or enqueue it if a queue is configured.
     * If templateName is provided, we render it using Handlebars templates.
     */
    sendEmail(payload: EmailPayload & {
        templateName?: string;
        templateData?: Record<string, any>;
    }, opts?: {
        enqueue?: boolean;
    }): Promise<void>;
    /**
     * Send SMS (if provider exists).
     */
    sendSms(payload: SmsPayload): Promise<void>;
    /**
     * Build and send order confirmation email by orderId (or from event).
     */
    sendOrderConfirmation(orderId: string): Promise<void>;
    /**
     * Build and send payment receipt email by orderId/paymentId.
     */
    sendPaymentReceipt(orderId: string, paymentId: string): Promise<void>;
    /**
     * Shipping update via email (tracking number, carrier, etc.)
     */
    sendShippingUpdate(orderId: string, args: {
        carrier: string;
        trackingNumber: string;
        labelUrl?: string;
    }): Promise<void>;
    bindDefaultHandlers(): void;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notification.service.d.ts.map