// src/modules/search/search.service.ts
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { elastic, ensureIndex, ping } from "../../infrastructure/search/elastic.client.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../common/errors/AppError.js";
export const PRODUCTS_INDEX = process.env.ELASTICSEARCH_PRODUCTS_INDEX || "products";
export const MAGAZINE_INDEX = process.env.ELASTICSEARCH_MAGAZINE_INDEX || "magazine";
const productIndexDefinition = {
    settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
            filter: {
                fa_edge_filter: { type: "edge_ngram", min_gram: 2, max_gram: 20 },
            },
            analyzer: {
                fa_search: {
                    type: "custom",
                    tokenizer: "standard",
                    filter: ["lowercase", "arabic_normalization", "persian_normalization"],
                },
                fa_index: {
                    type: "custom",
                    tokenizer: "standard",
                    filter: ["lowercase", "arabic_normalization", "persian_normalization", "fa_edge_filter"],
                },
            },
            normalizer: {
                lowercase_normalizer: { type: "custom", filter: ["lowercase"] },
            },
        },
    },
    mappings: {
        dynamic: false,
        properties: {
            id: { type: "keyword" },
            slug: { type: "keyword", normalizer: "lowercase_normalizer" },
            title: {
                type: "text",
                analyzer: "fa_index",
                search_analyzer: "fa_search",
                fields: { keyword: { type: "keyword" } },
            },
            subtitle: { type: "text", analyzer: "fa_index", search_analyzer: "fa_search" },
            description: { type: "text", analyzer: "fa_index", search_analyzer: "fa_search" },
            ingredients: { type: "text", analyzer: "fa_index", search_analyzer: "fa_search" },
            howToUse: { type: "text", analyzer: "fa_index", search_analyzer: "fa_search" },
            brandId: { type: "keyword" },
            brandName: {
                type: "text",
                analyzer: "fa_index",
                search_analyzer: "fa_search",
                fields: { keyword: { type: "keyword" } },
            },
            category: { type: "keyword" },
            heroImageUrl: { type: "keyword" },
            price: { type: "integer" },
            ratingAvg: { type: "half_float" },
            ratingCount: { type: "integer" },
            isActive: { type: "boolean" },
            isBestseller: { type: "boolean" },
            isFeatured: { type: "boolean" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" },
        },
    },
};
const magazineIndexDefinition = {
    settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
            filter: {
                fa_edge_filter: { type: "edge_ngram", min_gram: 2, max_gram: 20 },
            },
            analyzer: {
                fa_search: {
                    type: "custom",
                    tokenizer: "standard",
                    filter: ["lowercase", "arabic_normalization", "persian_normalization"],
                },
                fa_index: {
                    type: "custom",
                    tokenizer: "standard",
                    filter: ["lowercase", "arabic_normalization", "persian_normalization", "fa_edge_filter"],
                },
            },
            normalizer: {
                lowercase_normalizer: { type: "custom", filter: ["lowercase"] },
            },
        },
    },
    mappings: {
        dynamic: false,
        properties: {
            id: { type: "keyword" },
            slug: { type: "keyword", normalizer: "lowercase_normalizer" },
            title: {
                type: "text",
                analyzer: "fa_index",
                search_analyzer: "fa_search",
                fields: { keyword: { type: "keyword" } },
            },
            excerpt: { type: "text", analyzer: "fa_index", search_analyzer: "fa_search" },
            content: { type: "text", analyzer: "fa_index", search_analyzer: "fa_search" },
            category: { type: "keyword" },
            authorId: { type: "keyword" },
            authorName: {
                type: "text",
                analyzer: "fa_index",
                search_analyzer: "fa_search",
                fields: { keyword: { type: "keyword" } },
            },
            tags: {
                type: "text",
                analyzer: "fa_index",
                search_analyzer: "fa_search",
                fields: { keyword: { type: "keyword" } },
            },
            heroImageUrl: { type: "keyword" },
            readTimeMinutes: { type: "integer" },
            isPublished: { type: "boolean" },
            publishedAt: { type: "date" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" },
        },
    },
};
export async function ensureSearchIndices() {
    await ensureIndex(PRODUCTS_INDEX, productIndexDefinition);
    await ensureIndex(MAGAZINE_INDEX, magazineIndexDefinition);
}
// Product functions
const toDoc = (p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    ingredients: p.ingredients,
    howToUse: p.howToUse,
    brandId: p.brandId,
    brandName: p.brand?.name || "",
    category: p.category,
    heroImageUrl: p.heroImageUrl,
    price: p.price,
    ratingAvg: Number(p.ratingAvg || 0),
    ratingCount: p.ratingCount || 0,
    isActive: p.isActive,
    isBestseller: p.isBestseller,
    isFeatured: p.isFeatured,
    createdAt: p.createdAt?.toISOString?.() || p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() || p.updatedAt,
});
export async function reindexAllProducts() {
    logger.info("Reindexing all products to Elasticsearch…");
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { brand: true },
    });
    const docs = products.map(toDoc);
    const res = await elastic.helpers.bulk({
        datasource: docs,
        onDocument(doc) {
            return { index: { _index: PRODUCTS_INDEX, _id: doc.id } };
        },
        refreshOnCompletion: true,
        flushBytes: 10_000_000,
        retries: 3,
        onDrop(doc) {
            logger.error({ doc }, "Dropped doc during bulk index");
        },
    });
    logger.info({ res }, `Indexed ${docs.length} products`);
    return { count: docs.length };
}
export async function indexProductById(productId) {
    const p = await prisma.product.findUnique({
        where: { id: productId },
        include: { brand: true },
    });
    if (!p)
        return;
    await elastic.index({
        index: PRODUCTS_INDEX,
        id: p.id,
        document: toDoc(p),
        refresh: "wait_for",
    });
}
export async function deleteProductById(productId) {
    try {
        await elastic.delete({
            index: PRODUCTS_INDEX,
            id: productId,
            refresh: "wait_for",
        });
    }
    catch {
        // ignore if missing
    }
}
export async function searchProducts(opts) {
    const { q, category, priceMin, priceMax, page = 1, size = 12, sort = "relevance" } = opts;
    const from = (page - 1) * size;
    const must = [{ term: { isActive: true } }];
    const filter = [];
    const should = [];
    if (q && q.trim().length > 0) {
        should.push({
            multi_match: {
                query: q,
                type: "most_fields",
                operator: "and",
                fields: [
                    "title^4",
                    "title.keyword^6",
                    "subtitle^2",
                    "description^1",
                    "ingredients^1",
                    "howToUse^1",
                    "brandName^3",
                ],
            },
        }, { match_phrase_prefix: { title: { query: q, boost: 2 } } });
    }
    if (category)
        filter.push({ term: { category } });
    if (typeof priceMin === "number" || typeof priceMax === "number") {
        const range = {};
        if (typeof priceMin === "number")
            range.gte = priceMin;
        if (typeof priceMax === "number")
            range.lte = priceMax;
        filter.push({ range: { price: range } });
    }
    const sortClause = sort === "newest"
        ? [{ createdAt: { order: "desc" } }]
        : sort === "price_asc"
            ? [{ price: { order: "asc" } }]
            : sort === "price_desc"
                ? [{ price: { order: "desc" } }]
                : sort === "rating_desc"
                    ? [{ ratingAvg: { order: "desc" } }, { ratingCount: { order: "desc" } }]
                    : undefined; // relevance
    const query = should.length > 0
        ? { bool: { must, filter, should, minimum_should_match: 1 } }
        : { bool: { must, filter } };
    const res = await elastic.search({
        index: PRODUCTS_INDEX,
        from,
        size,
        query,
        sort: sortClause,
    });
    const items = res.hits.hits.map((h) => ({ id: h._id, ...h._source }));
    const total = typeof res.hits.total === "number"
        ? res.hits.total
        : res.hits.total?.value || 0;
    return { items, total, page, size, took: res.took };
}
// Magazine functions
const toMagazineDoc = (post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    authorId: post.authorId,
    authorName: post.author?.name || "",
    tags: post.tags?.map((t) => t.tag.name).join(" ") || "",
    heroImageUrl: post.heroImageUrl,
    readTimeMinutes: post.readTimeMinutes,
    isPublished: post.isPublished,
    publishedAt: post.publishedAt?.toISOString() || null,
    createdAt: post.createdAt?.toISOString() || post.createdAt,
    updatedAt: post.updatedAt?.toISOString() || post.updatedAt,
});
export async function reindexAllMagazinePosts() {
    logger.info("Reindexing all magazine posts to Elasticsearch…");
    const posts = await prisma.magazinePost.findMany({
        where: { isPublished: true },
        include: {
            author: true,
            tags: {
                include: {
                    tag: true,
                },
            },
        },
    });
    const docs = posts.map(toMagazineDoc);
    if (docs.length === 0) {
        logger.warn("No published magazine posts found to index");
        return { count: 0 };
    }
    const res = await elastic.helpers.bulk({
        datasource: docs,
        onDocument(doc) {
            return { index: { _index: MAGAZINE_INDEX, _id: doc.id } };
        },
        refreshOnCompletion: true,
        flushBytes: 10_000_000,
        retries: 3,
        onDrop(doc) {
            logger.error({ doc }, "Dropped doc during bulk index");
        },
    });
    logger.info({ res }, `Indexed ${docs.length} magazine posts`);
    return { count: docs.length };
}
export async function indexMagazinePostById(postId) {
    const post = await prisma.magazinePost.findUnique({
        where: { id: postId },
        include: {
            author: true,
            tags: {
                include: {
                    tag: true,
                },
            },
        },
    });
    if (!post)
        return;
    await elastic.index({
        index: MAGAZINE_INDEX,
        id: post.id,
        document: toMagazineDoc(post),
        refresh: "wait_for",
    });
}
export async function deleteMagazinePostById(postId) {
    try {
        await elastic.delete({
            index: MAGAZINE_INDEX,
            id: postId,
            refresh: "wait_for",
        });
    }
    catch {
        // ignore if missing
    }
}
/**
 * Search magazine posts with Elasticsearch fallback to Prisma
 */
