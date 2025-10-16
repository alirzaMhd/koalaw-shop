import { z } from "zod";
import { collectionsService } from "./collections.service.js";
import { AppError } from "../../../common/errors/AppError.js";
const createCollectionSchema = z.object({
    name: z.string().min(1, "نام کالکشن الزامی است."),
    // accept absolute or relative URLs; do not force URL() format
    heroImageUrl: z.string().trim().min(1).optional().nullable(),
});
const updateCollectionSchema = z.object({
    name: z.string().min(1).optional(),
    heroImageUrl: z.string().trim().optional().nullable(),
});
export const collectionsController = {
    list: async (_req, res, next) => {
        try {
            const collections = await collectionsService.list();
            return res.json({ success: true, data: { collections } });
        }
        catch (err) {
            next(err);
        }
    },
    create: async (req, res, next) => {
        try {
            const body = await createCollectionSchema.parseAsync(req.body ?? {});
            const created = await collectionsService.create(body);
            return res.status(201).json({ success: true, data: created });
        }
        catch (err) {
            next(err);
        }
    },
    update: async (req, res, next) => {
        try {
            const { id } = req.params;
            const body = await updateCollectionSchema.parseAsync(req.body ?? {});
            const updated = await collectionsService.update(id, body);
            return res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=collections.controller.js.map