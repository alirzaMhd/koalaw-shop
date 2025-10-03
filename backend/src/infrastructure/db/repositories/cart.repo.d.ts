import { Prisma } from "@prisma/client";
export declare const cartRepo: {
    findById(id: string): any;
    findActiveByUser(userId: string): any;
    findByAnonymousId(anonymousId: string): any;
    createForUser(userId: string): any;
    createForAnonymous(anonymousId: string): any;
    updateStatus(id: string, status: "active" | "converted" | "abandoned"): any;
    listItems(cartId: string): any;
    findItemById(itemId: string): any;
    findItemByProductVariant(cartId: string, productId: string, variantId?: string | null): any;
    addItem(data: Prisma.CartItemUncheckedCreateInput): any;
    updateItem(id: string, data: Prisma.CartItemUncheckedUpdateInput): any;
    removeItem(id: string): any;
    clearItems(cartId: string): any;
};
export default cartRepo;
//# sourceMappingURL=cart.repo.d.ts.map