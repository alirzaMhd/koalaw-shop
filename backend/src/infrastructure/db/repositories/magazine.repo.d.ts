export interface ListPostsFilter {
    page: number;
    pageSize: number;
    category?: any;
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
    findPostBySlug(slug: string, include?: any): Promise<any>;
    findPostById(id: string, include?: any): Promise<any>;
    createPost(data: any, tagIds?: string[], relatedPostIds?: string[]): Promise<any>;
    updatePost(postId: string, data: any, tagIds?: string[], relatedPostIds?: string[]): Promise<any>;
    deletePost(postId: string): Promise<any>;
    listAuthors(): Promise<any>;
    findAuthorBySlug(slug: string): Promise<any>;
    findAuthorById(id: string): Promise<any>;
    createAuthor(data: any): Promise<any>;
    updateAuthor(id: string, data: any): Promise<any>;
    deleteAuthor(id: string): Promise<any>;
    listTags(): Promise<any>;
    findTagBySlug(slug: string): Promise<any>;
    findTagById(id: string): Promise<any>;
    createTag(data: any): Promise<any>;
    updateTag(id: string, data: any): Promise<any>;
    deleteTag(id: string): Promise<any>;
};
//# sourceMappingURL=magazine.repo.d.ts.map