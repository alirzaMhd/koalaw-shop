import multer from "multer";
import path from "path";
import fs from "fs";
import { profileService } from "./profile.service.js";
import { updateProfileSchema, updateNotificationPrefsSchema, createAddressSchema, updateAddressSchema, } from "./profile.validators.js";
import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../infrastructure/db/prismaClient.js"; // NEW
function ok(res, data, status = 200) {
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
        const userId = req.user?.id || req.user?.sub;
        const ext = path.extname(file.originalname).toLowerCase();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        cb(null, `profile-${userId}-${timestamp}-${randomString}${ext}`);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    }
    else {
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
    getProfile = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const profile = await profileService.getProfile(String(userId));
            return ok(res, { profile }, 200);
        }
        catch (err) {
            return next(err);
        }
    };
    getOrders = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const status = req.query.status;
            const orders = await profileService.getOrders(String(userId), status);
            return ok(res, { orders }, 200);
        }
        catch (err) {
            return next(err);
        }
    };
    updateProfile = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const parsed = await updateProfileSchema.parseAsync(req.body);
            // Normalize nullable fields (convert null/empty string -> undefined) so they match service signature
            const sanitized = {
                ...parsed,
                phone: parsed.phone ?? undefined,
                birthDate: parsed.birthDate === "" || parsed.birthDate === null
                    ? undefined
                    : parsed.birthDate,
            };
            const profile = await profileService.updateProfile(String(userId), sanitized);
            return ok(res, { profile }, 200);
        }
        catch (err) {
            if (err?.issues?.length) {
                return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
            }
            return next(err);
        }
    };
    updateNotificationPrefs = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const prefs = await updateNotificationPrefsSchema.parseAsync(req.body);
            const updated = await profileService.updateNotificationPrefs(String(userId), prefs);
            return ok(res, { notificationPrefs: updated }, 200);
        }
        catch (err) {
            if (err?.issues?.length) {
                return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
            }
            return next(err);
        }
    };
    uploadProfileImage = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const file = req.file;
            // If no file uploaded, return default koala message
            if (!file) {
                return ok(res, {
                    message: "در حال حاضر تصویر پیش‌فرض کوالای کوچولو برای شما تنظیم شده است! 🐨💕",
                    profileImage: "/assets/images/profile.png",
                }, 200);
            }
            // Generate URL for uploaded image (served via /static -> public)
            const imageUrl = `/static/uploads/profiles/${file.filename}`;
            // Persist image URL to database
            await prisma.user.update({
                where: { id: String(userId) },
                data: { profileImageUrl: imageUrl },
            });
            return ok(res, {
                message: "تصویر پروفایل با موفقیت آپلود شد! 🐨💕",
                profileImage: imageUrl,
            }, 200);
        }
        catch (err) {
            return next(err);
        }
    };
    getAddresses = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const addresses = await profileService.getAddresses(String(userId));
            return ok(res, { addresses }, 200);
        }
        catch (err) {
            return next(err);
        }
    };
    createAddress = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const data = await createAddressSchema.parseAsync(req.body);
            // Normalize nullable fields (e.g. label, postalCode, addressLine2, country may be null)
            // to match service signature expecting string | undefined
            const sanitized = {
                ...data,
                label: data.label ?? undefined,
                postalCode: data.postalCode ?? undefined,
                addressLine2: data.addressLine2 ?? undefined,
                country: data.country ?? undefined,
            };
            const address = await profileService.createAddress(String(userId), sanitized);
            return ok(res, { address }, 201);
        }
        catch (err) {
            if (err?.issues?.length) {
                return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
            }
            return next(err);
        }
    };
    updateAddress = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const addressId = req.params.addressId;
            if (!addressId) {
                throw new AppError("شناسه آدرس الزامی است.", 400, "MISSING_ADDRESS_ID");
            }
            const data = await updateAddressSchema.parseAsync(req.body);
            // Normalize nullable fields (e.g. label, postalCode, addressLine2) to undefined
            // so they match the service signature which does not accept null.
            const sanitized = {
                ...data,
                label: data.label ?? undefined,
                postalCode: data.postalCode ?? undefined,
                addressLine2: data.addressLine2 ?? undefined,
            };
            const address = await profileService.updateAddress(String(userId), addressId, sanitized);
            return ok(res, { address }, 200);
        }
        catch (err) {
            if (err?.issues?.length) {
                return next(new AppError(err.issues[0].message, 422, "VALIDATION_ERROR"));
            }
            return next(err);
        }
    };
    deleteAddress = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const addressId = req.params.addressId;
            if (!addressId) {
                throw new AppError("شناسه آدرس الزامی است.", 400, "MISSING_ADDRESS_ID");
            }
            const result = await profileService.deleteAddress(String(userId), addressId);
            return ok(res, result, 200);
        }
        catch (err) {
            return next(err);
        }
    };
    setDefaultAddress = async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?.sub;
            if (!userId)
                throw new AppError("احراز هویت انجام نشد.", 401, "UNAUTHORIZED");
            const addressId = req.params.addressId;
            if (!addressId) {
                throw new AppError("شناسه آدرس الزامی است.", 400, "MISSING_ADDRESS_ID");
            }
            const result = await profileService.setDefaultAddress(String(userId), addressId);
            return ok(res, result, 200);
        }
        catch (err) {
            return next(err);
        }
    };
}
export const profileController = new ProfileController();
//# sourceMappingURL=profile.controller.js.map