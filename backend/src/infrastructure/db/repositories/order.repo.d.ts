import { Prisma } from "@prisma/client";
export declare const orderRepo: {
    findById(id: string): any;
    findByNumber(orderNumber: string): any;
    findForUser(id: string, userId: string): any;
    count(where?: Prisma.OrderWhereInput): any;
    list(where: Prisma.OrderWhereInput, page?: number, perPage?: number): any;
    create(data: Prisma.OrderCreateInput, items?: Array<Prisma.OrderItemUncheckedCreateInput>, payment?: Prisma.PaymentUncheckedCreateInput): any;
    updateStatus(id: string, status: Prisma.OrderUpdateInput["status"]): any;
    createPayment(orderId: string, data: Prisma.PaymentUncheckedCreateInput): any;
    listItems(orderId: string): any;
};
export default orderRepo;
//# sourceMappingURL=order.repo.d.ts.map