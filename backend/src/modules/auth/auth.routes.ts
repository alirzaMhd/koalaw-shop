// src/modules/auth/auth.routes.ts
import { Router } from "express";
import { authController } from "./auth.controller";
import { authGuard } from "../../common/middlewares/authGuard";

export const authRouter = Router();

// Public
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/verify-email", authController.verifyEmail);
authRouter.post("/resend-verification", authController.resendVerification);

// NEW:
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);

authRouter.post("/refresh", authController.refresh);

// Protected
authRouter.post("/logout", authGuard, authController.logout);
authRouter.get("/me", authGuard, authController.me);

export default authRouter;