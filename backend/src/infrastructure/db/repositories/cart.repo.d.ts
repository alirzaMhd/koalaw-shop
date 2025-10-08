export declare const cartRepo: {
    findById(id: string): any;
    findActiveByUser(userId: string): any;
    findByAnonymousId(anonymousId: string): any;
    createForUser(userId: string): any;
    createForAnonymous(anonymousId: string): any;
    updateStatus(id: string, status: "ACTIVE" | "CONVERTED" | "ABANDONED"): any;
    listItems(cartId: string): any;
    findItemById(itemId: string): any;
    findItemByProductVariant(cartId: string, productId: string, variantId?: string | null): any;
    addItem(data: any): any;
    updateItem(id: string, data: any): any;
    removeItem(id: string): any;
    clearItems(cartId: string): any;
};
export default cartRepo;
//# sourceMappingURL=cart.repo.d.ts.map