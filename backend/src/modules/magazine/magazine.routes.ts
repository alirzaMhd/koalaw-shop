// backend/src/modules/magazine/magazine.routes.ts
import { Router } from "express";
import { magazineController } from "./magazine.controller.js";
import { authGuard } from "../../common/middlewares/authGuard.js";
import { validate } from "../../common/utils/validation.js";
import {
  listPostsSchema,
  getPostBySlugSchema,
  createPostSchema,
  updatePostSchema,
  deletePostSchema,
  createAuthorSchema,
  updateAuthorSchema,
  deleteAuthorSchema,
  createTagSchema,
  updateTagSchema,
  deleteTagSchema,
} from "./magazine.validators.js";

const router = Router();

// Public
router.get('/posts', validate(listPostsSchema), magazineController.listPosts);
router.get('/posts/:slug', validate(getPostBySlugSchema), magazineController.getPostBySlug);

router.get("/authors", magazineController.listAuthors);
router.get("/authors/:slug", magazineController.getAuthorBySlug);

router.get("/tags", magazineController.listTags);

// Admin (protect as needed)
router.get("/posts/:id", authGuard, magazineController.getPostById); // GET BY ID FOR ADMIN
router.post("/posts", authGuard, validate(createPostSchema), magazineController.createPost);
router.put("/posts/:id", authGuard, validate(updatePostSchema), magazineController.updatePost); // Use PUT for full updates
router.delete("/posts/:id", authGuard, validate(deletePostSchema), magazineController.deletePost);

router.post("/authors", authGuard, validate(createAuthorSchema), magazineController.createAuthor);
router.put("/authors/:id", authGuard, validate(updateAuthorSchema), magazineController.updateAuthor);
router.delete("/authors/:id", authGuard, validate(deleteAuthorSchema), magazineController.deleteAuthor);

router.post("/tags", authGuard, validate(createTagSchema), magazineController.createTag);
router.put("/tags/:id", authGuard, validate(updateTagSchema), magazineController.updateTag);
router.delete("/tags/:id", authGuard, validate(deleteTagSchema), magazineController.deleteTag);

export default router;