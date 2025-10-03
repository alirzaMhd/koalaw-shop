export declare const OrderEvent: Readonly<{
    readonly Created: "order.created";
    readonly Cancelled: "order.cancelled";
    readonly StatusChanged: "order.status.changed";
    readonly PaymentSucceeded: "payment.succeeded";
    readonly PaymentFailed: "payment.failed";
}>;
export type OrderEventName = (typeof OrderEvent)[keyof typeof OrderEvent];
export type ShippingMethod = "standard" | "express";
export type PaymentMethod = "gateway" | "cod";
export interface OrderTotals {
    subtotal: number;
    discount: number;
    shipping: number;
    giftWrap: number;
    total: number;
    currency: string;
}
export interface OrderCreatedEvent {
    orderId: string;
    orderNumber: string;
    userId?: string | null;
    paymentMethod: PaymentMethod;
    shippingMethod: ShippingMethod;
    totals: OrderTotals;
    couponCode?: string | null;
}
export interface OrderCancelledEvent {
    orderId: string;
    orderNumber?: string;
    userId?: string | null;
    reason?: string | null;
}
export interface OrderStatusChangedEvent {
    orderId: string;
    from: string;
    to: string;
    at?: string;
}
export interface PaymentSucceededEvent {
    orderId: string;
    paymentId: string;
    method: PaymentMethod;
    amount: number;
    currencyCode: string;
    authority?: string | null;
    transactionRef?: string | null;
}
export interface PaymentFailedEvent {
    orderId: string;
    paymentId: string;
    method: PaymentMethod;
    amount: number;
    currencyCode: string;
    reason?: string | null;
}
export declare function emitOrderCreated(payload: OrderCreatedEvent): void;
export declare function emitOrderCancelled(payload: OrderCancelledEvent): void;
export declare function emitOrderStatusChanged(payload: OrderStatusChangedEvent): void;
export declare function emitPaymentSucceeded(payload: PaymentSucceededEvent): void;
export declare function emitPaymentFailed(payload: PaymentFailedEvent): void;
export declare function onOrderCreated(listener: (e: OrderCreatedEvent) => void): void;
export declare function onOrderCancelled(listener: (e: OrderCancelledEvent) => void): void;
export declare function onOrderStatusChanged(listener: (e: OrderStatusChangedEvent) => void): void;
export declare function onPaymentSucceeded(listener: (e: PaymentSucceededEvent) => void): void;
export declare function onPaymentFailed(listener: (e: PaymentFailedEvent) => void): void;
//# sourceMappingURL=order.events.d.ts.map