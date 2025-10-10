// src/modules/magazine/magazine.service.ts
import { magazineRepo, type ListPostsFilter } from '../../infrastructure/db/repositories/magazine.repo.js';
import { prisma } from '../../infrastructure/db/prismaClient.js';
import AppError from '../../common/errors/AppError.js';
import { onMagazinePostSaved, onMagazinePostDeleted } from './magazine.hooks.js';

// Types local to this service (kept lightweight to avoid coupling to Prisma's generated types)
export type AuthorDTO =
  | {
      id: string;
      name: string;
      slug: string;
      avatarUrl: string | null;
    }
  | null;

// Derive the category type from the repository filter (falls back to string if not present)
type DerivedCategory = ListPostsFilter extends { category?: infer C } ? C : string;

export type PostDTO = {
  id: string;
  author: AuthorDTO;
  category: DerivedCategory;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  heroImageUrl: string | null;
  readTimeMinutes: number | null;
  publishedAt: Date | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: any[]; // keep loose to avoid missing Prisma model types
  related: any[];
};

function slugify(input: string) {
  return input
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .replace(/--+/g, '-');
}

async function generateUniqueSlugForPost(baseInput: string) {
  const base = slugify(baseInput);
  let candidate = base;
  let n = 1;

  while (true) {
    const exists = await prisma.magazinePost.count({ where: { slug: candidate } });
    if (!exists) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 1000) throw new Error('Unable to generate unique slug for post');
  }
}

async function generateUniqueSlugForAuthor(baseInput: string) {
  const base = slugify(baseInput);
  let candidate = base;
  let n = 1;

  while (true) {
    const exists = await prisma.magazineAuthor.count({ where: { slug: candidate } });
    if (!exists) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 1000) throw new Error('Unable to generate unique slug for author');
  }
}

/**
 * Upsert tags by names or slugs
 * Handles duplicate tag names/slugs gracefully by returning existing tags
 * @param values Array of tag names or slugs
 * @returns Array of tag objects
 */
async function upsertTagsByNamesOrSlugs(values: string[] = []): Promise<any[]> {
  // Deduplicate by slug and ignore empty values
  const map = new Map<string, string>(); // slug -> name
  for (const v of values) {
    const name = (v ?? '').trim();
    if (!name) continue;
    const slug = slugify(name);
    if (!map.has(slug)) map.set(slug, name);
  }

  const results: any[] = [];
  
  for (const [slug, name] of map.entries()) {
    // First, try to find existing tag by slug
    let existing = await magazineRepo.findTagBySlug(slug);
    
    if (existing) {
      results.push(existing);
      continue;
    }

    // If not found by slug, check if a tag with this name already exists
    const allTags = await magazineRepo.listTags();
    const existingByName = allTags.find(
      t => t.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingByName) {
      results.push(existingByName);
      continue;
    }

    // Tag doesn't exist, try to create it
    try {
      const created = await magazineRepo.createTag({ name, slug });
      results.push(created);
    } catch (error: any) {
      // Handle unique constraint violations (P2002)
      if (error.code === 'P2002') {
        // Race condition: tag was created between our check and create attempt
        // Try to find it again
        const retryBySlug = await magazineRepo.findTagBySlug(slug);
        if (retryBySlug) {
          results.push(retryBySlug);
          continue;
        }

        // If still not found by slug, try by name
        const retryTags = await magazineRepo.listTags();
        const retryByName = retryTags.find(
          t => t.name.toLowerCase() === name.toLowerCase()
        );
        
        if (retryByName) {
          results.push(retryByName);
          continue;
        }

        // If we still can't find it, something is wrong
        throw new AppError(
          `برچسب "${name}" از قبل وجود دارد اما قابل بازیابی نیست`,
          409
        );
      }
      
      // Re-throw other errors
      throw error;
    }
  }
  
  return results;
}

function toPostDTO(post: any): PostDTO {
  const tags = (post.tags || []).map((pt: any) => pt.tag).filter(Boolean);
  const relatedOut = (post.relatedOut || []).map((r: any) => r.relatedPost).filter(Boolean);
  const relatedIn = (post.relatedIn || []).map((r: any) => r.post).filter(Boolean);

  // unique by id for related
  const relatedMap = new Map<string, any>();
  [...relatedOut, ...relatedIn].forEach((p) => {
    if (!p) return;
    relatedMap.set(p.id, p);
  });

  return {
    id: post.id,
    author: post.author
      ? {
          id: post.author.id,
          name: post.author.name,
          slug: post.author.slug,
          avatarUrl: post.author.avatarUrl,
        }
      : null,
    category: post.category,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    heroImageUrl: post.heroImageUrl,
    readTimeMinutes: post.readTimeMinutes,
    publishedAt: post.publishedAt,
    isPublished: post.isPublished,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    tags,
    related: Array.from(relatedMap.values()),
  };
}

