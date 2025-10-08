export declare const paymentRepo: {
    findById(id: string): any;
    listForOrder(orderId: string): any;
    create(data: any): any;
    update(id: string, data: any): any;
    findPendingGatewayByOrder(orderId: string): any;
    findByAuthority(authority: string): any;
};
export default paymentRepo;
//# sourceMappingURL=payment.repo.d.ts.map