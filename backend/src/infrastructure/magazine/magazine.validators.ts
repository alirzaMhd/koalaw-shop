import { z } from 'zod';

export enum MagazineCategory {
  GUIDE = "GUIDE",
  TUTORIAL = "TUTORIAL",
  TRENDS = "TRENDS",
  LIFESTYLE = "LIFESTYLE",
  GENERAL = "GENERAL"
}

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

export const listPostsSchema = z.object({
  query: z.object({
    ...pagination,
    category: z.nativeEnum(MagazineCategory).optional(),
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
    category: z.nativeEnum(MagazineCategory),
    title: z.string().min(1),
    slug: z.string().min(1).optional(),
    excerpt: z.string().optional(),
    content: z.string().min(1),
    heroImageUrl: z.string().url().optional(),
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
      category: z.nativeEnum(MagazineCategory).optional(),
      title: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      content: z.string().min(1).optional(),
      heroImageUrl: z.string().url().optional(),
      readTimeMinutes: z.number().int().min(0).optional(),
      publishedAt: z.coerce.date().nullable().optional(),
      isPublished: z.boolean().optional(),
      tags: z.array(z.string().min(1)).optional(),
      relatedPostIds: z.array(z.string().uuid()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' }),
});

export const deletePostSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createAuthorSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    slug: z.string().min(1).optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const updateAuthorSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      bio: z.string().optional(),
      avatarUrl: z.string().url().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' }),
});

export const deleteAuthorSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    slug: z.string().min(1).optional(),
  }),
});

export const updateTagSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' }),
});

export const deleteTagSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});