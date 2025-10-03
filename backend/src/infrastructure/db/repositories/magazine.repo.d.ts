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
        items: any;
        total: any;
    }>;
    findPostBySlug(slug: string, include?: PostInclude): Promise<any>;
    findPostById(id: string, include?: PostInclude): Promise<any>;
    createPost(data: Prisma.MagazinePostUncheckedCreateInput, tagIds?: string[], relatedPostIds?: string[]): Promise<any>;
    updatePost(postId: string, data: Prisma.MagazinePostUncheckedUpdateInput, tagIds?: string[], relatedPostIds?: string[]): Promise<any>;
    deletePost(postId: string): Promise<any>;
    listAuthors(): Promise<any>;
    findAuthorBySlug(slug: string): Promise<any>;
    findAuthorById(id: string): Promise<any>;
    createAuthor(data: Prisma.MagazineAuthorUncheckedCreateInput): Promise<any>;
    updateAuthor(id: string, data: Prisma.MagazineAuthorUncheckedUpdateInput): Promise<any>;
    deleteAuthor(id: string): Promise<any>;
    listTags(): Promise<any>;
    findTagBySlug(slug: string): Promise<any>;
    findTagById(id: string): Promise<any>;
    createTag(data: Prisma.MagazineTagUncheckedCreateInput): Promise<any>;
    updateTag(id: string, data: Prisma.MagazineTagUncheckedUpdateInput): Promise<any>;
    deleteTag(id: string): Promise<any>;
};
//# sourceMappingURL=magazine.repo.d.ts.map