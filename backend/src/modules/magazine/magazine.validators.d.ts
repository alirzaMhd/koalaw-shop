import { z } from 'zod';
export declare enum MagazineCategory {
    GUIDE = "GUIDE",
    TUTORIAL = "TUTORIAL",
    TRENDS = "TRENDS",
    LIFESTYLE = "LIFESTYLE",
    GENERAL = "GENERAL"
}
export declare const listPostsSchema: z.ZodObject<{
    query: z.ZodObject<{
        category: z.ZodOptional<z.ZodNativeEnum<typeof MagazineCategory>>;
        tag: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodEffects<z.ZodString, string[], string>>;
        authorSlug: z.ZodOptional<z.ZodString>;
        q: z.ZodOptional<z.ZodString>;
        onlyPublished: z.ZodOptional<z.ZodBoolean>;
        page: z.ZodDefault<z.ZodNumber>;
        pageSize: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        pageSize: number;
        category?: MagazineCategory | undefined;
        authorSlug?: string | undefined;
        q?: string | undefined;
        onlyPublished?: boolean | undefined;
        tags?: string[] | undefined;
        tag?: string | undefined;
    }, {
        category?: MagazineCategory | undefined;
        page?: number | undefined;
        pageSize?: number | undefined;
        authorSlug?: string | undefined;
        q?: string | undefined;
        onlyPublished?: boolean | undefined;
        tags?: string | undefined;
        tag?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        pageSize: number;
        category?: MagazineCategory | undefined;
        authorSlug?: string | undefined;
        q?: string | undefined;
        onlyPublished?: boolean | undefined;
        tags?: string[] | undefined;
        tag?: string | undefined;
    };
}, {
    query: {
        category?: MagazineCategory | undefined;
        page?: number | undefined;
        pageSize?: number | undefined;
        authorSlug?: string | undefined;
        q?: string | undefined;
        onlyPublished?: boolean | undefined;
        tags?: string | undefined;
        tag?: string | undefined;
    };
}>;
export declare const getPostBySlugSchema: z.ZodObject<{
    params: z.ZodObject<{
        slug: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        slug: string;
    }, {
        slug: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        slug: string;
    };
}, {
    params: {
        slug: string;
    };
}>;
export declare const createPostSchema: z.ZodObject<{
    body: z.ZodObject<{
        authorId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodNativeEnum<typeof MagazineCategory>;
        title: z.ZodString;
        slug: z.ZodOptional<z.ZodString>;
        excerpt: z.ZodOptional<z.ZodString>;
        content: z.ZodString;
        heroImageUrl: z.ZodOptional<z.ZodString>;
        readTimeMinutes: z.ZodOptional<z.ZodNumber>;
        publishedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
        isPublished: z.ZodOptional<z.ZodBoolean>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        relatedPostIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        category: MagazineCategory;
        content: string;
        title: string;
        slug?: string | undefined;
        publishedAt?: Date | null | undefined;
        tags?: string[] | undefined;
        excerpt?: string | undefined;
        isPublished?: boolean | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        readTimeMinutes?: number | undefined;
        relatedPostIds?: string[] | undefined;
    }, {
        category: MagazineCategory;
        content: string;
        title: string;
        slug?: string | undefined;
        publishedAt?: Date | null | undefined;
        tags?: string[] | undefined;
        excerpt?: string | undefined;
        isPublished?: boolean | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        readTimeMinutes?: number | undefined;
        relatedPostIds?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        category: MagazineCategory;
        content: string;
        title: string;
        slug?: string | undefined;
        publishedAt?: Date | null | undefined;
        tags?: string[] | undefined;
        excerpt?: string | undefined;
        isPublished?: boolean | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        readTimeMinutes?: number | undefined;
        relatedPostIds?: string[] | undefined;
    };
}, {
    body: {
        category: MagazineCategory;
        content: string;
        title: string;
        slug?: string | undefined;
        publishedAt?: Date | null | undefined;
        tags?: string[] | undefined;
        excerpt?: string | undefined;
        isPublished?: boolean | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        readTimeMinutes?: number | undefined;
        relatedPostIds?: string[] | undefined;
    };
}>;
export declare const updatePostSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodEffects<z.ZodObject<{
        authorId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        category: z.ZodOptional<z.ZodNativeEnum<typeof MagazineCategory>>;
        title: z.ZodOptional<z.ZodString>;
        slug: z.ZodOptional<z.ZodString>;
        excerpt: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
        heroImageUrl: z.ZodOptional<z.ZodString>;
        readTimeMinutes: z.ZodOptional<z.ZodNumber>;
        publishedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
        isPublished: z.ZodOptional<z.ZodBoolean>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        relatedPostIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        publishedAt?: Date | null | undefined;
        tags?: string[] | undefined;
        content?: string | undefined;
        excerpt?: string | undefined;
        title?: string | undefined;
        isPublished?: boolean | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        readTimeMinutes?: number | undefined;
        relatedPostIds?: string[] | undefined;
    }, {
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        publishedAt?: Date | null | undefined;
        tags?: string[] | undefined;
        content?: string | undefined;
        excerpt?: string | undefined;
        title?: string | undefined;
        isPublished?: boolean | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        readTimeMinutes?: number | undefined;
        relatedPostIds?: string[] | undefined;
    }>, {
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        publishedAt?: Date | null | undefined;
        tags?: string[] | undefined;
        content?: string | undefined;
        excerpt?: string | undefined;
        title?: string | undefined;
        isPublished?: boolean | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        readTimeMinutes?: number | undefined;
        relatedPostIds?: string[] | undefined;
    }, {
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        publishedAt?: Date | null | undefined;
        tags?: string[] | undefined;
        content?: string | undefined;
        excerpt?: string | undefined;
        title?: string | undefined;
        isPublished?: boolean | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        readTimeMinutes?: number | undefined;
        relatedPostIds?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        publishedAt?: Date | null | undefined;
        tags?: string[] | undefined;
        content?: string | undefined;
        excerpt?: string | undefined;
        title?: string | undefined;
        isPublished?: boolean | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        readTimeMinutes?: number | undefined;
        relatedPostIds?: string[] | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        publishedAt?: Date | null | undefined;
        tags?: string[] | undefined;
        content?: string | undefined;
        excerpt?: string | undefined;
        title?: string | undefined;
        isPublished?: boolean | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        readTimeMinutes?: number | undefined;
        relatedPostIds?: string[] | undefined;
    };
}>;
export declare const deletePostSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
export declare const createAuthorSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        slug: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
        avatarUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        slug?: string | undefined;
        avatarUrl?: string | undefined;
        bio?: string | undefined;
    }, {
        name: string;
        slug?: string | undefined;
        avatarUrl?: string | undefined;
        bio?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        slug?: string | undefined;
        avatarUrl?: string | undefined;
        bio?: string | undefined;
    };
}, {
    body: {
        name: string;
        slug?: string | undefined;
        avatarUrl?: string | undefined;
        bio?: string | undefined;
    };
}>;
export declare const updateAuthorSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodEffects<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        slug: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
        avatarUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        slug?: string | undefined;
        name?: string | undefined;
        avatarUrl?: string | undefined;
        bio?: string | undefined;
    }, {
        slug?: string | undefined;
        name?: string | undefined;
        avatarUrl?: string | undefined;
        bio?: string | undefined;
    }>, {
        slug?: string | undefined;
        name?: string | undefined;
        avatarUrl?: string | undefined;
        bio?: string | undefined;
    }, {
        slug?: string | undefined;
        name?: string | undefined;
        avatarUrl?: string | undefined;
        bio?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        slug?: string | undefined;
        name?: string | undefined;
        avatarUrl?: string | undefined;
        bio?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        slug?: string | undefined;
        name?: string | undefined;
        avatarUrl?: string | undefined;
        bio?: string | undefined;
    };
}>;
export declare const deleteAuthorSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
export declare const createTagSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        slug: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        slug?: string | undefined;
    }, {
        name: string;
        slug?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        slug?: string | undefined;
    };
}, {
    body: {
        name: string;
        slug?: string | undefined;
    };
}>;
export declare const updateTagSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodEffects<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        slug: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        slug?: string | undefined;
        name?: string | undefined;
    }, {
        slug?: string | undefined;
        name?: string | undefined;
    }>, {
        slug?: string | undefined;
        name?: string | undefined;
    }, {
        slug?: string | undefined;
        name?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        slug?: string | undefined;
        name?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        slug?: string | undefined;
        name?: string | undefined;
    };
}>;
export declare const deleteTagSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
//# sourceMappingURL=magazine.validators.d.ts.map