export class MagazineService {
  // POSTS
  async listPosts(params: {
    page: number;
    pageSize: number;
    category?: DerivedCategory;
    tagSlugs?: string[];
    authorSlug?: string;
    q?: string;
    onlyPublished?: boolean;
  }) {
    const safePageSize = Math.max(1, params.pageSize);
    const filter: ListPostsFilter = {
      page: params.page,
      pageSize: safePageSize,
      onlyPublished: params.onlyPublished ?? true,
      // Conditionally add optional properties only if they have a non-falsy value.
      ...(params.category && { category: params.category as any }),
      ...(params.tagSlugs && { tagSlugs: params.tagSlugs }),
      ...(params.authorSlug && { authorSlug: params.authorSlug }),
      ...(params.q && { q: params.q }),
    };

    const { items, total } = await magazineRepo.listPosts(filter);
    return {
      items: items.map(toPostDTO),
      meta: {
        page: params.page,
        pageSize: safePageSize,
        total,
        totalPages: Math.ceil(total / safePageSize),
      },
    };
  }

  async getPostBySlug(slug: string, includeUnpublished = false) {
    const post = await magazineRepo.findPostBySlug(slug);
    if (!post) throw new AppError('Post not found', 404);

    if (!includeUnpublished && (!post.isPublished || !post.publishedAt)) {
      throw new AppError('Post not found', 404);
    }

    return toPostDTO(post);
  }

  async getPostById(id: string) {
    const post = await magazineRepo.findPostById(id);
    if (!post) throw new AppError('Post not found', 404);
    // For admin, we don't need to check if it's published
    return toPostDTO(post);
  }

  async createPost(input: {
    authorId?: string | null;
    category: DerivedCategory;
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    heroImageUrl?: string;
    readTimeMinutes?: number;
    publishedAt?: Date | null;
    isPublished?: boolean;
    tags?: string[];
    relatedPostIds?: string[];
  }) {
    let slug: string;
    if (input.slug && input.slug.trim()) {
      slug = slugify(input.slug);
      const exists = await prisma.magazinePost.count({ where: { slug } });
      if (exists) throw new AppError('این اسلاگ قبلا استفاده شده است', 409);
    } else {
      slug = await generateUniqueSlugForPost(input.title);
    }

    const tagIds: string[] = input.tags?.length
      ? (await upsertTagsByNamesOrSlugs(input.tags)).map((t: any) => t.id)
      : [];

    const authorId = input.authorId && input.authorId.trim() !== "" ? input.authorId.trim() : null;

    const data: any = {
      authorId,
      category: input.category,
      title: input.title,
      slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      heroImageUrl: input.heroImageUrl ?? null,
      readTimeMinutes: input.readTimeMinutes ?? null,
      publishedAt: input.publishedAt ?? null,
      isPublished: input.isPublished ?? true,
    };

    const created = await magazineRepo.createPost(data, tagIds, input.relatedPostIds ?? []);
    if (!created) {
      throw new AppError('Failed to create post', 500);
    }
    const dto = toPostDTO(created);
    await onMagazinePostSaved(created.id);
    return dto;
  }

