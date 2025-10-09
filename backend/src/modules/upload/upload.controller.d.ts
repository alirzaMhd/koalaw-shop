import type { RequestHandler } from "express";
export declare const uploadMiddleware: RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
declare class UploadController {
    uploadProductImage: RequestHandler;
}
export declare const uploadController: UploadController;
export {};
//# sourceMappingURL=upload.controller.d.ts.map