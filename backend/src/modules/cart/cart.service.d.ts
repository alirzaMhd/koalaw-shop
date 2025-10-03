import { type QuoteOptions, type QuoteResult } from "../pricing/pricing.service.js";
export type CartStatus = "active" | "converted" | "abandoned";
export interface Cart {
    id: string;
    userId?: string | null;
    anonymousId?: string | null;
    status: CartStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface CartItem {
    id: string;
    cartId: string;
    productId: string;
    variantId?: string | null;
    title: string;
    variantName?: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    currencyCode: string;
    imageUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CartWithItems extends Cart {
    items: CartItem[];
}
declare class CartService {
    getById(cartId: string): Promise<CartWithItems>;
    getOrCreateForUser(userId: string): Promise<CartWithItems>;
    getOrCreateForAnonymous(anonymousId: string): Promise<CartWithItems>;
    addItem(cartId: string, input: {
        productId: string;
        variantId?: string | null;
        quantity?: number;
    }): Promise<CartItem>;
    updateItem(cartId: string, itemId: string, input: {
        quantity?: number;
    }): Promise<CartItem | {
        deleted: boolean;
    }>;
    removeItem(cartId: string, itemId: string): Promise<{
        deleted: boolean;
    }>;
    clear(cartId: string): Promise<{
        cleared: any;
    }>;
    quote(cartId: string, opts?: QuoteOptions): Promise<QuoteResult>;
    /**
     * Merge a guest (anonymous) cart into a user's active cart on login.
     * - If no guest cart found, returns user's cart.
     * - Sums quantities for identical (productId, variantId).
     * - Deletes the guest cart after merging.
     */
    mergeAnonymousIntoUser(userId: string, anonymousId: string): Promise<CartWithItems>;
    setStatus(cartId: string, status: CartStatus): Promise<Cart>;
}
export declare const cartService: CartService;
export {};
//# sourceMappingURL=cart.service.d.ts.map