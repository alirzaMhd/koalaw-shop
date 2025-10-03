// src/events/handlers/payment.succeeded.handler.ts
// Binds a handler to "payment.succeeded": trigger fulfillment (e.g., create shipping label stub)
// and optionally send payment receipt (if not already handled elsewhere).
import { eventBus, logBinding } from "../eventBus.js";
import { logger } from "../../config/logger.js";
import { shippingService } from "../../modules/shipping/shipping.service.js";
import { notificationService } from "../../modules/notifications/notification.service.js";
let BOUND = false;
export function bindPaymentSucceededHandler() {
    if (BOUND)
        return;
    BOUND = true;
    eventBus.on("payment.succeeded", async (evt) => {
        const { orderId, paymentId, method } = evt || {};
        if (!orderId || !paymentId) {
            logger.warn({ evt }, "payment.succeeded received without orderId/paymentId");
            return;
        }
        // 1) Kick off basic fulfillment step: create a shipment label (stub)
        try {
            const label = await shippingService.createShipmentLabel(orderId, "local-post");
            logger.info({ orderId, trackingNumber: label.trackingNumber }, "Shipment label created after payment");
        }
        catch (e) {
            logger.warn({ err: e, orderId }, "Failed to create shipment label after payment");
        }
        // 2) Send payment receipt (best-effort). If your notification service is already bound
        // via notificationService.bindDefaultHandlers(), this may duplicate. Keep or remove as needed.
        try {
            await notificationService.sendPaymentReceipt(orderId, paymentId);
        }
        catch (e) {
            logger.warn({ err: e, orderId, paymentId }, "Failed to send payment receipt email");
        }
    });
    logBinding("payment.succeeded", "fulfillment+receipt");
    logger.info("Payment succeeded handler bound.");
}
export default bindPaymentSucceededHandler;
//# sourceMappingURL=payment.succeeded.handler.js.map