export async function searchMagazinePosts(opts) {
    const { q, category, tags, page = 1, size = 9, sort = "relevance" } = opts;
    // Check if Elasticsearch is available
    const esAvailable = await ping().catch(() => false);
    // If ES is not available or no search query, fallback to Prisma
    if (!esAvailable || (!q && !category && !tags)) {
        logger.info("Using Prisma fallback for magazine search");
        return await searchMagazinePostsWithPrisma(opts);
    }
    try {
        return await searchMagazinePostsWithElasticsearch(opts);
    }
    catch (error) {
        logger.error({ error, opts }, "Elasticsearch search failed, falling back to Prisma");
        return await searchMagazinePostsWithPrisma(opts);
    }
}
/**
 * Search magazine posts using Elasticsearch
 */
async function searchMagazinePostsWithElasticsearch(opts) {
    const { q, category, tags, page = 1, size = 9, sort = "relevance" } = opts;
    const from = (page - 1) * size;
    const must = [{ term: { isPublished: true } }];
    const filter = [];
    const should = [];
    // Search query
    if (q && q.trim().length > 0) {
        const trimmedQuery = q.trim();
        should.push(
        // Exact phrase match in title (highest priority)
        {
            match_phrase: {
                title: {
                    query: trimmedQuery,
                    boost: 10,
                },
            },
        }, 
        // Prefix match in title
        {
            match_phrase_prefix: {
                title: {
                    query: trimmedQuery,
                    boost: 5,
                },
            },
        }, 
        // Multi-field fuzzy search
        {
            multi_match: {
                query: trimmedQuery,
                type: "best_fields",
                fields: [
                    "title^4",
                    "excerpt^3",
                    "content^2",
                    "authorName^2",
                    "tags^2",
                ],
                fuzziness: "AUTO",
                prefix_length: 2,
                operator: "or",
            },
        }, 
        // Cross-fields search
        {
            multi_match: {
                query: trimmedQuery,
                type: "cross_fields",
                fields: ["title^3", "excerpt^2", "content"],
                operator: "and",
            },
        });
    }
    // Category filter
    if (category) {
        filter.push({ term: { category } });
    }
    // Tags filter
    if (tags && tags.length > 0) {
        filter.push({
            bool: {
                should: tags.map((tag) => ({
                    match: {
                        tags: {
                            query: tag,
                            fuzziness: "AUTO",
                        },
                    },
                })),
                minimum_should_match: 1,
            },
        });
    }
    // Build query
    const query = should.length > 0
        ? { bool: { must, filter, should, minimum_should_match: 1 } }
        : { bool: { must, filter } };
    // Sorting
    const sortClause = sort === "newest"
        ? [{ publishedAt: { order: "desc", unmapped_type: "date" } }, { createdAt: { order: "desc" } }]
        : sort === "oldest"
            ? [{ publishedAt: { order: "asc", unmapped_type: "date" } }, { createdAt: { order: "asc" } }]
            : undefined; // relevance (default _score)
    logger.debug({ query, sort: sortClause, from, size }, "Elasticsearch magazine query");
    const res = await elastic.search({
        index: MAGAZINE_INDEX,
        from,
        size,
        query,
        sort: sortClause,
        highlight: {
            fields: {
                title: {
                    number_of_fragments: 0,
                    pre_tags: ["<mark>"],
                    post_tags: ["</mark>"],
                },
                excerpt: {
                    number_of_fragments: 1,
                    fragment_size: 150,
                    pre_tags: ["<mark>"],
                    post_tags: ["</mark>"],
                },
                content: {
                    number_of_fragments: 2,
                    fragment_size: 150,
                    pre_tags: ["<mark>"],
                    post_tags: ["</mark>"],
                },
            },
        },
        track_total_hits: true,
    });
    const items = res.hits.hits.map((h) => ({
        id: h._id,
        ...h._source,
        _score: h._score,
        _highlights: h.highlight || {},
    }));
    const total = typeof res.hits.total === "number"
        ? res.hits.total
        : res.hits.total?.value || 0;
    const totalPages = Math.ceil(total / size);
    logger.info({ total, page, totalPages, took: res.took }, "Magazine search completed (Elasticsearch)");
    return {
        items,
        total,
        page,
        size,
        totalPages,
        took: res.took,
        source: "elasticsearch",
    };
}
/**
 * Fallback: Search magazine posts using Prisma
 */
