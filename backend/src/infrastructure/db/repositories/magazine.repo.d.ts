import { Prisma, MagazineCategory } from '@prisma/client';
export type PostInclude = Prisma.MagazinePostInclude;
export interface ListPostsFilter {
    page: number;
    pageSize: number;
    category?: MagazineCategory;
    tagSlugs?: string[];
    authorSlug?: string;
    q?: string;
    onlyPublished?: boolean;
}
export declare const magazineRepo: {
    listPosts(filter: ListPostsFilter): Promise<{
        items: ({
            relatedOut: ({
                relatedPost: {
                    id: string;
                    title: string;
                    slug: string;
                    heroImageUrl: string | null;
                    publishedAt: Date | null;
                    isPublished: boolean;
                };
            } & {
                postId: string;
                relatedPostId: string;
            })[];
            relatedIn: ({
                post: {
                    id: string;
                    title: string;
                    slug: string;
                    heroImageUrl: string | null;
                    publishedAt: Date | null;
                    isPublished: boolean;
                };
            } & {
                postId: string;
                relatedPostId: string;
            })[];
            author: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string | null;
                bio: string | null;
                avatarUrl: string | null;
            } | null;
            tags: ({
                tag: {
                    name: string;
                    id: string;
                    slug: string;
                };
            } & {
                postId: string;
                tagId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            slug: string;
            category: import("@prisma/client").$Enums.MagazineCategory;
            heroImageUrl: string | null;
            authorId: string | null;
            excerpt: string | null;
            content: string;
            readTimeMinutes: number | null;
            publishedAt: Date | null;
            isPublished: boolean;
        })[];
        total: number;
    }>;
    findPostBySlug(slug: string, include?: PostInclude): Promise<({
        _count: {
            author: number;
            tags: number;
            relatedOut: number;
            relatedIn: number;
        };
        relatedOut: {
            postId: string;
            relatedPostId: string;
        }[];
        relatedIn: {
            postId: string;
            relatedPostId: string;
        }[];
        author: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string | null;
            bio: string | null;
            avatarUrl: string | null;
        } | null;
        tags: {
            postId: string;
            tagId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        slug: string;
        category: import("@prisma/client").$Enums.MagazineCategory;
        heroImageUrl: string | null;
        authorId: string | null;
        excerpt: string | null;
        content: string;
        readTimeMinutes: number | null;
        publishedAt: Date | null;
        isPublished: boolean;
    }) | null>;
    findPostById(id: string, include?: PostInclude): Promise<({
        _count: {
            author: number;
            tags: number;
            relatedOut: number;
            relatedIn: number;
        };
        relatedOut: {
            postId: string;
            relatedPostId: string;
        }[];
        relatedIn: {
            postId: string;
            relatedPostId: string;
        }[];
        author: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string | null;
            bio: string | null;
            avatarUrl: string | null;
        } | null;
        tags: {
            postId: string;
            tagId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        slug: string;
        category: import("@prisma/client").$Enums.MagazineCategory;
        heroImageUrl: string | null;
        authorId: string | null;
        excerpt: string | null;
        content: string;
        readTimeMinutes: number | null;
        publishedAt: Date | null;
        isPublished: boolean;
    }) | null>;
    createPost(data: Prisma.MagazinePostUncheckedCreateInput, tagIds?: string[], relatedPostIds?: string[]): Promise<({
        relatedOut: ({
            relatedPost: {
                id: string;
                title: string;
                slug: string;
                heroImageUrl: string | null;
                publishedAt: Date | null;
                isPublished: boolean;
            };
        } & {
            postId: string;
            relatedPostId: string;
        })[];
        relatedIn: ({
            post: {
                id: string;
                title: string;
                slug: string;
                heroImageUrl: string | null;
                publishedAt: Date | null;
                isPublished: boolean;
            };
        } & {
            postId: string;
            relatedPostId: string;
        })[];
        author: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string | null;
            bio: string | null;
            avatarUrl: string | null;
        } | null;
        tags: ({
            tag: {
                name: string;
                id: string;
                slug: string;
            };
        } & {
            postId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        slug: string;
        category: import("@prisma/client").$Enums.MagazineCategory;
        heroImageUrl: string | null;
        authorId: string | null;
        excerpt: string | null;
        content: string;
        readTimeMinutes: number | null;
        publishedAt: Date | null;
        isPublished: boolean;
    }) | null>;
    updatePost(postId: string, data: Prisma.MagazinePostUncheckedUpdateInput, tagIds?: string[], relatedPostIds?: string[]): Promise<({
        relatedOut: ({
            relatedPost: {
                id: string;
                title: string;
                slug: string;
                heroImageUrl: string | null;
                publishedAt: Date | null;
                isPublished: boolean;
            };
        } & {
            postId: string;
            relatedPostId: string;
        })[];
        relatedIn: ({
            post: {
                id: string;
                title: string;
                slug: string;
                heroImageUrl: string | null;
                publishedAt: Date | null;
                isPublished: boolean;
            };
        } & {
            postId: string;
            relatedPostId: string;
        })[];
        author: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string | null;
            bio: string | null;
            avatarUrl: string | null;
        } | null;
        tags: ({
            tag: {
                name: string;
                id: string;
                slug: string;
            };
        } & {
            postId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        slug: string;
        category: import("@prisma/client").$Enums.MagazineCategory;
        heroImageUrl: string | null;
        authorId: string | null;
        excerpt: string | null;
        content: string;
        readTimeMinutes: number | null;
        publishedAt: Date | null;
        isPublished: boolean;
    }) | null>;
    deletePost(postId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        slug: string;
        category: import("@prisma/client").$Enums.MagazineCategory;
        heroImageUrl: string | null;
        authorId: string | null;
        excerpt: string | null;
        content: string;
        readTimeMinutes: number | null;
        publishedAt: Date | null;
        isPublished: boolean;
    }>;
    listAuthors(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }[]>;
    findAuthorBySlug(slug: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string | null;
        bio: string | null;
        avatarUrl: string | null;
    } | null>;
    findAuthorById(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string | null;
        bio: string | null;
        avatarUrl: string | null;
    } | null>;
    createAuthor(data: Prisma.MagazineAuthorUncheckedCreateInput): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }>;
    updateAuthor(id: string, data: Prisma.MagazineAuthorUncheckedUpdateInput): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }>;
    deleteAuthor(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }>;
    listTags(): Promise<{
        name: string;
        id: string;
        slug: string;
    }[]>;
    findTagBySlug(slug: string): Promise<{
        name: string;
        id: string;
        slug: string;
    } | null>;
    findTagById(id: string): Promise<{
        name: string;
        id: string;
        slug: string;
    } | null>;
    createTag(data: Prisma.MagazineTagUncheckedCreateInput): Promise<{
        name: string;
        id: string;
        slug: string;
    }>;
    updateTag(id: string, data: Prisma.MagazineTagUncheckedUpdateInput): Promise<{
        name: string;
        id: string;
        slug: string;
    }>;
    deleteTag(id: string): Promise<{
        name: string;
        id: string;
        slug: string;
    }>;
};
//# sourceMappingURL=magazine.repo.d.ts.map