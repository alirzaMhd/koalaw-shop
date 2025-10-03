// src/modules/profile/profile.controller.ts
import type { Request, RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { profileService } from "./profile.service.js";
import {
  updateProfileSchema,
  updateNotificationPrefsSchema,
  createAddressSchema,
  updateAddressSchema,
} from "./profile.validators";
import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../infrastructure/db/prismaClient.js"; // NEW

interface AuthenticatedRequest extends Request {
  user?: { id?: string; sub?: string; role?: string };
}

function ok(res: any, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to backend/public/uploads/profiles
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    cb(null, `profile-${userId}-${timestamp}-${randomString}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("فقط فایل‌های تصویری (JPG, PNG, GIF, WEBP) مجاز هستند"));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// Export upload middleware
export const uploadMiddleware = upload.single("image");

class ProfileController {
  getProfile: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const profile = await profileService.getProfile(String(userId));
      return ok(res, { profile }, 200);
    } catch (err) {
      return next(err);
    }
  };

  getOrders: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const status = req.query.status as string | undefined;
      const orders = await profileService.getOrders(String(userId), status);
      return ok(res, { orders }, 200);
    } catch (err) {
      return next(err);
    }
  };

  updateProfile: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const data = await updateProfileSchema.parseAsync(req.body);
      const profile = await profileService.updateProfile(String(userId), data);
      return ok(res, { profile }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      return next(err);
    }
  };

  updateNotificationPrefs: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const prefs = await updateNotificationPrefsSchema.parseAsync(req.body);
      const updated = await profileService.updateNotificationPrefs(String(userId), prefs);
      return ok(res, { notificationPrefs: updated }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      return next(err);
    }
  };

  uploadProfileImage: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const file = (req as any).file as Express.Multer.File | undefined;

      // If no file uploaded, return default koala message
      if (!file) {
        return ok(
          res,
          {
            message: "در حال حاضر تصویر پیش‌فرض کوالای کوچولو برای شما تنظیم شده است! 🐨💕",
            profileImage: "/assets/images/profile.png",
          },
          200
        );
      }

      // Generate URL for uploaded image (served via /static -> public)
      const imageUrl = `/static/uploads/profiles/${file.filename}`;

      // Persist image URL to database
      await prisma.user.update({
        where: { id: String(userId) },
        data: { profileImageUrl: imageUrl },
      });

      return ok(
        res,
        {
          message: "تصویر پروفایل با موفقیت آپلود شد! 🐨💕",
          profileImage: imageUrl,
        },
        200
      );
    } catch (err) {
      return next(err);
    }
  };

  getAddresses: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const addresses = await profileService.getAddresses(String(userId));
      return ok(res, { addresses }, 200);
    } catch (err) {
      return next(err);
    }
  };

  createAddress: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const data = await createAddressSchema.parseAsync(req.body);
      const address = await profileService.createAddress(String(userId), data);
      return ok(res, { address }, 201);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      return next(err);
    }
  };

  updateAddress: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const addressId = req.params.addressId;
      if (!addressId) {
        throw new AppError("شناسه آدرس الزامی است.", 400, "MISSING_ADDRESS_ID");
      }

      const data = await updateAddressSchema.parseAsync(req.body);
      const address = await profileService.updateAddress(String(userId), addressId, data);
      return ok(res, { address }, 200);
    } catch (err: any) {
      if (err?.issues?.length) {
        return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
      }
      return next(err);
    }
  };

  deleteAddress: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const addressId = req.params.addressId;
      if (!addressId) {
        throw new AppError("شناسه آدرس الزامی است.", 400, "MISSING_ADDRESS_ID");
      }

      const result = await profileService.deleteAddress(String(userId), addressId);
      return ok(res, result, 200);
    } catch (err) {
      return next(err);
    }
  };

  setDefaultAddress: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");

      const addressId = req.params.addressId;
      if (!addressId) {
        throw new AppError("شناسه آدرس الزامی است.", 400, "MISSING_ADDRESS_ID");
      }

      const result = await profileService.setDefaultAddress(String(userId), addressId);
      return ok(res, result, 200);
    } catch (err) {
      return next(err);
    }
  };
}

export const profileController = new ProfileController();