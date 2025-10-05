import type { Request, Response, NextFunction } from 'express';
export declare class MagazineController {
    listPosts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPostBySlug: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createPost: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updatePost: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deletePost: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listAuthors: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAuthorBySlug: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createAuthor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateAuthor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteAuthor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listTags: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    createTag: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateTag: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteTag: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const magazineController: MagazineController;
//# sourceMappingURL=magazine.controller.d.ts.map