// backend/src/modules/admin/admin.routes.ts
import { Router } from "express";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { adminGuard } from "../../common/middlewares/adminGuard.js";
import { adminController } from "./admin.controller.js";
import { badgeController } from "./badge.controller.js";
import { colorThemeController } from "./colorTheme.controller.js";

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
router.get("/users/:id", adminController.getUser);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/tier", adminController.updateUserTier);
router.delete("/users/:id", adminController.deleteUser);

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

// ========== BADGES ========== ✅ NEW
router.get("/badges", badgeController.listBadges);
router.post("/badges", badgeController.createBadge);
router.put("/badges/:id", badgeController.updateBadge);
router.delete("/badges/:id", badgeController.deleteBadge);

// ========== NEWSLETTER ==========
router.get("/newsletter/stats", adminController.getNewsletterStats);
router.get("/newsletter/subscribers", adminController.listNewsletterSubscribers); // ✅ NEW

// ========== COUPONS ==========
router.get("/coupons", adminController.listCoupons);
router.post("/coupons", adminController.createCoupon);
router.put("/coupons/:id", adminController.updateCoupon);
router.delete("/coupons/:id", adminController.deleteCoupon);

// ========== CATEGORIES (DB-backed) ==========
router.get("/categories", adminController.listCategories);
router.post("/categories", adminController.createCategory);
router.put("/categories/:id", adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);


// ========== COLOR THEMES ==========
router.get("/color-themes", colorThemeController.list);
router.post("/color-themes", colorThemeController.create);
router.put("/color-themes/:id", colorThemeController.update);
router.delete("/color-themes/:id", colorThemeController.delete);

export default router;