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
  createMagazineCategorySchema,
  updateMagazineCategorySchema,
  deleteMagazineCategorySchema,
  getMagazineCategoryBySlugSchema,
} from "./magazine.validators.js";

const router = Router();

// ========== ADMIN ROUTES (protected, use ID) ==========
router.get("/admin/posts/:id", authGuard, magazineController.getPostById);
router.post("/admin/posts", authGuard, validate(createPostSchema), magazineController.createPost);
router.put("/admin/posts/:id", authGuard, validate(updatePostSchema), magazineController.updatePost);
router.delete("/admin/posts/:id", authGuard, validate(deletePostSchema), magazineController.deletePost);

router.get("/admin/authors", authGuard, magazineController.listAuthors);
router.post("/admin/authors", authGuard, validate(createAuthorSchema), magazineController.createAuthor);
router.put("/admin/authors/:id", authGuard, validate(updateAuthorSchema), magazineController.updateAuthor);
router.delete("/admin/authors/:id", authGuard, validate(deleteAuthorSchema), magazineController.deleteAuthor);

router.get("/admin/tags", authGuard, magazineController.listTags);
router.post("/admin/tags", authGuard, validate(createTagSchema), magazineController.createTag);
router.put("/admin/tags/:id", authGuard, validate(updateTagSchema), magazineController.updateTag);
router.delete("/admin/tags/:id", authGuard, validate(deleteTagSchema), magazineController.deleteTag);

// NEW: ADMIN CATEGORIES
router.get("/admin/categories", authGuard, magazineController.listCategories);
router.post(
  "/admin/categories",
  authGuard,
  validate(createMagazineCategorySchema),
  magazineController.createCategory
);
router.put(
  "/admin/categories/:id",
  authGuard,
  validate(updateMagazineCategorySchema),
  magazineController.updateCategory
);
router.delete(
  "/admin/categories/:id",
  authGuard,
  validate(deleteMagazineCategorySchema),
  magazineController.deleteCategory
);

// ========== PUBLIC ROUTES (use slug) ==========
router.get('/posts', validate(listPostsSchema), magazineController.listPosts);
router.get('/posts/:slug', validate(getPostBySlugSchema), magazineController.getPostBySlug);

router.get("/authors", magazineController.listAuthors);
router.get("/authors/:slug", magazineController.getAuthorBySlug);

router.get("/tags", magazineController.listTags);
router.get("/categories", magazineController.listCategories);
router.get("/categories/:slug", validate(getMagazineCategoryBySlugSchema), magazineController.getCategoryBySlug);

export default router;