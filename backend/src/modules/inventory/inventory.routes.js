// src/modules/inventory/inventory.routes.ts
// Registers inventory endpoints
import { Router } from "express";
import { inventoryController } from "./inventory.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { AppError } from "../../common/errors/AppError.js";
export const inventoryRouter = Router();
const requireAdmin = (req, _res, next) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "admin" || role === "manager") return next();
  return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};
// Admin-only stock management
inventoryRouter.get(
  "/variants/:variantId/stock",
  authGuard,
  requireAdmin,
  inventoryController.getStock
);
inventoryRouter.patch(
  "/variants/:variantId/stock",
  authGuard,
  requireAdmin,
  inventoryController.setStock
);
inventoryRouter.patch(
  "/variants/:variantId/adjust",
  authGuard,
  requireAdmin,
  inventoryController.adjustStock
);
// Admin/internal batch ops
inventoryRouter.post(
  "/reserve",
  authGuard,
  requireAdmin,
  inventoryController.reserve
);
inventoryRouter.post(
  "/release",
  authGuard,
  requireAdmin,
  inventoryController.release
);
// Cart-oriented (authenticated)
inventoryRouter.get(
  "/carts/:cartId/verify",
  authGuard,
  inventoryController.verifyCart
);
inventoryRouter.post(
  "/carts/:cartId/reserve",
  authGuard,
  inventoryController.reserveCart
);
// Order-oriented (admin/internal)
inventoryRouter.post(
  "/orders/:orderId/reserve",
  authGuard,
  requireAdmin,
  inventoryController.reserveOrder
);
inventoryRouter.post(
  "/orders/:orderId/release",
  authGuard,
  requireAdmin,
  inventoryController.releaseOrder
);
// Default export for router registration convenience
export default inventoryRouter;
//# sourceMappingURL=inventory.routes.js.map
