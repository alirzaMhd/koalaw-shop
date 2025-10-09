import { Prisma } from "@prisma/client";
export declare const productRepo: {
    findById(id: string, include?: any): Prisma.Prisma__ProductClient<({
        [x: string]: ({
            status: import("@prisma/client").$Enums.ReviewStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            productId: string;
            rating: number;
            title: string | null;
            body: string;
            guestName: string | null;
        } | {
            status: import("@prisma/client").$Enums.ReviewStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            productId: string;
            rating: number;
            title: string | null;
            body: string;
            guestName: string | null;
        })[] | ({
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
        } | {
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
        })[] | ({
            id: string;
            createdAt: Date;
            orderId: string;
            currencyCode: string;
            productId: string | null;
            title: string;
            variantId: string | null;
            variantName: string | null;
            unitPrice: number;
            quantity: number;
            lineTotal: number;
            imageUrl: string | null;
            position: number;
        } | {
            id: string;
            createdAt: Date;
            orderId: string;
            currencyCode: string;
            productId: string | null;
            title: string;
            variantId: string | null;
            variantName: string | null;
            unitPrice: number;
            quantity: number;
            lineTotal: number;
            imageUrl: string | null;
            position: number;
        })[] | ({
            id: string;
            createdAt: Date;
            productId: string;
            position: number;
            url: string;
            alt: string | null;
        } | {
            id: string;
            createdAt: Date;
            productId: string;
            position: number;
            url: string;
            alt: string | null;
        })[] | ({
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currencyCode: string;
            productId: string;
            price: number | null;
            isActive: boolean;
            variantName: string;
            position: number;
            sku: string | null;
            stock: number;
            colorName: string | null;
            colorHexCode: string | null;
        } | {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currencyCode: string;
            productId: string;
            price: number | null;
            isActive: boolean;
            variantName: string;
            position: number;
            sku: string | null;
            stock: number;
            colorName: string | null;
            colorHexCode: string | null;
        })[] | ({
            productId: string;
            position: number;
            relatedProductId: string;
        } | {
            productId: string;
            position: number;
            relatedProductId: string;
        })[] | ({
            id: string;
            title: string;
            icon: string;
        } | {
            id: string;
            title: string;
            icon: string;
        })[] | {
            id: string;
            title: string;
            icon: string;
        }[] | {
            status: import("@prisma/client").$Enums.ReviewStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            productId: string;
            rating: number;
            title: string | null;
            body: string;
            guestName: string | null;
        }[] | {
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
        }[] | {
            id: string;
            createdAt: Date;
            orderId: string;
            currencyCode: string;
            productId: string | null;
            title: string;
            variantId: string | null;
            variantName: string | null;
            unitPrice: number;
            quantity: number;
            lineTotal: number;
            imageUrl: string | null;
            position: number;
        }[] | {
            id: string;
            createdAt: Date;
            productId: string;
            position: number;
            url: string;
            alt: string | null;
        }[] | {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currencyCode: string;
            productId: string;
            price: number | null;
            isActive: boolean;
            variantName: string;
            position: number;
            sku: string | null;
            stock: number;
            colorName: string | null;
            colorHexCode: string | null;
        }[] | {
            productId: string;
            position: number;
            relatedProductId: string;
        }[];
        [x: number]: never;
        [x: symbol]: never;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        title: string;
        slug: string;
        brandId: string;
        colorThemeId: string | null;
        collectionId: string | null;
        category: import("@prisma/client").$Enums.ProductCategory;
        subtitle: string | null;
        description: string | null;
        ingredients: string | null;
        howToUse: string | null;
        price: number;
        compareAtPrice: number | null;
        ratingAvg: Prisma.Decimal;
        ratingCount: number;
        isBestseller: boolean;
        isFeatured: boolean;
        isSpecialProduct: boolean;
        isActive: boolean;
        heroImageUrl: string | null;
        internalNotes: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findBySlug(slug: string, include?: any): Prisma.Prisma__ProductClient<({
        [x: string]: ({
            status: import("@prisma/client").$Enums.ReviewStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            productId: string;
            rating: number;
            title: string | null;
            body: string;
            guestName: string | null;
        } | {
            status: import("@prisma/client").$Enums.ReviewStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            productId: string;
            rating: number;
            title: string | null;
            body: string;
            guestName: string | null;
        })[] | ({
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
        } | {
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
        })[] | ({
            id: string;
            createdAt: Date;
            orderId: string;
            currencyCode: string;
            productId: string | null;
            title: string;
            variantId: string | null;
            variantName: string | null;
            unitPrice: number;
            quantity: number;
            lineTotal: number;
            imageUrl: string | null;
            position: number;
        } | {
            id: string;
            createdAt: Date;
            orderId: string;
            currencyCode: string;
            productId: string | null;
            title: string;
            variantId: string | null;
            variantName: string | null;
            unitPrice: number;
            quantity: number;
            lineTotal: number;
            imageUrl: string | null;
            position: number;
        })[] | ({
            id: string;
            createdAt: Date;
            productId: string;
            position: number;
            url: string;
            alt: string | null;
        } | {
            id: string;
            createdAt: Date;
            productId: string;
            position: number;
            url: string;
            alt: string | null;
        })[] | ({
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currencyCode: string;
            productId: string;
            price: number | null;
            isActive: boolean;
            variantName: string;
            position: number;
            sku: string | null;
            stock: number;
            colorName: string | null;
            colorHexCode: string | null;
        } | {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currencyCode: string;
            productId: string;
            price: number | null;
            isActive: boolean;
            variantName: string;
            position: number;
            sku: string | null;
            stock: number;
            colorName: string | null;
            colorHexCode: string | null;
        })[] | ({
            productId: string;
            position: number;
            relatedProductId: string;
        } | {
            productId: string;
            position: number;
            relatedProductId: string;
        })[] | ({
            id: string;
            title: string;
            icon: string;
        } | {
            id: string;
            title: string;
            icon: string;
        })[] | {
            id: string;
            title: string;
            icon: string;
        }[] | {
            status: import("@prisma/client").$Enums.ReviewStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            productId: string;
            rating: number;
            title: string | null;
            body: string;
            guestName: string | null;
        }[] | {
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
        }[] | {
            id: string;
            createdAt: Date;
            orderId: string;
            currencyCode: string;
            productId: string | null;
            title: string;
            variantId: string | null;
            variantName: string | null;
            unitPrice: number;
            quantity: number;
            lineTotal: number;
            imageUrl: string | null;
            position: number;
        }[] | {
            id: string;
            createdAt: Date;
            productId: string;
            position: number;
            url: string;
            alt: string | null;
        }[] | {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currencyCode: string;
            productId: string;
            price: number | null;
            isActive: boolean;
            variantName: string;
            position: number;
            sku: string | null;
            stock: number;
            colorName: string | null;
            colorHexCode: string | null;
        }[] | {
            productId: string;
            position: number;
            relatedProductId: string;
        }[];
        [x: number]: never;
        [x: symbol]: never;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        title: string;
        slug: string;
        brandId: string;
        colorThemeId: string | null;
        collectionId: string | null;
        category: import("@prisma/client").$Enums.ProductCategory;
        subtitle: string | null;
        description: string | null;
        ingredients: string | null;
        howToUse: string | null;
        price: number;
        compareAtPrice: number | null;
        ratingAvg: Prisma.Decimal;
        ratingCount: number;
        isBestseller: boolean;
        isFeatured: boolean;
        isSpecialProduct: boolean;
        isActive: boolean;
        heroImageUrl: string | null;
        internalNotes: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    count(where?: any): Prisma.PrismaPromise<number>;
    findMany(args: {
        where?: any;
        orderBy?: any | any[];
        skip?: number;
        take?: number;
        include?: any;
    }): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        title: string;
        slug: string;
        brandId: string;
        colorThemeId: string | null;
        collectionId: string | null;
        category: import("@prisma/client").$Enums.ProductCategory;
        subtitle: string | null;
        description: string | null;
        ingredients: string | null;
        howToUse: string | null;
        price: number;
        compareAtPrice: number | null;
        ratingAvg: Prisma.Decimal;
        ratingCount: number;
        isBestseller: boolean;
        isFeatured: boolean;
        isSpecialProduct: boolean;
        isActive: boolean;
        heroImageUrl: string | null;
        internalNotes: string | null;
    }[]>;
    create(data: any): Prisma.Prisma__ProductClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        title: string;
        slug: string;
        brandId: string;
        colorThemeId: string | null;
        collectionId: string | null;
        category: import("@prisma/client").$Enums.ProductCategory;
        subtitle: string | null;
        description: string | null;
        ingredients: string | null;
        howToUse: string | null;
        price: number;
        compareAtPrice: number | null;
        ratingAvg: Prisma.Decimal;
        ratingCount: number;
        isBestseller: boolean;
        isFeatured: boolean;
        isSpecialProduct: boolean;
        isActive: boolean;
        heroImageUrl: string | null;
        internalNotes: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    update(id: string, data: any): Prisma.Prisma__ProductClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        title: string;
        slug: string;
        brandId: string;
        colorThemeId: string | null;
        collectionId: string | null;
        category: import("@prisma/client").$Enums.ProductCategory;
        subtitle: string | null;
        description: string | null;
        ingredients: string | null;
        howToUse: string | null;
        price: number;
        compareAtPrice: number | null;
        ratingAvg: Prisma.Decimal;
        ratingCount: number;
        isBestseller: boolean;
        isFeatured: boolean;
        isSpecialProduct: boolean;
        isActive: boolean;
        heroImageUrl: string | null;
        internalNotes: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    delete(id: string): Prisma.Prisma__ProductClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        title: string;
        slug: string;
        brandId: string;
        colorThemeId: string | null;
        collectionId: string | null;
        category: import("@prisma/client").$Enums.ProductCategory;
        subtitle: string | null;
        description: string | null;
        ingredients: string | null;
        howToUse: string | null;
        price: number;
        compareAtPrice: number | null;
        ratingAvg: Prisma.Decimal;
        ratingCount: number;
        isBestseller: boolean;
        isFeatured: boolean;
        isSpecialProduct: boolean;
        isActive: boolean;
        heroImageUrl: string | null;
        internalNotes: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    listImages(productId: string): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        productId: string;
        position: number;
        url: string;
        alt: string | null;
    }[]>;
    addImage(productId: string, data: Omit<any, "productId">): Prisma.Prisma__ProductImageClient<{
        id: string;
        createdAt: Date;
        productId: string;
        position: number;
        url: string;
        alt: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    updateImage(id: string, data: any): Prisma.Prisma__ProductImageClient<{
        id: string;
        createdAt: Date;
        productId: string;
        position: number;
        url: string;
        alt: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    removeImage(id: string): Prisma.Prisma__ProductImageClient<{
        id: string;
        createdAt: Date;
        productId: string;
        position: number;
        url: string;
        alt: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    replaceImages(productId: string, images: Array<Omit<any, "productId">>): Promise<any[]>;
    listVariants(productId: string): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        price: number | null;
        isActive: boolean;
        variantName: string;
        position: number;
        sku: string | null;
        stock: number;
        colorName: string | null;
        colorHexCode: string | null;
    }[]>;
    addVariant(productId: string, data: Omit<any, "productId">): Prisma.Prisma__ProductVariantClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        price: number | null;
        isActive: boolean;
        variantName: string;
        position: number;
        sku: string | null;
        stock: number;
        colorName: string | null;
        colorHexCode: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    updateVariant(id: string, data: any): Prisma.Prisma__ProductVariantClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        price: number | null;
        isActive: boolean;
        variantName: string;
        position: number;
        sku: string | null;
        stock: number;
        colorName: string | null;
        colorHexCode: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    removeVariant(id: string): Prisma.Prisma__ProductVariantClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        price: number | null;
        isActive: boolean;
        variantName: string;
        position: number;
        sku: string | null;
        stock: number;
        colorName: string | null;
        colorHexCode: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    replaceVariants(productId: string, variants: Array<Omit<any, "productId">>): Promise<any[]>;
};
export default productRepo;
//# sourceMappingURL=product.repo.d.ts.map