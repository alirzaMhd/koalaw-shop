import { Prisma } from "@prisma/client";
export type ProductWhere = Prisma.ProductWhereInput;
export type ProductOrderBy = Prisma.ProductOrderByWithRelationInput;
export declare const productRepo: {
    findById(id: string, include?: Prisma.ProductInclude): Prisma.Prisma__ProductClient<{
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
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findBySlug(slug: string, include?: Prisma.ProductInclude): Prisma.Prisma__ProductClient<{
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
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    count(where?: ProductWhere): Prisma.PrismaPromise<number>;
    findMany(args: {
        where?: ProductWhere;
        orderBy?: ProductOrderBy | ProductOrderBy[];
        skip?: number;
        take?: number;
        include?: Prisma.ProductInclude;
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
    create(data: Prisma.ProductCreateInput): Prisma.Prisma__ProductClient<{
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
    update(id: string, data: Prisma.ProductUpdateInput): Prisma.Prisma__ProductClient<{
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
        url: string;
        alt: string | null;
        position: number;
    }[]>;
    addImage(productId: string, data: Omit<Prisma.ProductImageUncheckedCreateInput, "productId">): Prisma.Prisma__ProductImageClient<{
        id: string;
        createdAt: Date;
        productId: string;
        url: string;
        alt: string | null;
        position: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    updateImage(id: string, data: Prisma.ProductImageUncheckedUpdateInput): Prisma.Prisma__ProductImageClient<{
        id: string;
        createdAt: Date;
        productId: string;
        url: string;
        alt: string | null;
        position: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    removeImage(id: string): Prisma.Prisma__ProductImageClient<{
        id: string;
        createdAt: Date;
        productId: string;
        url: string;
        alt: string | null;
        position: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    replaceImages(productId: string, images: Array<Omit<Prisma.ProductImageUncheckedCreateInput, "productId">>): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        url: string;
        alt: string | null;
        position: number;
    }[]>;
    listVariants(productId: string): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        price: number | null;
        isActive: boolean;
        position: number;
        variantName: string;
        sku: string | null;
        stock: number;
        colorName: string | null;
        colorHexCode: string | null;
    }[]>;
    addVariant(productId: string, data: Omit<Prisma.ProductVariantUncheckedCreateInput, "productId">): Prisma.Prisma__ProductVariantClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        price: number | null;
        isActive: boolean;
        position: number;
        variantName: string;
        sku: string | null;
        stock: number;
        colorName: string | null;
        colorHexCode: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    updateVariant(id: string, data: Prisma.ProductVariantUncheckedUpdateInput): Prisma.Prisma__ProductVariantClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        price: number | null;
        isActive: boolean;
        position: number;
        variantName: string;
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
        position: number;
        variantName: string;
        sku: string | null;
        stock: number;
        colorName: string | null;
        colorHexCode: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    replaceVariants(productId: string, variants: Array<Omit<Prisma.ProductVariantUncheckedCreateInput, "productId">>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currencyCode: string;
        productId: string;
        price: number | null;
        isActive: boolean;
        position: number;
        variantName: string;
        sku: string | null;
        stock: number;
        colorName: string | null;
        colorHexCode: string | null;
    }[]>;
};
export default productRepo;
//# sourceMappingURL=product.repo.d.ts.map