// src/modules/users/user.routes.ts
// Registers /users endpoints (profile, preferences, addresses, summary)
import { Router } from "express";
import { userController } from "./user.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
export const userRouter = Router();
// All routes under /users require authentication
userRouter.use(authGuard);
// Profile
userRouter.get("/me", userController.getMe);
userRouter.patch("/me", userController.updateMe);
// Notification preferences
userRouter.get("/me/preferences", userController.getNotificationPrefs);
userRouter.patch("/me/preferences", userController.updateNotificationPrefs);
// Addresses
userRouter.get("/me/addresses", userController.listAddresses);
userRouter.post("/me/addresses", userController.createAddress);
userRouter.patch("/me/addresses/:id", userController.updateAddress);
userRouter.delete("/me/addresses/:id", userController.deleteAddress);
userRouter.post("/me/addresses/:id/default", userController.setDefaultAddress);
// Dashboard-style summary
userRouter.get("/me/summary", userController.getSummary);
// Default export for routes registry convenience
export default userRouter;
//# sourceMappingURL=user.routes.js.map