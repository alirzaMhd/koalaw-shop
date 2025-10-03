export type ReserveLine = {
    variantId: string;
    quantity: number;
};
export type ReserveResult = {
    reserved: ReserveLine[];
    failures: {
        variantId: string;
        requested: number;
        available?: number;
        reason: "OUT_OF_STOCK" | "NOT_FOUND";
    }[];
};
export declare class InventoryService {
    getStock(variantId: string): Promise<number>;
    setStock(variantId: string, stock: number): Promise<number>;
    adjustStock(variantId: string, delta: number): Promise<number>;
    private reserveOne;
    private releaseOne;
    /**
     * Try to reserve a set of variant quantities atomically.
     * If ALLOW_BACKORDER=false, the operation is all-or-nothing (transaction).
     * If any line cannot be reserved, the transaction is rolled back and an error is thrown.
     */
    reserve(lines: ReserveLine[]): Promise<ReserveResult>;
    /**
     * Release a set of variant quantities (e.g., on order cancellation).
     * Always increments back stock per line, in a transaction.
     */
    release(lines: ReserveLine[]): Promise<void>;
    /**
     * Reserve inventory for all order items (order_items) with a variantId.
     * Throws if any item cannot be reserved (and rolls back).
     */
    reserveForOrder(orderId: string): Promise<ReserveResult>;
    /**
     * Release inventory for all order items (e.g., on cancellation/return).
     */
    releaseForOrder(orderId: string): Promise<void>;
    /**
     * Check if a cart's items are available right now (without reserving).
     * Returns per-line availability and overall ok flag.
     */
    verifyCartAvailability(cartId: string): Promise<{
        ok: boolean;
        lines: {
            cartItemId: string;
            variantId?: string | null;
            requested: number;
            available: number;
            ok: boolean;
        }[];
        unavailableCount: number;
        missingVariantCount: number;
    }>;
    /**
     * Reserve inventory for a given cart (decrement stock). All-or-nothing.
     * Useful when creating an order from a cart right before payment authorization.
     */
    reserveForCart(cartId: string): Promise<ReserveResult>;
}
export declare const inventoryService: InventoryService;
//# sourceMappingURL=inventory.service.d.ts.map