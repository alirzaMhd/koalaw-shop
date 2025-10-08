export declare const productRepo: {
    findById(id: string, include?: any): any;
    findBySlug(slug: string, include?: any): any;
    count(where?: any): any;
    findMany(args: {
        where?: any;
        orderBy?: any | any[];
        skip?: number;
        take?: number;
        include?: any;
    }): any;
    create(data: any): any;
    update(id: string, data: any): any;
    delete(id: string): any;
    listImages(productId: string): any;
    addImage(productId: string, data: Omit<any, "productId">): any;
    updateImage(id: string, data: any): any;
    removeImage(id: string): any;
    replaceImages(productId: string, images: Array<Omit<any, "productId">>): any;
    listVariants(productId: string): any;
    addVariant(productId: string, data: Omit<any, "productId">): any;
    updateVariant(id: string, data: any): any;
    removeVariant(id: string): any;
    replaceVariants(productId: string, variants: Array<Omit<any, "productId">>): any;
};
export default productRepo;
//# sourceMappingURL=product.repo.d.ts.map