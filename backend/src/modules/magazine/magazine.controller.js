import { magazineService } from './magazine.service.js';
import AppError from '../../common/errors/AppError.js';
export class MagazineController {
    // POSTS
    listPosts = async (req, res, next) => {
        try {
            const { page = 1, pageSize = 20, category, tag, tags, authorSlug, q, onlyPublished = true, } = req.query;
            // merge single tag and tags[]
            const tagSlugs = tags ?? (tag ? [String(tag)] : undefined);
            // Start with the required properties.
            const options = {
                page: Number(page),
                pageSize: Number(pageSize),
                onlyPublished: onlyPublished === true || String(onlyPublished) === 'true',
            };
            // Only add optional properties if they have a value.
            if (category) {
                options.category = category;
            }
            if (tagSlugs) {
                options.tagSlugs = tagSlugs;
            }
            if (authorSlug) {
                options.authorSlug = authorSlug;
            }
            if (q) {
                options.q = q;
            }
            // --- End of Fix ---
            const result = await magazineService.listPosts(options);
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    };
    getPostBySlug = async (req, res, next) => {
        try {
            const { slug } = req.params;
            const post = await magazineService.getPostBySlug(slug);
            res.json({ success: true, data: post });
        }
        catch (err) {
            next(err);
        }
    };
    createPost = async (req, res, next) => {
        try {
            const post = await magazineService.createPost(req.body);
            res.status(201).json({ success: true, data: post });
        }
        catch (err) {
            next(err);
        }
    };
    updatePost = async (req, res, next) => {
        try {
            const post = await magazineService.updatePost(req.params.id, req.body);
            res.json({ success: true, data: post });
        }
        catch (err) {
            next(err);
        }
    };
    deletePost = async (req, res, next) => {
        try {
            await magazineService.deletePost(req.params.id);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    };
    // AUTHORS
    listAuthors = async (_req, res, next) => {
        try {
            const authors = await magazineService.listAuthors();
            res.json({ success: true, data: authors });
        }
        catch (err) {
            next(err);
        }
    };
    getAuthorBySlug = async (req, res, next) => {
        try {
            const { slug } = req.params;
            const author = await magazineService.getAuthorBySlug(slug);
            res.json({ success: true, data: author });
        }
        catch (err) {
            next(err);
        }
    };
    createAuthor = async (req, res, next) => {
        try {
            const author = await magazineService.createAuthor(req.body);
            res.status(201).json({ success: true, data: author });
        }
        catch (err) {
            next(err);
        }
    };
    updateAuthor = async (req, res, next) => {
        try {
            const author = await magazineService.updateAuthor(req.params.id, req.body);
            res.json({ success: true, data: author });
        }
        catch (err) {
            next(err);
        }
    };
    deleteAuthor = async (req, res, next) => {
        try {
            await magazineService.deleteAuthor(req.params.id);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    };
    // TAGS
    listTags = async (_req, res, next) => {
        try {
            const tags = await magazineService.listTags();
            res.json({ success: true, data: tags });
        }
        catch (err) {
            next(err);
        }
    };
    createTag = async (req, res, next) => {
        try {
            const tag = await magazineService.createTag(req.body);
            res.status(201).json({ success: true, data: tag });
        }
        catch (err) {
            next(err);
        }
    };
    updateTag = async (req, res, next) => {
        try {
            const tag = await magazineService.updateTag(req.params.id, req.body);
            res.json({ success: true, data: tag });
        }
        catch (err) {
            next(err);
        }
    };
    deleteTag = async (req, res, next) => {
        try {
            await magazineService.deleteTag(req.params.id);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    };
}
export const magazineController = new MagazineController();
//# sourceMappingURL=magazine.controller.js.map