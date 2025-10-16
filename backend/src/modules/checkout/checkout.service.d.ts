import { type QuoteOptions, type QuoteResult, type ShippingMethod as QuoteShippingMethod } from "../pricing/pricing.service.js";
export type PaymentMethod = "gateway" | "cod";
export interface CheckoutAddress {
    firstName: string;
    lastName: string;
    phone: string;
    postalCode?: string | null | undefined;
    province: string;
    city: string;
    addressLine1: string;
    addressLine2?: string | null | undefined;
    country?: string | undefined;
}
export interface CheckoutOptions extends QuoteOptions {
    paymentMethod: PaymentMethod;
    shippingMethod?: QuoteShippingMethod;
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
    prepareQuote(cartId: string, opts?: QuoteOptions): Promise<QuoteResult>;
    createOrderFromCart(args: {
        cartId: string;
        userId?: string | null | undefined;
        address: CheckoutAddress;
        options: CheckoutOptions;
        returnUrl?: string | undefined;
        cancelUrl?: string | undefined;
        lines?: Array<{
            title: string;
            unitPrice: number;
            quantity: number;
            productId?: string | null;
            variantId?: string | null;
            variantName?: string | null;
            imageUrl?: string | null;
            currencyCode?: string | undefined;
        }>;
    }): Promise<CheckoutResult>;
}
export declare const checkoutService: CheckoutService;
export {};
//# sourceMappingURL=checkout.service.d.ts.map