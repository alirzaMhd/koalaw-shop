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
        tags?: string[] | undefined;
        tag?: string | undefined;
        q?: string | undefined;
        authorSlug?: string | undefined;
        onlyPublished?: boolean | undefined;
    }, {
        category?: MagazineCategory | undefined;
        tags?: string | undefined;
        tag?: string | undefined;
        page?: number | undefined;
        q?: string | undefined;
        pageSize?: number | undefined;
        authorSlug?: string | undefined;
        onlyPublished?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        pageSize: number;
        category?: MagazineCategory | undefined;
        tags?: string[] | undefined;
        tag?: string | undefined;
        q?: string | undefined;
        authorSlug?: string | undefined;
        onlyPublished?: boolean | undefined;
    };
}, {
    query: {
        category?: MagazineCategory | undefined;
        tags?: string | undefined;
        tag?: string | undefined;
        page?: number | undefined;
        q?: string | undefined;
        pageSize?: number | undefined;
        authorSlug?: string | undefined;
        onlyPublished?: boolean | undefined;
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
        heroImageUrl: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        readTimeMinutes: z.ZodOptional<z.ZodNumber>;
        publishedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
        isPublished: z.ZodOptional<z.ZodBoolean>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        relatedPostIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        category: MagazineCategory;
        content: string;
        slug?: string | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        excerpt?: string | undefined;
        readTimeMinutes?: number | undefined;
        publishedAt?: Date | null | undefined;
        isPublished?: boolean | undefined;
        tags?: string[] | undefined;
        relatedPostIds?: string[] | undefined;
    }, {
        title: string;
        category: MagazineCategory;
        content: string;
        slug?: string | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        excerpt?: string | undefined;
        readTimeMinutes?: number | undefined;
        publishedAt?: Date | null | undefined;
        isPublished?: boolean | undefined;
        tags?: string[] | undefined;
        relatedPostIds?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        title: string;
        category: MagazineCategory;
        content: string;
        slug?: string | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        excerpt?: string | undefined;
        readTimeMinutes?: number | undefined;
        publishedAt?: Date | null | undefined;
        isPublished?: boolean | undefined;
        tags?: string[] | undefined;
        relatedPostIds?: string[] | undefined;
    };
}, {
    body: {
        title: string;
        category: MagazineCategory;
        content: string;
        slug?: string | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        excerpt?: string | undefined;
        readTimeMinutes?: number | undefined;
        publishedAt?: Date | null | undefined;
        isPublished?: boolean | undefined;
        tags?: string[] | undefined;
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
        heroImageUrl: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        readTimeMinutes: z.ZodOptional<z.ZodNumber>;
        publishedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
        isPublished: z.ZodOptional<z.ZodBoolean>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        relatedPostIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        title?: string | undefined;
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        excerpt?: string | undefined;
        content?: string | undefined;
        readTimeMinutes?: number | undefined;
        publishedAt?: Date | null | undefined;
        isPublished?: boolean | undefined;
        tags?: string[] | undefined;
        relatedPostIds?: string[] | undefined;
    }, {
        title?: string | undefined;
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        excerpt?: string | undefined;
        content?: string | undefined;
        readTimeMinutes?: number | undefined;
        publishedAt?: Date | null | undefined;
        isPublished?: boolean | undefined;
        tags?: string[] | undefined;
        relatedPostIds?: string[] | undefined;
    }>, {
        title?: string | undefined;
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        excerpt?: string | undefined;
        content?: string | undefined;
        readTimeMinutes?: number | undefined;
        publishedAt?: Date | null | undefined;
        isPublished?: boolean | undefined;
        tags?: string[] | undefined;
        relatedPostIds?: string[] | undefined;
    }, {
        title?: string | undefined;
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        excerpt?: string | undefined;
        content?: string | undefined;
        readTimeMinutes?: number | undefined;
        publishedAt?: Date | null | undefined;
        isPublished?: boolean | undefined;
        tags?: string[] | undefined;
        relatedPostIds?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        title?: string | undefined;
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        excerpt?: string | undefined;
        content?: string | undefined;
        readTimeMinutes?: number | undefined;
        publishedAt?: Date | null | undefined;
        isPublished?: boolean | undefined;
        tags?: string[] | undefined;
        relatedPostIds?: string[] | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        title?: string | undefined;
        slug?: string | undefined;
        category?: MagazineCategory | undefined;
        heroImageUrl?: string | undefined;
        authorId?: string | null | undefined;
        excerpt?: string | undefined;
        content?: string | undefined;
        readTimeMinutes?: number | undefined;
        publishedAt?: Date | null | undefined;
        isPublished?: boolean | undefined;
        tags?: string[] | undefined;
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
        avatarUrl: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        slug?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
    }, {
        name: string;
        slug?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        slug?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
    };
}, {
    body: {
        name: string;
        slug?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
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
        avatarUrl: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        slug?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
    }, {
        name?: string | undefined;
        slug?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
    }>, {
        name?: string | undefined;
        slug?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
    }, {
        name?: string | undefined;
        slug?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        slug?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        slug?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
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
        name?: string | undefined;
        slug?: string | undefined;
    }, {
        name?: string | undefined;
        slug?: string | undefined;
    }>, {
        name?: string | undefined;
        slug?: string | undefined;
    }, {
        name?: string | undefined;
        slug?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        slug?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        name?: string | undefined;
        slug?: string | undefined;
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