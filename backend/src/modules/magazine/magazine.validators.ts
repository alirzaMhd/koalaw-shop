// backend/src/modules/magazine/magazine.validators.ts
import { z } from 'zod';

// ========== CUSTOM VALIDATORS ==========

/**
 * Accepts both full URLs (http/https) and relative paths (/static/...)
 * Used for image fields that can be uploaded or external URLs
 */
const urlOrPath = z.string().refine(
  (val) => {
    // Allow empty/null values
    if (!val || val.trim() === '') return true;
    
    const trimmed = val.trim();
    
    // Accept full URLs (http/https)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        new URL(trimmed);
        return true;
      } catch {
        return false;
      }
    }
    
    // Accept relative/absolute paths starting with /
    if (trimmed.startsWith('/')) return true;
    
    return false;
  },
  { message: "باید یک URL معتبر (https://...) یا مسیر نسبی (/static/...) باشد" }
);

// ========== PAGINATION ==========

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

// ========== POST SCHEMAS ==========

export const listPostsSchema = z.object({
  query: z.object({
    ...pagination,
    category: z.string().min(1).optional(),
    tag: z.string().min(1).optional(), // single tag
    tags: z
      .string()
      .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
      .optional(), // comma-separated
    authorSlug: z.string().min(1).optional(),
    q: z.string().min(1).optional(),
    onlyPublished: z.coerce.boolean().optional(),
  }),
});

export const getPostBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const createPostSchema = z.object({
  body: z.object({
    authorId: z.string().uuid().nullable().optional(),
    category: z.string().min(1, "دسته‌بندی الزامی است"),
    title: z.string().min(1, "عنوان الزامی است"),
    slug: z.string().min(1).optional(),
    excerpt: z.string().optional(),
    content: z.string().min(1, "محتوا الزامی است"),
    heroImageUrl: urlOrPath.optional(),
    readTimeMinutes: z.number().int().min(0).optional(),
    publishedAt: z.coerce.date().nullable().optional(),
    isPublished: z.boolean().optional(),
    tags: z.array(z.string().min(1)).optional(), // names or slugs; service will handle
    relatedPostIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updatePostSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      authorId: z.string().uuid().nullable().optional(),
      category: z.string().min(1).optional(),
      title: z.string().min(1, "عنوان الزامی است").optional(),
      slug: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      content: z.string().min(1, "محتوا الزامی است").optional(),
      heroImageUrl: urlOrPath.optional(),
      readTimeMinutes: z.number().int().min(0).optional(),
      publishedAt: z.coerce.date().nullable().optional(),
      isPublished: z.boolean().optional(),
      tags: z.array(z.string().min(1)).optional(),
      relatedPostIds: z.array(z.string().uuid()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { 
      message: 'حداقل یک فیلد برای بروزرسانی الزامی است' 
    }),
});

export const deletePostSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// ========== AUTHOR SCHEMAS ==========

export const createAuthorSchema = z.object({
  body: z.object({
    name: z.string().min(1, "نام نویسنده الزامی است"),
    slug: z.string().min(1).optional(),
    bio: z.string().optional(),
    avatarUrl: urlOrPath.optional(),
  }),
});

export const updateAuthorSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().min(1, "نام نویسنده الزامی است").optional(),
      slug: z.string().min(1).optional(),
      bio: z.string().optional(),
      avatarUrl: urlOrPath.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { 
      message: 'حداقل یک فیلد برای بروزرسانی الزامی است' 
    }),
});

export const deleteAuthorSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// ========== TAG SCHEMAS ==========

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1, "نام برچسب الزامی است"),
    slug: z.string().min(1).optional(),
  }),
});

export const updateTagSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().min(1, "نام برچسب الزامی است").optional(),
      slug: z.string().min(1).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { 
      message: 'حداقل یک فیلد برای بروزرسانی الزامی است' 
    }),
});

export const deleteTagSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// ========== MAGAZINE CATEGORY SCHEMAS ==========
export const createMagazineCategorySchema = z.object({
  body: z.object({
    code: z.string().regex(/^[A-Z_]+$/, "کد باید با حروف بزرگ انگلیسی باشد (مثال: GUIDE)"),
    name: z.string().min(1, "نام دسته‌بندی الزامی است"),
    slug: z.string().regex(/^[a-z0-9-]+$/, "اسلاگ باید با حروف کوچک و خط تیره باشد").optional(),
    description: z.string().optional(),
  }),
});

export const updateMagazineCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    code: z.string().regex(/^[A-Z_]+$/).optional(),
    name: z.string().min(1).optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().nullable().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'حداقل یک فیلد برای بروزرسانی الزامی است',
  }),
});

export const deleteMagazineCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getMagazineCategoryBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});