// src/events/handlers/order.created.handler.ts
// Binds a handler to "order.created": reserve stock and send order confirmation.

import { eventBus, logBinding } from "../eventBus";
import { logger } from "../../config/logger";
import { inventoryService } from "../../modules/inventory/inventory.service";
import { notificationService } from "../../modules/notifications/notification.service";
import { AppError } from "../../common/errors/AppError";

// Keep from binding twice if called multiple times
let BOUND = false;

export function bindOrderCreatedHandler() {
  if (BOUND) return;
  BOUND = true;

  eventBus.on("order.created", async (evt: any) => {
    const { orderId, orderNumber } = evt || {};
    if (!orderId) {
      logger.warn({ evt }, "order.created received without orderId");
      return;
    }

    // 1) Reserve inventory (all-or-nothing). If it fails, log and continue (manual intervention may be needed).
    try {
      const res = await inventoryService.reserveForOrder(orderId);
      if (res.failures.length > 0) {
        logger.warn(
          { orderId, failures: res.failures },
          "Inventory reservation had failures on order.created"
        );
      } else {
        logger.info({ orderId, reserved: res.reserved.length }, "Inventory reserved for order");
      }
    } catch (e: any) {
      const code = e?.code || e?.name || "RESERVE_ERROR";
      logger.error({ err: e, orderId, code }, "Failed to reserve inventory on order.created");
      // You may implement compensations here (e.g., flag order for manual review).
    }

    // 2) Send order confirmation email (best-effort)
    try {
      await notificationService.sendOrderConfirmation(orderId);
    } catch (e) {
      logger.warn({ err: e, orderId }, "Failed to send order confirmation email");
    }
  });

  logBinding("order.created", "reserve+confirm");
  logger.info("Order created handler bound.");
}

export default bindOrderCreatedHandler;