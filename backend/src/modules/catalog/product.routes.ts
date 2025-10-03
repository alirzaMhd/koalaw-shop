// src/modules/catalog/product.routes.ts
// Registers product endpoints

import { Router, type Request, type Response, type NextFunction } from "express";
import { productController } from "./product.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { AppError } from "../../common/errors/AppError.js";

export const productRouter = Router();

// API responses should not be cached
productRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Optional simple role guard (adjust to your roles)
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
productRouter.get("/filters", productController.filters); // NEW

// Reviews (public)
productRouter.get("/slug/:slug/reviews", productController.listReviewsBySlug);
productRouter.post("/slug/:slug/reviews", productController.addReviewBySlug);
productRouter.get("/:id/reviews", productController.listReviewsById);
productRouter.post("/:id/reviews", productController.addReviewById);

// Product detail
productRouter.get("/slug/:slug", productController.getBySlug);
productRouter.get("/:id", productController.getById);

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

export default productRouter;