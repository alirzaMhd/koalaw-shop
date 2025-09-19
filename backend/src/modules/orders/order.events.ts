// src/modules/orders/order.events.ts
// Centralized order domain events (names, payload types, and emit/on helpers).
// Use these helpers instead of string literals to avoid typos across the codebase.

import { eventBus } from "../../events/eventBus";
import { logger } from "../../config/logger";

// ---- Event names (frozen) ----
export const OrderEvent = Object.freeze({
  Created: "order.created",
  Cancelled: "order.cancelled",
  StatusChanged: "order.status.changed",
  // Payment-related (emitted by payment module or handlers)
  PaymentSucceeded: "payment.succeeded",
  PaymentFailed: "payment.failed",
} as const);

export type OrderEventName = (typeof OrderEvent)[keyof typeof OrderEvent];

// ---- Shared types ----
export type ShippingMethod = "standard" | "express";
export type PaymentMethod = "gateway" | "cod";

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  giftWrap: number;
  total: number;
  currency: string; // note: matches checkout.service emit shape
}

// ---- Event payloads ----
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
  from: string; // prev status (see order_status_enum)
  to: string;   // new status
  at?: string;  // ISO timestamp
}

export interface PaymentSucceededEvent {
  orderId: string;
  paymentId: string;
  method: PaymentMethod;
  amount: number;
  currencyCode: string;
  authority?: string | null;       // external payment id/authority
  transactionRef?: string | null;  // PSP/bank reference
}

export interface PaymentFailedEvent {
  orderId: string;
  paymentId: string;
  method: PaymentMethod;
  amount: number;
  currencyCode: string;
  reason?: string | null;
}

// ---- Emit helpers ----
export function emitOrderCreated(payload: OrderCreatedEvent) {
  eventBus.emit(OrderEvent.Created, payload);
  logger.debug({ evt: OrderEvent.Created, ...payload }, "Domain event emitted");
}

export function emitOrderCancelled(payload: OrderCancelledEvent) {
  eventBus.emit(OrderEvent.Cancelled, payload);
  logger.debug({ evt: OrderEvent.Cancelled, ...payload }, "Domain event emitted");
}

export function emitOrderStatusChanged(payload: OrderStatusChangedEvent) {
  eventBus.emit(OrderEvent.StatusChanged, payload);
  logger.debug({ evt: OrderEvent.StatusChanged, ...payload }, "Domain event emitted");
}

export function emitPaymentSucceeded(payload: PaymentSucceededEvent) {
  eventBus.emit(OrderEvent.PaymentSucceeded, payload);
  logger.debug({ evt: OrderEvent.PaymentSucceeded, ...payload }, "Domain event emitted");
}

export function emitPaymentFailed(payload: PaymentFailedEvent) {
  eventBus.emit(OrderEvent.PaymentFailed, payload);
  logger.debug({ evt: OrderEvent.PaymentFailed, ...payload }, "Domain event emitted");
}

// ---- Typed subscription helpers (optional) ----
export function onOrderCreated(listener: (e: OrderCreatedEvent) => void) {
  eventBus.on(OrderEvent.Created, listener);
}
export function onOrderCancelled(listener: (e: OrderCancelledEvent) => void) {
  eventBus.on(OrderEvent.Cancelled, listener);
}
export function onOrderStatusChanged(listener: (e: OrderStatusChangedEvent) => void) {
  eventBus.on(OrderEvent.StatusChanged, listener);
}
export function onPaymentSucceeded(listener: (e: PaymentSucceededEvent) => void) {
  eventBus.on(OrderEvent.PaymentSucceeded, listener);
}
export function onPaymentFailed(listener: (e: PaymentFailedEvent) => void) {
  eventBus.on(OrderEvent.PaymentFailed, listener);
}