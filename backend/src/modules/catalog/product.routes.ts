// src/modules/catalog/product.routes.ts
// Registers product endpoints

import { Router, Request, Response, NextFunction } from "express";
import { productController } from "./product.controller";
import { authGuard } from "../../common/middlewares/authGuard";
import { AppError } from "../../common/errors/AppError";

export const productRouter = Router();

// Optional simple role guard (adjust to your roles)
// If you already have a reusable roleGuard, replace this with that import.
interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}
const requireAdmin = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "admin" || role === "manager") return next();
  return next(new AppError("دسترسی غیرمجاز.", 403, "FORBIDDEN"));
};

// Public endpoints
productRouter.get("/", productController.list);
productRouter.get("/:id", productController.getById);
productRouter.get("/slug/:slug", productController.getBySlug);

// Protected (admin) endpoints
productRouter.post("/", authGuard, requireAdmin, productController.create);
productRouter.patch("/:id", authGuard, requireAdmin, productController.update);

// Images
productRouter.post("/:id/images", authGuard, requireAdmin, productController.addImage);
productRouter.patch("/:id/images/:imageId", authGuard, requireAdmin, productController.updateImage);
productRouter.delete("/:id/images/:imageId", authGuard, requireAdmin, productController.deleteImage);

// Variants
productRouter.post("/:id/variants", authGuard, requireAdmin, productController.addVariant);
productRouter.patch("/:id/variants/:variantId", authGuard, requireAdmin, productController.updateVariant);
productRouter.delete("/:id/variants/:variantId", authGuard, requireAdmin, productController.deleteVariant);

// Default export for router registration convenience
export default productRouter;