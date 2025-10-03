// src/modules/magazine/magazine.service.ts
import { magazineRepo } from '../../infrastructure/db/repositories/magazine.repo.js';
import { prisma } from '../../infrastructure/db/prismaClient.js';
import AppError from '../../common/errors/AppError.js';
import { onMagazinePostSaved, onMagazinePostDeleted } from './magazine.hooks.js';
function slugify(input) {
    return input
        .toString()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .replace(/--+/g, '-');
}
async function generateUniqueSlugForPost(baseInput) {
    const base = slugify(baseInput);
    let candidate = base;
    let n = 1;
    while (true) {
        const exists = await prisma.magazinePost.count({ where: { slug: candidate } });
        if (!exists)
            return candidate;
        n += 1;
        candidate = `${base}-${n}`;
        if (n > 1000)
            throw new Error('Unable to generate unique slug for post');
    }
}
async function generateUniqueSlugForAuthor(baseInput) {
    const base = slugify(baseInput);
    let candidate = base;
    let n = 1;
    while (true) {
        const exists = await prisma.magazineAuthor.count({ where: { slug: candidate } });
        if (!exists)
            return candidate;
        n += 1;
        candidate = `${base}-${n}`;
        if (n > 1000)
            throw new Error('Unable to generate unique slug for author');
    }
}
async function upsertTagsByNamesOrSlugs(values = []) {
    // Deduplicate by slug and ignore empty values
    const map = new Map(); // slug -> name
    for (const v of values) {
        const name = (v ?? '').trim();
        if (!name)
            continue;
        const slug = slugify(name);
        if (!map.has(slug))
            map.set(slug, name);
    }
    const results = [];
    for (const [slug, name] of map.entries()) {
        const existing = await magazineRepo.findTagBySlug(slug);
        if (existing) {
            results.push(existing);
        }
        else {
            const created = await magazineRepo.createTag({ name, slug });
            results.push(created);
        }
    }
    return results;
}
function toPostDTO(post) {
    const tags = (post.tags || []).map((pt) => pt.tag);
    const relatedOut = (post.relatedOut || []).map((r) => r.relatedPost);
    const relatedIn = (post.relatedIn || []).map((r) => r.post);
    // unique by id for related
    const relatedMap = new Map();
    [...relatedOut, ...relatedIn].forEach((p) => {
        if (!p)
            return;
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
    async listPosts(params) {
        const safePageSize = Math.max(1, params.pageSize);
        const filter = {
            page: params.page,
            pageSize: safePageSize,
            category: params.category,
            tagSlugs: params.tagSlugs,
            authorSlug: params.authorSlug,
            q: params.q,
            onlyPublished: params.onlyPublished ?? true,
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
    async getPostBySlug(slug, includeUnpublished = false) {
        const post = await magazineRepo.findPostBySlug(slug);
        if (!post)
            throw new AppError('Post not found', 404);
        if (!includeUnpublished && (!post.isPublished || !post.publishedAt)) {
            throw new AppError('Post not found', 404);
        }
        return toPostDTO(post);
    }
    async createPost(input) {
        let slug;
        if (input.slug && input.slug.trim()) {
            slug = slugify(input.slug);
            const exists = await prisma.magazinePost.count({ where: { slug } });
            if (exists)
                throw new AppError('Slug already in use', 409);
        }
        else {
            slug = await generateUniqueSlugForPost(input.title);
        }
        const tagIds = input.tags?.length
            ? (await upsertTagsByNamesOrSlugs(input.tags)).map((t) => t.id)
            : [];
        // Use loose typing to avoid relying on Prisma's Unchecked types
        const data = {
            authorId: typeof input.authorId !== 'undefined' ? input.authorId : null,
            category: input.category,
            title: input.title,
            slug,
            excerpt: typeof input.excerpt !== 'undefined' ? input.excerpt : null,
            content: input.content,
            heroImageUrl: typeof input.heroImageUrl !== 'undefined' ? input.heroImageUrl : null,
            readTimeMinutes: typeof input.readTimeMinutes !== 'undefined' ? input.readTimeMinutes : null,
            publishedAt: typeof input.publishedAt !== 'undefined' ? input.publishedAt : null,
            isPublished: typeof input.isPublished !== 'undefined' ? input.isPublished : true,
        };
        const created = await magazineRepo.createPost(data, tagIds, input.relatedPostIds ?? []);
        const dto = toPostDTO(created);
        // Index in Elasticsearch
        await onMagazinePostSaved(created.id);
        return dto;
    }
    async updatePost(id, input) {
        const existing = await magazineRepo.findPostById(id);
        if (!existing)
            throw new AppError('Post not found', 404);
        const data = {};
        if (typeof input.title !== 'undefined')
            data.title = input.title;
        if (typeof input.category !== 'undefined')
            data.category = input.category;
        if (typeof input.authorId !== 'undefined')
            data.authorId = input.authorId;
        if (typeof input.excerpt !== 'undefined')
            data.excerpt = input.excerpt;
        if (typeof input.content !== 'undefined')
            data.content = input.content;
        if (typeof input.heroImageUrl !== 'undefined')
            data.heroImageUrl = input.heroImageUrl;
        if (typeof input.readTimeMinutes !== 'undefined')
            data.readTimeMinutes = input.readTimeMinutes;
        if (typeof input.publishedAt !== 'undefined')
            data.publishedAt = input.publishedAt;
        if (typeof input.isPublished !== 'undefined')
            data.isPublished = input.isPublished;
        if (typeof input.slug !== 'undefined') {
            const cleanSlug = slugify(input.slug);
            if (cleanSlug !== existing.slug) {
                const exists = await prisma.magazinePost.count({ where: { slug: cleanSlug } });
                if (exists)
                    throw new AppError('Slug already in use', 409);
            }
            data.slug = cleanSlug;
        }
        const tagIds = typeof input.tags !== 'undefined'
            ? (await upsertTagsByNamesOrSlugs(input.tags)).map((t) => t.id)
            : undefined;
        const updated = await magazineRepo.updatePost(id, data, tagIds, input.relatedPostIds);
        const dto = toPostDTO(updated);
        // Re-index in Elasticsearch
        await onMagazinePostSaved(updated.id);
        return dto;
    }
    async deletePost(id) {
        await magazineRepo.deletePost(id);
        // Remove from Elasticsearch
        await onMagazinePostDeleted(id);
    }
    // AUTHORS
    async listAuthors() {
        return magazineRepo.listAuthors();
    }
    async getAuthorBySlug(slug) {
        const author = await magazineRepo.findAuthorBySlug(slug);
        if (!author)
            throw new AppError('Author not found', 404);
        return author;
    }
    async createAuthor(input) {
        let slug;
        if (input.slug && input.slug.trim()) {
            slug = slugify(input.slug);
        }
        else {
            slug = await generateUniqueSlugForAuthor(input.name);
        }
        const exists = await magazineRepo.findAuthorBySlug(slug);
        if (exists)
            throw new AppError('Author slug already exists', 409);
        return magazineRepo.createAuthor({
            name: input.name,
            slug,
            bio: typeof input.bio !== 'undefined' ? input.bio : null,
            avatarUrl: typeof input.avatarUrl !== 'undefined' ? input.avatarUrl : null,
        });
    }
    async updateAuthor(id, input) {
        const data = {};
        if (typeof input.name !== 'undefined')
            data.name = input.name;
        if (typeof input.slug !== 'undefined') {
            const clean = slugify(input.slug);
            const bySlug = await magazineRepo.findAuthorBySlug(clean);
            if (bySlug && bySlug.id !== id) {
                throw new AppError('Author slug already exists', 409);
            }
            data.slug = clean;
        }
        if (typeof input.bio !== 'undefined')
            data.bio = input.bio;
        if (typeof input.avatarUrl !== 'undefined')
            data.avatarUrl = input.avatarUrl;
        return magazineRepo.updateAuthor(id, data);
    }
    async deleteAuthor(id) {
        await magazineRepo.deleteAuthor(id);
    }
    // TAGS
    async listTags() {
        return magazineRepo.listTags();
    }
    async createTag(input) {
        const slug = input.slug && input.slug.trim() ? slugify(input.slug) : slugify(input.name);
        const exists = await magazineRepo.findTagBySlug(slug);
        if (exists)
            throw new AppError('Tag slug already exists', 409);
        return magazineRepo.createTag({ name: input.name, slug });
    }
    async updateTag(id, input) {
        const data = {};
        if (typeof input.name !== 'undefined')
            data.name = input.name;
        if (typeof input.slug !== 'undefined') {
            const clean = slugify(input.slug);
            const bySlug = await magazineRepo.findTagBySlug(clean);
            if (bySlug && bySlug.id !== id)
                throw new AppError('Tag slug already exists', 409);
            data.slug = clean;
        }
        return magazineRepo.updateTag(id, data);
    }
    async deleteTag(id) {
        await magazineRepo.deleteTag(id);
    }
}
export const magazineService = new MagazineService();
//# sourceMappingURL=magazine.service.js.map