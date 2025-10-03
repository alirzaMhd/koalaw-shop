export type ShippingMethod = "standard" | "express";
export interface QuoteLine {
    id?: string;
    productId?: string;
    variantId?: string | null;
    title: string;
    variantName?: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    imageUrl?: string | null;
    currencyCode?: string;
}
export interface QuoteOptions {
    couponCode?: string | null;
    shippingMethod?: ShippingMethod;
    giftWrap?: boolean;
    userId?: string | null;
    currencyCode?: string;
}
export interface QuoteResult {
    lines: QuoteLine[];
    subtotal: number;
    discount: number;
    postSubtotal: number;
    shippingBase: number;
    shippingDiscount: number;
    shipping: number;
    giftWrap: number;
    tax: number;
    total: number;
    currencyCode: string;
    freeShippingThreshold: number;
    shippingMethod: ShippingMethod;
    appliedCoupon?: {
        code: string;
        ok: boolean;
        reason?: string;
        effect?: {
            discount: number;
            shippingDiscount: number;
        };
        id?: string;
    };
}
declare class PricingService {
    /**
     * Build a quote from a cart in DB.
     * Reads cart_items snapshot fields (title, variant_name, unit_price, image_url).
     */
    quoteCart(cartId: string, opts?: QuoteOptions): Promise<QuoteResult>;
    /**
     * Build a quote from ad-hoc lines (e.g., direct checkout).
     */
    quoteLines(lines: QuoteLine[], opts?: QuoteOptions): Promise<QuoteResult>;
}
export declare const pricingService: PricingService;
export {};
//# sourceMappingURL=pricing.service.d.ts.map