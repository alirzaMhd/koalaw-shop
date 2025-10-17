export type AuthorDTO = {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
} | null;
export type PostDTO = {
    id: string;
    author: AuthorDTO;
    category: string;
    categoryName?: string | null;
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
    tags: any[];
    related: any[];
};
export declare class MagazineService {
    listPosts(params: {
        page: number;
        pageSize: number;
        category?: string;
        tagSlugs?: string[];
        authorSlug?: string;
        q?: string;
        onlyPublished?: boolean;
    }): Promise<{
        items: PostDTO[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    getPostBySlug(slug: string, includeUnpublished?: boolean): Promise<PostDTO>;
    getPostById(id: string): Promise<PostDTO>;
    private resolveCategory;
    createPost(input: {
        authorId?: string | null;
        category: string;
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
    }): Promise<PostDTO>;
    updatePost(id: string, input: Partial<{
        authorId: string | null;
        category: string;
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
    }>): Promise<PostDTO>;
    deletePost(id: string): Promise<void>;
    listAuthors(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }[]>;
    getAuthorBySlug(slug: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }>;
    createAuthor(input: {
        name: string;
        slug?: string;
        bio?: string;
        avatarUrl?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }>;
    updateAuthor(id: string, input: Partial<{
        name: string;
        slug: string;
        bio: string | null;
        avatarUrl: string | null;
    }>): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string | null;
        bio: string | null;
        avatarUrl: string | null;
    }>;
    deleteAuthor(id: string): Promise<void>;
    listTags(): Promise<{
        name: string;
        id: string;
        slug: string;
    }[]>;
    createTag(input: {
        name: string;
        slug?: string;
    }): Promise<{
        name: string;
        id: string;
        slug: string;
    }>;
    updateTag(id: string, input: Partial<{
        name: string;
        slug: string;
    }>): Promise<{
        name: string;
        id: string;
        slug: string;
    }>;
    deleteTag(id: string): Promise<void>;
    listCategories(): Promise<{
        code: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
    }[]>;
    getCategoryBySlug(slug: string): Promise<{
        code: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
    }>;
    createCategory(input: {
        code: string;
        name: string;
        slug?: string;
        description?: string;
    }): Promise<{
        code: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
    }>;
    updateCategory(id: string, input: Partial<{
        code: string;
        name: string;
        slug: string;
        description: string | null;
    }>): Promise<{
        code: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
    }>;
    deleteCategory(id: string): Promise<void>;
}
export declare const magazineService: MagazineService;
//# sourceMappingURL=magazine.service.d.ts.map