// src/modules/catalog/product.validators.ts
// Product validation schemas using Zod

import { z } from "zod";

// Common schemas
const currencyCodeSchema = z.enum(["IRR", "USD", "EUR"]).default("IRR");

const positionSchema = z.number().int().min(0).optional();

// Helper: URL that accepts empty string, null, undefined and converts them to undefined
// Only validates if the value is a non-empty string
// Helper: URL that accepts both absolute URLs and relative paths
const optionalUrlSchema = z
  .string()
  .transform((val) => {
    if (!val || val.trim() === "") return undefined;
    return val.trim();
  })
  .refine(
    (val) => {
      if (val === undefined) return true;
      
      // Allow relative paths that start with /
      if (val.startsWith("/")) return true;
      
      // Allow absolute URLs
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "آدرس URL یا مسیر تصویر معتبر نیست" }
  )
  .optional()
  .nullable();

const imageInputSchema = z.object({
  url: z.string().url("آدرس تصویر معتبر نیست"),
  alt: z.string().max(255, "متن جایگزین تصویر حداکثر ۲۵۵ کاراکتر").optional(),
  position: positionSchema,
});

const variantInputSchema = z.object({
  variantName: z.string().min(1, "نام واریانت الزامی است").max(100, "نام واریانت حداکثر ۱۰۰ کاراکتر"),
  sku: z.string().max(50, "کد SKU حداکثر ۵۰ کاراکتر").optional(),
  price: z.number().min(0, "قیمت نمی‌تواند منفی باشد").optional(),
  currencyCode: currencyCodeSchema,
  stock: z.number().int().min(0, "موجودی نمی‌تواند منفی باشد").default(0),
  colorName: z.string().max(50, "نام رنگ حداکثر ۵۰ کاراکتر").optional(),
  colorHexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "کد رنگ باید به فرمت hex باشد").optional(),
  isActive: z.boolean().default(true),
  position: positionSchema,
});

// List products query schema
export const listProductsQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  
  // Sorting
  sort: z.enum(["newest", "popular", "price-asc", "price-desc"]).optional(),
  
  // Include relations
  includeImages: z.coerce.boolean().default(false),
  includeVariants: z.coerce.boolean().default(false),
  
  // Filters
  search: z.string().max(100).optional(),
  categories: z.array(z.string()).optional(),
  brandIds: z.array(z.string()).optional(),
  brandSlugs: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  collectionSlugs: z.array(z.string()).optional(),
  colorThemeIds: z.array(z.string()).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  specialOnly: z.coerce.boolean().optional(),
  featuredOnly: z.coerce.boolean().optional(),
  bestsellerOnly: z.coerce.boolean().optional(),
  activeOnly: z.coerce.boolean().optional(),
});

// Create product schema
export const createProductInputSchema = z.object({
  // Brand (one of brandId or brandSlug required)
  brandId: z.string().uuid("شناسه برند معتبر نیست").optional(),
  brandSlug: z.string().optional(),
  
  // Relations
  colorThemeId: z.string().uuid("شناسه تم رنگ معتبر نیست").optional(),
  collectionId: z.string().uuid("شناسه کالکشن معتبر نیست").optional(),
  
  // Core fields
  category: z.string().min(1, "دسته‌بندی الزامی است").max(50),
  title: z.string().min(1, "عنوان محصول الزامی است").max(200),
  subtitle: z.string().max(200).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک، اعداد و خط تیره").optional(),
  description: z.string().max(5000).optional(),
  ingredients: z.string().max(2000).optional(),
  howToUse: z.string().max(2000).optional(),
  
  // Pricing
  price: z.number().min(0, "قیمت نمی‌تواند منفی باشد"),
  compareAtPrice: z.number().min(0).optional(),
  currencyCode: currencyCodeSchema,
  
  // Flags
  isBestseller: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isSpecialProduct: z.boolean().default(false),
  isActive: z.boolean().default(true),
  
  // Media - use the helper schema
  heroImageUrl: optionalUrlSchema,
  
  // Internal
  internalNotes: z.string().max(2000).optional(),
  
  // Child resources
  images: z.array(imageInputSchema).max(20, "حداکثر ۲۰ تصویر مجاز است").optional(),
  variants: z.array(variantInputSchema).max(50, "حداکثر ۵۰ واریانت مجاز است").optional(),
}).refine(
  (data) => data.brandId || data.brandSlug,
  { message: "شناسه یا اسلاگ برند الزامی است", path: ["brandId"] }
);

