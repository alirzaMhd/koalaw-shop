import { Prisma } from "@prisma/client";
export declare const cartRepo: {
    findById(id: string): Prisma.Prisma__CartClient<{
        status: import("@prisma/client").$Enums.CartStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        anonymousId: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findActiveByUser(userId: string): Prisma.Prisma__CartClient<{
        status: import("@prisma/client").$Enums.CartStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        anonymousId: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findByAnonymousId(anonymousId: string): Prisma.Prisma__CartClient<{
        status: import("@prisma/client").$Enums.CartStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        anonymousId: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    createForUser(userId: string): Prisma.Prisma__CartClient<{
        status: import("@prisma/client").$Enums.CartStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        anonymousId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    createForAnonymous(anonymousId: string): Prisma.Prisma__CartClient<{
        status: import("@prisma/client").$Enums.CartStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        anonymousId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    updateStatus(id: string, status: "ACTIVE" | "CONVERTED" | "ABANDONED"): Prisma.Prisma__CartClient<{
        status: import("@prisma/client").$Enums.CartStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        anonymousId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    listItems(cartId: string): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        title: string;
        cartId: string;
        variantId: string | null;
        variantName: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
        imageUrl: string | null;
    }[]>;
    findItemById(itemId: string): Prisma.Prisma__CartItemClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        title: string;
        cartId: string;
        variantId: string | null;
        variantName: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
        imageUrl: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findItemByProductVariant(cartId: string, productId: string, variantId?: string | null): Prisma.Prisma__CartItemClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        title: string;
        cartId: string;
        variantId: string | null;
        variantName: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
        imageUrl: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    addItem(data: any): Prisma.Prisma__CartItemClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        title: string;
        cartId: string;
        variantId: string | null;
        variantName: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
        imageUrl: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    updateItem(id: string, data: any): Prisma.Prisma__CartItemClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        title: string;
        cartId: string;
        variantId: string | null;
        variantName: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
        imageUrl: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    removeItem(id: string): Prisma.Prisma__CartItemClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        title: string;
        cartId: string;
        variantId: string | null;
        variantName: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
        imageUrl: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    clearItems(cartId: string): Prisma.PrismaPromise<Prisma.BatchPayload>;
};
export default cartRepo;
//# sourceMappingURL=cart.repo.d.ts.map