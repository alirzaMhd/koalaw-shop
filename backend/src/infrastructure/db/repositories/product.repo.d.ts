import { Prisma } from "@prisma/client";
export type ProductWhere = Prisma.ProductWhereInput;
export type ProductOrderBy = Prisma.ProductOrderByWithRelationInput;
export declare const productRepo: {
    findById(id: string, include?: Prisma.ProductInclude): any;
    findBySlug(slug: string, include?: Prisma.ProductInclude): any;
    count(where?: ProductWhere): any;
    findMany(args: {
        where?: ProductWhere;
        orderBy?: ProductOrderBy | ProductOrderBy[];
        skip?: number;
        take?: number;
        include?: Prisma.ProductInclude;
    }): any;
    create(data: Prisma.ProductCreateInput): any;
    update(id: string, data: Prisma.ProductUpdateInput): any;
    delete(id: string): any;
    listImages(productId: string): any;
    addImage(productId: string, data: Omit<Prisma.ProductImageUncheckedCreateInput, "productId">): any;
    updateImage(id: string, data: Prisma.ProductImageUncheckedUpdateInput): any;
    removeImage(id: string): any;
    replaceImages(productId: string, images: Array<Omit<Prisma.ProductImageUncheckedCreateInput, "productId">>): any;
    listVariants(productId: string): any;
    addVariant(productId: string, data: Omit<Prisma.ProductVariantUncheckedCreateInput, "productId">): any;
    updateVariant(id: string, data: Prisma.ProductVariantUncheckedUpdateInput): any;
    removeVariant(id: string): any;
    replaceVariants(productId: string, variants: Array<Omit<Prisma.ProductVariantUncheckedCreateInput, "productId">>): any;
};
export default productRepo;
//# sourceMappingURL=product.repo.d.ts.map