async function searchMagazinePostsWithPrisma(opts) {
    const { q, category, tags, page = 1, size = 9, sort = "newest" } = opts;
    const skip = (page - 1) * size;
    // Build where clause
    const where = { isPublished: true };
    if (q && q.trim().length > 0) {
        where.OR = [
            { title: { contains: q.trim(), mode: "insensitive" } },
            { excerpt: { contains: q.trim(), mode: "insensitive" } },
            { content: { contains: q.trim(), mode: "insensitive" } },
        ];
    }
    if (category) {
        where.category = category;
    }
    if (tags && tags.length > 0) {
        where.tags = {
            some: {
                tag: {
                    name: {
                        in: tags,
                    },
                },
            },
        };
    }
    // Build orderBy clause
    const orderBy = sort === "oldest"
        ? [{ publishedAt: "asc" }, { createdAt: "asc" }]
        : [{ publishedAt: "desc" }, { createdAt: "desc" }]; // newest is default
    const [posts, total] = await Promise.all([
        prisma.magazinePost.findMany({
            where,
            orderBy,
            skip,
            take: size,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        }),
        prisma.magazinePost.count({ where }),
    ]);
    const items = posts.map((post) => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        authorId: post.authorId,
        authorName: post.author?.name || "",
        tags: post.tags.map((t) => t.tag.name).join(" "),
        heroImageUrl: post.heroImageUrl,
        readTimeMinutes: post.readTimeMinutes,
        isPublished: post.isPublished,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    }));
    const totalPages = Math.ceil(total / size);
    logger.info({ total, page, totalPages }, "Magazine search completed (Prisma)");
    return {
        items,
        total,
        page,
        size,
        totalPages,
        source: "database",
    };
}
//# sourceMappingURL=search.service.js.map