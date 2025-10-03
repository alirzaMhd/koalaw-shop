import { prisma } from '../prismaClient.js';
const defaultPostInclude = {
    author: true,
    tags: {
        include: {
            tag: true,
        },
    },
    relatedOut: {
        include: {
            relatedPost: {
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    heroImageUrl: true,
                    publishedAt: true,
                    isPublished: true,
                },
            },
        },
    },
    relatedIn: {
        include: {
            post: {
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    heroImageUrl: true,
                    publishedAt: true,
                    isPublished: true,
                },
            },
        },
    },
};
export const magazineRepo = {
    // POSTS
    async listPosts(filter) {
        const { page, pageSize, category, tagSlugs, authorSlug, q, onlyPublished = true } = filter;
        const where = {
            AND: [
                category ? { category } : {},
                tagSlugs?.length
                    ? {
                        tags: {
                            some: {
                                tag: {
                                    slug: { in: tagSlugs },
                                },
                            },
                        },
                    }
                    : {},
                authorSlug ? { author: { slug: authorSlug } } : {},
                q
                    ? {
                        OR: [
                            { title: { contains: q, mode: 'insensitive' } },
                            { excerpt: { contains: q, mode: 'insensitive' } },
                            { content: { contains: q, mode: 'insensitive' } },
                        ],
                    }
                    : {},
                onlyPublished
                    ? {
                        AND: [{ isPublished: true }, { publishedAt: { not: null } }],
                    }
                    : {},
            ],
        };
        const skip = (page - 1) * pageSize;
        const take = pageSize;
        const [items, total] = await Promise.all([
            prisma.magazinePost.findMany({
                where,
                skip,
                take,
                orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
                include: defaultPostInclude,
            }),
            prisma.magazinePost.count({ where }),
        ]);
        return { items, total };
    },
    async findPostBySlug(slug, include = defaultPostInclude) {
        return prisma.magazinePost.findUnique({
            where: { slug },
            include,
        });
    },
    async findPostById(id, include = defaultPostInclude) {
        return prisma.magazinePost.findUnique({
            where: { id },
            include,
        });
    },
    async createPost(data, tagIds = [], relatedPostIds = []) {
        return prisma.$transaction(async (tx) => {
            const post = await tx.magazinePost.create({
                data,
            });
            if (tagIds.length) {
                await tx.magazinePostTag.createMany({
                    data: tagIds.map((tagId) => ({ postId: post.id, tagId })),
                    skipDuplicates: true,
                });
            }
            if (relatedPostIds.length) {
                await tx.magazineRelatedPost.createMany({
                    data: relatedPostIds.map((relatedPostId) => ({ postId: post.id, relatedPostId })),
                    skipDuplicates: true,
                });
            }
            return tx.magazinePost.findUnique({
                where: { id: post.id },
                include: defaultPostInclude,
            });
        });
    },
    async updatePost(postId, data, tagIds, relatedPostIds) {
        return prisma.$transaction(async (tx) => {
            await tx.magazinePost.update({
                where: { id: postId },
                data,
            });
            if (tagIds) {
                await tx.magazinePostTag.deleteMany({ where: { postId } });
                if (tagIds.length) {
                    await tx.magazinePostTag.createMany({
                        data: tagIds.map((tagId) => ({ postId, tagId })),
                        skipDuplicates: true,
                    });
                }
            }
            if (relatedPostIds) {
                await tx.magazineRelatedPost.deleteMany({ where: { postId } });
                if (relatedPostIds.length) {
                    await tx.magazineRelatedPost.createMany({
                        data: relatedPostIds.map((relatedPostId) => ({ postId, relatedPostId })),
                        skipDuplicates: true,
                    });
                }
            }
            return tx.magazinePost.findUnique({
                where: { id: postId },
                include: defaultPostInclude,
            });
        });
    },
    async deletePost(postId) {
        return prisma.magazinePost.delete({ where: { id: postId } });
    },
    // AUTHORS
    async listAuthors() {
        return prisma.magazineAuthor.findMany({
            orderBy: [{ name: 'asc' }],
        });
    },
    async findAuthorBySlug(slug) {
        return prisma.magazineAuthor.findUnique({ where: { slug } });
    },
    async findAuthorById(id) {
        return prisma.magazineAuthor.findUnique({ where: { id } });
    },
    async createAuthor(data) {
        return prisma.magazineAuthor.create({ data });
    },
    async updateAuthor(id, data) {
        return prisma.magazineAuthor.update({ where: { id }, data });
    },
    async deleteAuthor(id) {
        return prisma.magazineAuthor.delete({ where: { id } });
    },
    // TAGS
    async listTags() {
        return prisma.magazineTag.findMany({
            orderBy: [{ name: 'asc' }],
        });
    },
    async findTagBySlug(slug) {
        return prisma.magazineTag.findUnique({ where: { slug } });
    },
    async findTagById(id) {
        return prisma.magazineTag.findUnique({ where: { id } });
    },
    async createTag(data) {
        return prisma.magazineTag.create({ data });
    },
    async updateTag(id, data) {
        return prisma.magazineTag.update({ where: { id }, data });
    },
    async deleteTag(id) {
        return prisma.magazineTag.delete({ where: { id } });
    },
};
//# sourceMappingURL=magazine.repo.js.map