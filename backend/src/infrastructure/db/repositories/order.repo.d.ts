export declare const orderRepo: {
    findById(id: string): any;
    findByNumber(orderNumber: string): any;
    findForUser(id: string, userId: string): any;
    count(where?: any): any;
    list(where: any, page?: number, perPage?: number): any;
    create(data: any, items?: Array<any>, payment?: any): any;
    updateStatus(id: string, status: NonNullable<any>): any;
    createPayment(orderId: string, data: any): any;
    listItems(orderId: string): any;
};
export default orderRepo;
//# sourceMappingURL=order.repo.d.ts.map