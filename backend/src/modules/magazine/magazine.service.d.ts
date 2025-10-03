import { ListPostsFilter } from '../../infrastructure/db/repositories/magazine.repo';
export type AuthorDTO = {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
} | null;
type DerivedCategory = ListPostsFilter extends {
    category?: infer C;
} ? C : string;
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
    tags: any[];
    related: any[];
};
export declare class MagazineService {
    listPosts(params: {
        page: number;
        pageSize: number;
        category?: DerivedCategory;
        tagSlugs?: string[];
        authorSlug?: string;
        q?: string;
        onlyPublished?: boolean;
    }): Promise<{
        items: any;
        meta: {
            page: number;
            pageSize: number;
            total: any;
            totalPages: number;
        };
    }>;
    getPostBySlug(slug: string, includeUnpublished?: boolean): Promise<PostDTO>;
    createPost(input: {
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
    }): Promise<PostDTO>;
    updatePost(id: string, input: Partial<{
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
    }>): Promise<PostDTO>;
    deletePost(id: string): Promise<void>;
    listAuthors(): Promise<any>;
    getAuthorBySlug(slug: string): Promise<any>;
    createAuthor(input: {
        name: string;
        slug?: string;
        bio?: string;
        avatarUrl?: string;
    }): Promise<any>;
    updateAuthor(id: string, input: Partial<{
        name: string;
        slug: string;
        bio: string | null;
        avatarUrl: string | null;
    }>): Promise<any>;
    deleteAuthor(id: string): Promise<void>;
    listTags(): Promise<any>;
    createTag(input: {
        name: string;
        slug?: string;
    }): Promise<any>;
    updateTag(id: string, input: Partial<{
        name: string;
        slug: string;
    }>): Promise<any>;
    deleteTag(id: string): Promise<void>;
}
export declare const magazineService: MagazineService;
export {};
//# sourceMappingURL=magazine.service.d.ts.map