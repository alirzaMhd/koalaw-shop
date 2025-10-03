import { Prisma } from "@prisma/client";
export declare const paymentRepo: {
    findById(id: string): any;
    listForOrder(orderId: string): any;
    create(data: Prisma.PaymentUncheckedCreateInput): any;
    update(id: string, data: Prisma.PaymentUncheckedUpdateInput): any;
    findPendingGatewayByOrder(orderId: string): any;
    findByAuthority(authority: string): any;
};
export default paymentRepo;
//# sourceMappingURL=payment.repo.d.ts.map