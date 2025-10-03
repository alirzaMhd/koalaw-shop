import { type QuoteOptions, type QuoteResult, type ShippingMethod } from "../pricing/pricing.service.js";
export type PaymentMethod = "gateway" | "cod";
export interface CheckoutAddress {
    firstName: string;
    lastName: string;
    phone: string;
    postalCode?: string | null;
    province: string;
    city: string;
    addressLine1: string;
    addressLine2?: string | null;
    country?: string;
}
export interface CheckoutOptions extends QuoteOptions {
    paymentMethod: PaymentMethod;
    shippingMethod?: ShippingMethod;
    note?: string | null;
}
export interface CheckoutResult {
    orderId: string;
    orderNumber: string;
    status: "awaiting_payment" | "processing";
    amounts: {
        subtotal: number;
        discount: number;
        shipping: number;
        giftWrap: number;
        total: number;
        currencyCode: string;
    };
    payment: {
        id: string;
        method: PaymentMethod;
        status: "pending" | "paid" | "failed" | "refunded";
        amount: number;
        currencyCode: string;
        clientSecret?: string;
        approvalUrl?: string;
        authority?: string | null;
    };
    quote: QuoteResult;
}
declare class CheckoutService {
    /**
     * Compute quote (and optional taxes) for a cart.
     * This mirrors the frontend constants and coupon behavior.
     */
    prepareQuote(cartId: string, opts?: QuoteOptions): Promise<QuoteResult>;
    /**
     * Create an order from a cart and initialize payment.
     * - Validates cart has items
     * - Computes quote via pricing.service (no tax line in DB schema; tax kept 0)
     * - Persists order, items, and a pending payment record
     * - For "gateway": initializes payment intent and returns clientSecret/approvalUrl
     * - Emits "order.created" event
     */
    createOrderFromCart(args: {
        cartId: string;
        userId?: string | null;
        address: CheckoutAddress;
        options: CheckoutOptions;
        returnUrl?: string;
        cancelUrl?: string;
    }): Promise<CheckoutResult>;
}
export declare const checkoutService: CheckoutService;
export {};
//# sourceMappingURL=checkout.service.d.ts.map