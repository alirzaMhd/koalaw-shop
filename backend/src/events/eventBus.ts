// src/events/eventBus.ts
// Lightweight app-wide event bus with Node's EventEmitter.
// Usage: eventBus.on("order.created", (payload) => { ... });
//        eventBus.emit("order.created", { orderId, ... });

import { EventEmitter } from "events";
import { logger } from "../config/logger.js";

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Avoid MaxListeners warnings in larger apps
    this.setMaxListeners(200);
  }

  // Optional: safe emit with logging
  emit(eventName: string | symbol, ...args: any[]): boolean {
    try {
      return super.emit(eventName, ...args);
    } catch (err) {
      logger.error({ err, eventName }, "Event emit failed");
      return false;
    }
  }
}

export const eventBus = new EventBus();

// Small helper to log bindings (optional)
export function logBinding(eventName: string, label?: string) {
  logger.debug({ eventName, handler: label || "anonymous" }, "Event handler bound");
}

export default eventBus;