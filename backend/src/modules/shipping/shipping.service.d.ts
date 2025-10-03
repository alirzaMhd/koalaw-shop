import { type QuoteResult } from "../pricing/pricing.service.js";
export type ShippingMethod = "standard" | "express";
export interface Address {
    firstName?: string;
    lastName?: string;
    phone?: string;
    postalCode?: string | null;
    province?: string;
    city?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    country?: string;
}
export interface RateQuote {
    method: ShippingMethod;
    amount: number;
    currencyCode: string;
    eta: string;
    free: boolean;
    base: number;
    surcharge: number;
    meta?: Record<string, any>;
}
export interface ShippingQuotes {
    standard: RateQuote;
    express: RateQuote;
}
export interface ShipmentLabel {
    id: string;
    carrier: string;
    trackingNumber: string;
    labelUrl?: string;
    createdAt: string;
    to?: {
        name?: string;
        phone?: string;
        province?: string;
        city?: string;
        postalCode?: string | null;
    };
}
export interface QuoteOptions {
    couponFreeShip?: boolean;
    currencyCode?: string;
}
declare class ShippingService {
    /**
     * Quote for a cart by id using pricing.service totals.
     * Returns both methods (standard/express) as RateQuote.
     */
    quoteCart(cartId: string, addr?: Address, opts?: QuoteOptions): Promise<ShippingQuotes & {
        subtotal: number;
    }>;
    /**
     * Quote for ad-hoc lines via pricing.service or supplied subtotal.
     * If subtotal is provided, uses subtotal; otherwise compute via pricing for zero shipping/gift.
     */
    quoteLinesOrSubtotal(args: {
        subtotal?: number;
        linesQuote?: QuoteResult | null;
        address?: Address;
        couponFreeShip?: boolean;
        currencyCode?: string;
    }): Promise<ShippingQuotes>;
    /**
     * Simple helper to return the shipping part of a pricing quote as RateQuote.
     */
    fromPricingQuote(quote: QuoteResult, method: ShippingMethod, addr?: Address): RateQuote;
    /**
     * Generate a shipping label stub and tracking number for an order.
     * This does not persist (no table available); downstream systems can listen to the event and store externally.
     */
    createShipmentLabel(orderId: string, carrier?: string): Promise<ShipmentLabel>;
    /**
     * Simple tracking info stub. Replace with a real carrier API integration.
     */
    track(trackingNumber: string): Promise<{
        trackingNumber: string;
        status: string;
        lastUpdate: string;
        history: Array<{
            at: string;
            status: string;
            location?: string;
        }>;
    }>;
    private generateTrackingNumber;
}
export declare const shippingService: ShippingService;
export {};
//# sourceMappingURL=shipping.service.d.ts.map