// Update product schema (all fields optional)
export const updateProductInputSchema = z.object({
  // Brand
  brandId: z.string().uuid("شناسه برند معتبر نیست").optional(),
  brandSlug: z.string().optional(),
  
  // Relations
  colorThemeId: z.string().uuid("شناسه تم رنگ معتبر نیست").optional(),
  collectionId: z.string().uuid("شناسه کالکشن معتبر نیست").optional(),
  
  // Core fields
  category: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(200).nullable().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک، اعداد و خط تیره").optional(),
  description: z.string().max(5000).nullable().optional(),
  ingredients: z.string().max(2000).nullable().optional(),
  howToUse: z.string().max(2000).nullable().optional(),
  
  // Pricing
  price: z.number().min(0, "قیمت نمی‌تواند منفی باشد").optional(),
  compareAtPrice: z.number().min(0).nullable().optional(),
  currencyCode: currencyCodeSchema.optional(),
  
  // Flags
  isBestseller: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isSpecialProduct: z.boolean().optional(),
  isActive: z.boolean().optional(),
  
  // Media - use the helper schema
  heroImageUrl: optionalUrlSchema,
  
  // Internal
  internalNotes: z.string().max(2000).nullable().optional(),
  
  // Child resources (if provided, replaces entire set)
  images: z.array(imageInputSchema).max(20, "حداکثر ۲۰ تصویر مجاز است").optional(),
  variants: z.array(variantInputSchema).max(50, "حداکثر ۵۰ واریانت مجاز است").optional(),
});

// Image schemas
export const addImageInputSchema = z.object({
  url: z.string().url("آدرس تصویر معتبر نیست"),
  alt: z.string().max(255, "متن جایگزین تصویر حداکثر ۲۵۵ کاراکتر").optional(),
  position: positionSchema.default(0),
});

export const updateImageInputSchema = z.object({
  url: z.string().url("آدرس تصویر معتبر نیست").optional(),
  alt: z.string().max(255, "متن جایگزین تصویر حداکثر ۲۵۵ کاراکتر").nullable().optional(),
  position: positionSchema,
});

// Variant schemas
export const addVariantInputSchema = z.object({
  variantName: z.string().min(1, "نام واریانت الزامی است").max(100, "نام واریانت حداکثر ۱۰۰ کاراکتر"),
  sku: z.string().max(50, "کد SKU حداکثر ۵۰ کاراکتر").optional(),
  price: z.number().min(0, "قیمت نمی‌تواند منفی باشد").optional(),
  currencyCode: currencyCodeSchema,
  stock: z.number().int().min(0, "موجودی نمی‌تواند منفی باشد").default(0),
  colorName: z.string().max(50, "نام رنگ حداکثر ۵۰ کاراکتر").optional(),
  colorHexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "کد رنگ باید به فرمت hex باشد").optional(),
  isActive: z.boolean().default(true),
  position: positionSchema.default(0),
});

export const updateVariantInputSchema = z.object({
  variantName: z.string().min(1).max(100).optional(),
  sku: z.string().max(50).nullable().optional(),
  price: z.number().min(0, "قیمت نمی‌تواند منفی باشد").nullable().optional(),
  currencyCode: currencyCodeSchema.optional(),
  stock: z.number().int().min(0, "موجودی نمی‌تواند منفی باشد").optional(),
  colorName: z.string().max(50).nullable().optional(),
  colorHexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "کد رنگ باید به فرمت hex باشد").nullable().optional(),
  isActive: z.boolean().optional(),
  position: positionSchema,
});

// Reviews
export const addReviewInputSchema = z.object({
  rating: z.coerce.number().int().min(1, "حداقل امتیاز ۱ است").max(5, "حداکثر امتیاز ۵ است"),
  title: z.string().max(200).optional(),
  body: z.string().min(5, "متن نظر بسیار کوتاه است").max(2000, "حداکثر ۲۰۰۰ کاراکتر"),
  guestName: z.string().max(100).optional(),
});

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type AddImageInput = z.infer<typeof addImageInputSchema>;
export type UpdateImageInput = z.infer<typeof updateImageInputSchema>;
export type AddVariantInput = z.infer<typeof addVariantInputSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantInputSchema>;
export type AddReviewInput = z.infer<typeof addReviewInputSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;

// Validation middleware factory
export const validateProductInput = {
  list: (data: unknown) => listProductsQuerySchema.parse(data),
  create: (data: unknown) => createProductInputSchema.parse(data),
  update: (data: unknown) => updateProductInputSchema.parse(data),
  addImage: (data: unknown) => addImageInputSchema.parse(data),
  updateImage: (data: unknown) => updateImageInputSchema.parse(data),
  addVariant: (data: unknown) => addVariantInputSchema.parse(data),
  updateVariant: (data: unknown) => updateVariantInputSchema.parse(data),
  addReview: (data: unknown) => addReviewInputSchema.parse(data),
  listReviews: (data: unknown) => listReviewsQuerySchema.parse(data),
};