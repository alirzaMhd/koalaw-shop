// src/modules/orders/order.events.ts
// Centralized order domain events (names, payload types, and emit/on helpers).
// Use these helpers instead of string literals to avoid typos across the codebase.
import { eventBus } from "../../events/eventBus.js";
import { logger } from "../../config/logger.js";
// ---- Event names (frozen) ----
export const OrderEvent = Object.freeze({
    Created: "order.created",
    Cancelled: "order.cancelled",
    StatusChanged: "order.status.changed",
    // Payment-related (emitted by payment module or handlers)
    PaymentSucceeded: "payment.succeeded",
    PaymentFailed: "payment.failed",
});
// ---- Emit helpers ----
export function emitOrderCreated(payload) {
    eventBus.emit(OrderEvent.Created, payload);
    logger.debug({ evt: OrderEvent.Created, ...payload }, "Domain event emitted");
}
export function emitOrderCancelled(payload) {
    eventBus.emit(OrderEvent.Cancelled, payload);
    logger.debug({ evt: OrderEvent.Cancelled, ...payload }, "Domain event emitted");
}
export function emitOrderStatusChanged(payload) {
    eventBus.emit(OrderEvent.StatusChanged, payload);
    logger.debug({ evt: OrderEvent.StatusChanged, ...payload }, "Domain event emitted");
}
export function emitPaymentSucceeded(payload) {
    eventBus.emit(OrderEvent.PaymentSucceeded, payload);
    logger.debug({ evt: OrderEvent.PaymentSucceeded, ...payload }, "Domain event emitted");
}
export function emitPaymentFailed(payload) {
    eventBus.emit(OrderEvent.PaymentFailed, payload);
    logger.debug({ evt: OrderEvent.PaymentFailed, ...payload }, "Domain event emitted");
}
// ---- Typed subscription helpers (optional) ----
export function onOrderCreated(listener) {
    eventBus.on(OrderEvent.Created, listener);
}
export function onOrderCancelled(listener) {
    eventBus.on(OrderEvent.Cancelled, listener);
}
export function onOrderStatusChanged(listener) {
    eventBus.on(OrderEvent.StatusChanged, listener);
}
export function onPaymentSucceeded(listener) {
    eventBus.on(OrderEvent.PaymentSucceeded, listener);
}
export function onPaymentFailed(listener) {
    eventBus.on(OrderEvent.PaymentFailed, listener);
}
//# sourceMappingURL=order.events.js.map