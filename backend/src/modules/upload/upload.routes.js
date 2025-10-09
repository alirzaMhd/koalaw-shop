// backend/src/modules/upload/upload.routes.ts
import { Router } from "express";
import { uploadController, uploadMiddleware } from "./upload.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
export const uploadRouter = Router();
// Admin-only middleware
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "احراز هویت انجام نشد.",
            code: "UNAUTHORIZED",
        });
    }
    const role = user.role?.toLowerCase();
    if (role !== "admin" && role !== "staff") {
        return res.status(403).json({
            success: false,
            message: "شما دسترسی لازم را ندارید.",
            code: "FORBIDDEN",
        });
    }
    next();
};
// Require authentication + admin for uploads
uploadRouter.post("/product-image", authGuard, requireAdmin, uploadMiddleware, uploadController.uploadProductImage);
export default uploadRouter;
//# sourceMappingURL=upload.routes.js.map