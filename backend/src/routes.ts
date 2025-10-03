// src/routes.ts
// Central router registration. Mounts module routers under /api/* and adds healthz.

import { Router } from "express";

// Module routers
import authRouter from "./modules/auth/auth.routes.js";
import userRouter from "./modules/users/user.routes.js";
import productRouter from "./modules/catalog/product.routes.js";
import inventoryRouter from "./modules/inventory/inventory.routes.js";
import cartRouter from "./modules/cart/cart.routes.js";
import checkoutRouter from "./modules/checkout/checkout.routes.js";
import orderRouter from "./modules/orders/order.routes.js";
import paymentRouter from "./modules/payments/payment.routes.js";
import shippingRouter from "./modules/shipping/shipping.routes.js";
import reviewRouter from "./modules/reviews/review.routes.js";
import notificationRouter from "./modules/notifications/notification.routes.js";
import searchRouter from "./modules/search/search.routes.js";
import magazineRoutes from "./modules/magazine/magazine.routes.js";
import profileRoutes from "./modules/profile/profile.routes.js";

export function buildApiRouter() {
  const api = Router();

  // Health
  api.get("/healthz", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  // Feature routers
  api.use("/auth", authRouter);
  api.use("/users", userRouter);
  api.use("/products", productRouter);
  api.use("/inventory", inventoryRouter);
  api.use("/carts", cartRouter);
  api.use("/checkout", checkoutRouter);
  api.use("/orders", orderRouter);
  api.use("/payments", paymentRouter);
  api.use("/shipping", shippingRouter);
  api.use("/reviews", reviewRouter);
  api.use("/notifications", notificationRouter);
  api.use("/search", searchRouter); // <-- added
  api.use('/magazine', magazineRoutes);
  api.use('/profile', profileRoutes);

  return api;
}

export default buildApiRouter;