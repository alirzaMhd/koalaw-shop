import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "../../common/errors/AppError.js";
// Configure multer for product images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        cb(null, `product-${timestamp}-${randomString}${ext}`);
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
export const uploadMiddleware = upload.single("image");
class UploadController {
    uploadProductImage = async (req, res, next) => {
        try {
            const file = req.file;
            if (!file) {
                throw new AppError("فایل تصویر الزامی است.", 400, "FILE_REQUIRED");
            }
            const imageUrl = `/static/uploads/products/${file.filename}`;
            return res.status(200).json({
                success: true,
                data: {
                    imageUrl,
                    filename: file.filename,
                    size: file.size,
                },
            });
        }
        catch (error) {
            return next(error);
        }
    };
}
export const uploadController = new UploadController();
//# sourceMappingURL=upload.controller.js.map