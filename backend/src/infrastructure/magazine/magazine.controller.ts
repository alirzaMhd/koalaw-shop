import { Request, Response, NextFunction } from 'express';
import { magazineService } from './magazine.service';
import AppError from '../../common/errors/AppError';

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

      // merge single tag and tags[]
      const tagSlugs = (tags as string[] | undefined) ?? (tag ? [String(tag)] : undefined);

      const result = await magazineService.listPosts({
        page: Number(page),
        pageSize: Number(pageSize),
        category,
        tagSlugs,
        authorSlug: authorSlug as string | undefined,
        q: q as string | undefined,
        onlyPublished: onlyPublished === true || String(onlyPublished) === 'true',
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };

  getPostBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const post = await magazineService.getPostBySlug(slug);
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
      const post = await magazineService.updatePost(req.params.id, req.body);
      res.json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await magazineService.deletePost(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

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
      const author = await magazineService.getAuthorBySlug(slug);
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
      const author = await magazineService.updateAuthor(req.params.id, req.body);
      res.json({ success: true, data: author });
    } catch (err) {
      next(err);
    }
  };

  deleteAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await magazineService.deleteAuthor(req.params.id);
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
      const tag = await magazineService.updateTag(req.params.id, req.body);
      res.json({ success: true, data: tag });
    } catch (err) {
      next(err);
    }
  };

  deleteTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await magazineService.deleteTag(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const magazineController = new MagazineController();