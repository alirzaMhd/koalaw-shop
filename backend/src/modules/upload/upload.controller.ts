// backend/src/modules/upload/upload.controller.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { AppError } from "../../common/errors/AppError.js";
import { logger } from "../../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // From backend/src/modules/upload/ -> go up to backend/
    // __dirname is: backend/dist/modules/upload (production) or backend/src/modules/upload (dev)
    
    // Go up to backend root, then into public/uploads/products
    const backendRoot = path.resolve(__dirname, "..", "..", "..", ".."); // up from dist/modules/upload/ or src/modules/upload/
    const uploadDir = path.join(backendRoot, "public", "uploads", "products");
    
    // Log for debugging
    logger.info({
      __dirname,
      backendRoot,
      uploadDir,
    }, "Upload directory resolved");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.info({ uploadDir }, "Created upload directory");
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `product-${timestamp}-${randomString}${ext}`;
    
    logger.info({ filename, originalName: file.originalname }, "Generating filename");
    
    cb(null, filename);
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

export const uploadMiddleware = upload.single("image");

class UploadController {
  uploadProductImage: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info({
        user: (req as any).user?.id,
        role: (req as any).user?.role,
      }, "Product image upload request");

      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) {
        throw new AppError("فایل تصویر الزامی است.", 400, "FILE_REQUIRED");
      }

      // Return URL that matches app.use("/static", express.static(backendPublic))
      const imageUrl = `/static/uploads/products/${file.filename}`;
      
      logger.info({ 
        filename: file.filename,
        path: file.path,
        url: imageUrl,
        size: file.size,
      }, "Product image uploaded successfully");

      return res.status(200).json({
        success: true,
        data: {
          imageUrl,
          filename: file.filename,
          size: file.size,
        },
      });
    } catch (error) {
      logger.error({ error }, "Product image upload failed");
      return next(error);
    }
  };
}

export const uploadController = new UploadController();