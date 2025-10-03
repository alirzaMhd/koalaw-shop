export type OrderStatus = "draft" | "awaiting_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
export interface Paginated<T> {
    items: T[];
    meta: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}
export interface ListOrdersQuery {
    page?: number;
    perPage?: number;
    status?: OrderStatus | OrderStatus[];
    userId?: string;
    from?: string | Date;
    to?: string | Date;
    search?: string;
}
export interface OrderSummary {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    currencyCode: string;
    placedAt: Date;
    itemsCount: number;
}
declare class OrderService {
    getById(orderId: string): Promise<any>;
    getByNumber(orderNumber: string): Promise<any>;
    getForUser(orderId: string, userId: string): Promise<any>;
    listForUser(userId: string, query?: Partial<ListOrdersQuery>): Promise<Paginated<OrderSummary>>;
    listAll(query?: Partial<ListOrdersQuery>): Promise<Paginated<OrderSummary>>;
    updateStatus(orderId: string, to: OrderStatus): Promise<any>;
    cancelOrder(orderId: string, reason?: string): Promise<any>;
    markPaymentSucceeded(args: {
        orderId: string;
        paymentId: string;
        transactionRef?: string | null;
        authority?: string | null;
    }): Promise<any>;
    markPaymentFailed(args: {
        orderId: string;
        paymentId: string;
        reason?: string | null;
        transactionRef?: string | null;
        authority?: string | null;
    }): Promise<any>;
    createCartFromOrder(orderId: string, userId?: string | null): Promise<{
        cartId: string;
    }>;
}
export declare const orderService: OrderService;
export {};
//# sourceMappingURL=order.service.d.ts.map