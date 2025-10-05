// src/modules/profile/profile.routes.ts
import { Router } from "express";
import { profileController, uploadMiddleware } from "./profile.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
export const profileRouter = Router();
profileRouter.use(authGuard); // All routes require authentication
// Profile
profileRouter.get("/", profileController.getProfile);
profileRouter.put("/", profileController.updateProfile);
profileRouter.post("/image", uploadMiddleware, profileController.uploadProfileImage);
// Orders
profileRouter.get("/orders", profileController.getOrders);
// Notifications
profileRouter.put("/notifications", profileController.updateNotificationPrefs);
// Addresses
profileRouter.get("/addresses", profileController.getAddresses);
profileRouter.post("/addresses", profileController.createAddress);
profileRouter.put("/addresses/:addressId", profileController.updateAddress);
profileRouter.delete("/addresses/:addressId", profileController.deleteAddress);
profileRouter.post("/addresses/:addressId/set-default", profileController.setDefaultAddress);
export default profileRouter;
//# sourceMappingURL=profile.routes.js.map