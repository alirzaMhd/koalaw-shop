// src/modules/auth/auth.routes.ts
// Registers /auth endpoints

import { Router } from "express";
import { authController } from "./auth.controller";
import { authGuard } from "../../common/middlewares/authGuard";

export const authRouter = Router();

// Public
authRouter.post("/otp/send", authController.sendOtp);
authRouter.post("/otp/verify", authController.verifyOtp);
authRouter.post("/refresh", authController.refresh);

// Protected
authRouter.post("/logout", authGuard, authController.logout);
authRouter.get("/me", authGuard, authController.me);

// Export default for convenience if your routes.ts uses default imports
export default authRouter;