  async updatePost(
    id: string,
    input: Partial<{
      authorId: string | null;
      category: DerivedCategory;
      title: string;
      slug: string;
      excerpt: string | null;
      content: string;
      heroImageUrl: string | null;
      readTimeMinutes: number | null;
      publishedAt: Date | null;
      isPublished: boolean;
      tags: string[];
      relatedPostIds: string[];
    }>,
  ) {
    const existing = await magazineRepo.findPostById(id);
    if (!existing) throw new AppError('Post not found', 404);

    const data: any = {};

    if (typeof input.title !== 'undefined') data.title = input.title;
    if (typeof input.category !== 'undefined') data.category = input.category;
    if (typeof input.authorId !== 'undefined') {
      data.authorId = input.authorId && input.authorId.trim() !== "" ? input.authorId.trim() : null;
    }
    if (typeof input.excerpt !== 'undefined') data.excerpt = input.excerpt;
    if (typeof input.content !== 'undefined') data.content = input.content;
    if (typeof input.heroImageUrl !== 'undefined') data.heroImageUrl = input.heroImageUrl;
    if (typeof input.readTimeMinutes !== 'undefined') data.readTimeMinutes = input.readTimeMinutes;
    if (typeof input.publishedAt !== 'undefined') data.publishedAt = input.publishedAt;
    if (typeof input.isPublished !== 'undefined') data.isPublished = input.isPublished;

    if (typeof input.slug !== 'undefined') {
      const cleanSlug = slugify(input.slug);
      if (cleanSlug !== existing.slug) {
        const exists = await prisma.magazinePost.count({ where: { slug: cleanSlug, id: { not: id } } });
        if (exists) throw new AppError('این اسلاگ قبلا استفاده شده است', 409);
      }
      data.slug = cleanSlug;
    }

    const tagIds = typeof input.tags !== 'undefined'
      ? (await upsertTagsByNamesOrSlugs(input.tags)).map((t: any) => t.id)
      : undefined;

    const updated = await magazineRepo.updatePost(id, data, tagIds, input.relatedPostIds);
    const dto = toPostDTO(updated);
    await onMagazinePostSaved(updated.id);
    return dto;
  }

  async deletePost(id: string) {
    await magazineRepo.deletePost(id);

    // Remove from Elasticsearch
    await onMagazinePostDeleted(id);
  }

  // AUTHORS
  async listAuthors() {
    return magazineRepo.listAuthors();
  }

  async getAuthorBySlug(slug: string) {
    const author = await magazineRepo.findAuthorBySlug(slug);
    if (!author) throw new AppError('Author not found', 404);
    return author;
  }

  async createAuthor(input: { name: string; slug?: string; bio?: string; avatarUrl?: string }) {
    let slug: string;
    if (input.slug && input.slug.trim()) {
      slug = slugify(input.slug);
    } else {
      slug = await generateUniqueSlugForAuthor(input.name);
    }
    const exists = await magazineRepo.findAuthorBySlug(slug);
    if (exists) throw new AppError('Author slug already exists', 409);

    return magazineRepo.createAuthor({
      name: input.name,
      slug,
      bio: input.bio ?? null,
      avatarUrl: input.avatarUrl ?? null,
    });
  }

  async updateAuthor(
    id: string,
    input: Partial<{ name: string; slug: string; bio: string | null; avatarUrl: string | null }>,
  ) {
    const data: {
      name?: string;
      slug?: string;
      bio?: string | null;
      avatarUrl?: string | null;
    } = {};

    if (typeof input.name !== 'undefined') data.name = input.name;

    if (typeof input.slug !== 'undefined') {
      const clean = slugify(input.slug);
      const bySlug = await magazineRepo.findAuthorBySlug(clean);
      if (bySlug && bySlug.id !== id) {
        throw new AppError('Author slug already exists', 409);
      }
      data.slug = clean;
    }

    if (typeof input.bio !== 'undefined') data.bio = input.bio;
    if (typeof input.avatarUrl !== 'undefined') data.avatarUrl = input.avatarUrl;

    return magazineRepo.updateAuthor(id, data);
  }

  async deleteAuthor(id: string) {
    await magazineRepo.deleteAuthor(id);
  }

  // TAGS
  async listTags() {
    return magazineRepo.listTags();
  }

  async createTag(input: { name: string; slug?: string }) {
    const slug = input.slug && input.slug.trim() ? slugify(input.slug) : slugify(input.name);
    const exists = await magazineRepo.findTagBySlug(slug);
    if (exists) throw new AppError('Tag slug already exists', 409);
    return magazineRepo.createTag({ name: input.name, slug });
  }

  async updateTag(id: string, input: Partial<{ name: string; slug: string }>) {
    const data: { name?: string; slug?: string } = {};

    if (typeof input.name !== 'undefined') data.name = input.name;

    if (typeof input.slug !== 'undefined') {
      const clean = slugify(input.slug);
      const bySlug = await magazineRepo.findTagBySlug(clean);
      if (bySlug && bySlug.id !== id) throw new AppError('Tag slug already exists', 409);
      data.slug = clean;
    }

    return magazineRepo.updateTag(id, data);
  }

  async deleteTag(id: string) {
    await magazineRepo.deleteTag(id);
  }
}

export const magazineService = new MagazineService();