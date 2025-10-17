// backend/src/modules/magazine/magazine.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { magazineService } from './magazine.service.js';
import AppError from '../../common/errors/AppError.js';
import { z } from 'zod';

export class MagazineController {
  // POSTS
  listPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        page = 1,
        pageSize = 20,
        category,
        tag,
        tags,
        authorSlug,
        q,
        onlyPublished = true,
      } = req.query as any;

      const tagSlugs = (tags as string[] | undefined) ?? (tag ? [String(tag)] : undefined);

      type ListPostOptions = Parameters<typeof magazineService.listPosts>[0];

      const options: ListPostOptions = {
        page: Number(page),
        pageSize: Number(pageSize),
        onlyPublished: onlyPublished === true || String(onlyPublished) === 'true',
      };

      if (category) options.category = category;
      if (tagSlugs) options.tagSlugs = tagSlugs;
      if (authorSlug) options.authorSlug = authorSlug as string;
      if (q) options.q = q as string;

      const result = await magazineService.listPosts(options);

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };

  getPostBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const post = await magazineService.getPostBySlug(slug!);
      res.json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  };

  // NEW HANDLER
  getPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
      const post = await magazineService.getPostById(id);
      res.json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  };

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await magazineService.createPost(req.body);
      res.status(201).json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  };

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await magazineService.updatePost(req.params.id!, req.body);
      res.json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await magazineService.deletePost(req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ... (rest of the controller remains the same)

  // AUTHORS
  listAuthors = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const authors = await magazineService.listAuthors();
      res.json({ success: true, data: authors });
    } catch (err) {
      next(err);
    }
  };

  getAuthorBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const author = await magazineService.getAuthorBySlug(slug!);
      res.json({ success: true, data: author });
    } catch (err) {
      next(err);
    }
  };

  createAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const author = await magazineService.createAuthor(req.body);
      res.status(201).json({ success: true, data: author });
    } catch (err) {
      next(err);
    }
  };

  updateAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const author = await magazineService.updateAuthor(req.params.id!, req.body);
      res.json({ success: true, data: author });
    } catch (err) {
      next(err);
    }
  };

  deleteAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await magazineService.deleteAuthor(req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // TAGS
  listTags = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = await magazineService.listTags();
      res.json({ success: true, data: tags });
    } catch (err) {
      next(err);
    }
  };

  createTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tag = await magazineService.createTag(req.body);
      res.status(201).json({ success: true, data: tag });
    } catch (err) {
      next(err);
    }
  };

  updateTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tag = await magazineService.updateTag(req.params.id!, req.body);
      res.json({ success: true, data: tag });
    } catch (err) {
      next(err);
    }
  };

  deleteTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await magazineService.deleteTag(req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
  // CATEGORIES
  listCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const cats = await magazineService.listCategories();
      res.json({ success: true, data: cats });
    } catch (err) {
      next(err);
    }
  };

  getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const cat = await magazineService.getCategoryBySlug(slug!);
      res.json({ success: true, data: cat });
    } catch (err) {
      next(err);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cat = await magazineService.createCategory(req.body);
      res.status(201).json({ success: true, data: cat });
    } catch (err) {
      next(err);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cat = await magazineService.updateCategory(req.params.id!, req.body);
      res.json({ success: true, data: cat });
    } catch (err) {
      next(err);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await magazineService.deleteCategory(req.params.id!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const magazineController = new MagazineController();