// src/routes.ts
// Central router registration. Mounts module routers under /api/* and adds healthz.

import { Router } from "express";

// Module routers
import authRouter from "./modules/auth/auth.routes";
import userRouter from "./modules/users/user.routes";
import productRouter from "./modules/catalog/product.routes";
import inventoryRouter from "./modules/inventory/inventory.routes";
import cartRouter from "./modules/cart/cart.routes";
import checkoutRouter from "./modules/checkout/checkout.routes";
import orderRouter from "./modules/orders/order.routes";
import paymentRouter from "./modules/payments/payment.routes";
import shippingRouter from "./modules/shipping/shipping.routes";
import reviewRouter from "./modules/reviews/review.routes";
import notificationRouter from "./modules/notifications/notification.routes";
import searchRouter from "./modules/search/search.routes";
import magazineRoutes from "./modules/magazine/magazine.routes";
import profileRoutes from "./modules/profile/profile.routes";

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