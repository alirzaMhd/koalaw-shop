// src/modules/checkout/checkout.routes.ts
// Registers checkout endpoints

import { Router } from "express";
import { checkoutController } from "./checkout.controller.js";
// If you want to require auth for checkout, uncomment the next line and apply to routes
import { optionalAuthGuard } from "../../common/middlewares/optionalAuthGuard.js";

export const checkoutRouter = Router();

// Quote totals for a cart (coupon/shipping/giftWrap). Auth optional.
checkoutRouter.post("/quote", optionalAuthGuard, checkoutController.quote);

// Create order from cart and initialize payment (guest checkout supported; auth optional).
checkoutRouter.post("/order", optionalAuthGuard, checkoutController.createOrderFromCart);
// Default export for routes registry convenience
export default checkoutRouter;