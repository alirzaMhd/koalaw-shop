type RatePct = number;
export interface RegionOverride {
    country?: string;
    province?: string;
    city?: string;
    postalPrefix?: string;
    rate: RatePct;
}
export interface TaxRegionContext {
    country?: string | null;
    province?: string | null;
    city?: string | null;
    postalCode?: string | null;
}
export interface TaxContext extends TaxRegionContext {
    taxExempt?: boolean;
    pricesIncludeTax?: boolean;
    shippingTaxable?: boolean;
    currencyCode?: string;
}
export interface TaxLineInput {
    id?: string;
    unitPrice?: number;
    quantity?: number;
    lineTotal?: number;
}
export interface LineTax {
    id?: string;
    base: number;
    ratePct: number;
    tax: number;
}
export interface TaxComputation {
    lineTaxes: LineTax[];
    shippingTax: number;
    taxTotal: number;
    rateApplied: number;
    pricesIncludeTax: boolean;
    shippingTaxable: boolean;
    currencyCode: string;
}
declare class TaxService {
    /**
     * Resolve tax rate for the given region context.
     */
    getRate(ctx?: TaxRegionContext): RatePct;
    /**
     * Compute line-level taxes for provided lines and shipping amount.
     * - If pricesIncludeTax=true, each lineTotal is treated as gross; we split into net+tax.
     * - If pricesIncludeTax=false, we compute tax on the base (exclusive) amount.
     */
    computeForLines(input: {
        lines: TaxLineInput[];
        shippingAmount?: number | null;
    }, ctx?: TaxContext): TaxComputation;
    /**
     * Compute taxes for a cart by ID using snapshot fields in cart_items.
     * You can pass shippingAmount if you already computed it in pricing.service.
     */
    computeForCart(cartId: string, opts?: {
        ctx?: TaxContext;
        shippingAmount?: number | null;
    }): Promise<TaxComputation>;
    /**
     * Compute tax on a single exclusive amount (utility).
     */
    taxOnExclusive(amount: number, ctx?: TaxContext): number;
    /**
     * Given a gross (tax-inclusive) amount, split to net and tax (utility).
     */
    splitInclusive(amount: number, ctx?: TaxContext): {
        net: number;
        tax: number;
    };
}
export declare const taxService: TaxService;
export {};
//# sourceMappingURL=tax.service.d.ts.map