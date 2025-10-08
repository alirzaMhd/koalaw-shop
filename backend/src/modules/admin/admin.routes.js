// backend/src/modules/admin/admin.routes.ts
import { Router } from "express";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { adminGuard } from "../../common/middlewares/adminGuard.js";
import { adminController } from "./admin.controller.js";
const router = Router();
// Apply auth + admin guards to all routes
router.use(authGuard);
router.use(adminGuard);
// ========== DASHBOARD ==========
router.get("/dashboard", adminController.getDashboard);
// ========== PRODUCTS ==========
router.get("/products", adminController.listProducts);
router.delete("/products/:id", adminController.deleteProduct);
// ========== ORDERS ==========
router.get("/orders", adminController.listOrders);
router.patch("/orders/:id/status", adminController.updateOrderStatus);
// ========== USERS ==========
router.get("/users", adminController.listUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/tier", adminController.updateUserTier);
// ========== REVIEWS ==========
router.get("/reviews/pending", adminController.listPendingReviews);
// ========== BRANDS ==========
router.get("/brands", adminController.listBrands);
router.post("/brands", adminController.createBrand);
router.put("/brands/:id", adminController.updateBrand);
router.delete("/brands/:id", adminController.deleteBrand);
// ========== COLLECTIONS ==========
router.get("/collections", adminController.listCollections);
router.post("/collections", adminController.createCollection);
router.put("/collections/:id", adminController.updateCollection);
router.delete("/collections/:id", adminController.deleteCollection);
// ========== NEWSLETTER ==========
router.get("/newsletter/stats", adminController.getNewsletterStats);
// ========== COUPONS ==========
router.get("/coupons", adminController.listCoupons);
router.post("/coupons", adminController.createCoupon);
router.put("/coupons/:id", adminController.updateCoupon);
router.delete("/coupons/:id", adminController.deleteCoupon);
export default router;
//# sourceMappingURL=admin.routes.js.map