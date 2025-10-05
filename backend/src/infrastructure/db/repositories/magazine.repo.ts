import { Prisma } from '@prisma/client';
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
} satisfies any;

export interface ListPostsFilter {
  page: number;
  pageSize: number;
  category?: any;
  tagSlugs?: string[];
  authorSlug?: string;
  q?: string;
  onlyPublished?: boolean;
}

export const magazineRepo = {
  // POSTS
  async listPosts(filter: ListPostsFilter) {
    const { page, pageSize, category, tagSlugs, authorSlug, q, onlyPublished = true } = filter;

    const where: any = {
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

  async findPostBySlug(slug: string, include: any = defaultPostInclude) {
    return prisma.magazinePost.findUnique({
      where: { slug },
      include,
    });
  },

  async findPostById(id: string, include: any = defaultPostInclude) {
    return prisma.magazinePost.findUnique({
      where: { id },
      include,
    });
  },

  async createPost(
    data: any,
    tagIds: string[] = [],
    relatedPostIds: string[] = [],
  ) {
    return prisma.$transaction(async (tx: { magazinePost: { create: (arg0: { data: any; }) => any; findUnique: (arg0: { where: { id: any; }; include: any; }) => any; }; magazinePostTag: { createMany: (arg0: { data: { postId: any; tagId: string; }[]; skipDuplicates: boolean; }) => any; }; magazineRelatedPost: { createMany: (arg0: { data: { postId: any; relatedPostId: string; }[]; skipDuplicates: boolean; }) => any; }; }) => {
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

  async updatePost(
    postId: string,
    data: any,
    tagIds?: string[],
    relatedPostIds?: string[],
  ) {
    return prisma.$transaction(async (tx: { magazinePost: { update: (arg0: { where: { id: string; }; data: any; }) => any; findUnique: (arg0: { where: { id: string; }; include: any; }) => any; }; magazinePostTag: { deleteMany: (arg0: { where: { postId: string; }; }) => any; createMany: (arg0: { data: { postId: string; tagId: string; }[]; skipDuplicates: boolean; }) => any; }; magazineRelatedPost: { deleteMany: (arg0: { where: { postId: string; }; }) => any; createMany: (arg0: { data: { postId: string; relatedPostId: string; }[]; skipDuplicates: boolean; }) => any; }; }) => {
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

  async deletePost(postId: string) {
    return prisma.magazinePost.delete({ where: { id: postId } });
  },

  // AUTHORS
  async listAuthors() {
    return prisma.magazineAuthor.findMany({
      orderBy: [{ name: 'asc' }],
    });
  },

  async findAuthorBySlug(slug: string) {
    return prisma.magazineAuthor.findUnique({ where: { slug } });
  },

  async findAuthorById(id: string) {
    return prisma.magazineAuthor.findUnique({ where: { id } });
  },

  async createAuthor(data: any) {
    return prisma.magazineAuthor.create({ data });
  },

  async updateAuthor(id: string, data: any) {
    return prisma.magazineAuthor.update({ where: { id }, data });
  },

  async deleteAuthor(id: string) {
    return prisma.magazineAuthor.delete({ where: { id } });
  },

  // TAGS
  async listTags() {
    return prisma.magazineTag.findMany({
      orderBy: [{ name: 'asc' }],
    });
  },

  async findTagBySlug(slug: string) {
    return prisma.magazineTag.findUnique({ where: { slug } });
  },

  async findTagById(id: string) {
    return prisma.magazineTag.findUnique({ where: { id } });
  }

  ,
  async createTag(data: any) {
    return prisma.magazineTag.create({ data });
  },

  async updateTag(id: string, data: any) {
    return prisma.magazineTag.update({ where: { id }, data });
  },

  async deleteTag(id: string) {
    return prisma.magazineTag.delete({ where: { id } });
  },
};