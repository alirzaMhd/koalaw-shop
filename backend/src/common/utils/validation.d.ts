import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
export declare function toLatinDigits(input?: string): string;
export declare function normalizeIranPhone(raw: string): string;
export declare function isValidIranMobile(n: string): boolean;
export declare function parseSafe<T>(schema: ZodSchema<T>, data: unknown): Promise<T>;
export declare function validate(schema: ZodSchema<any>): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validation.d.ts.map