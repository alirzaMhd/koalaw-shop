import { z } from "zod";
import { collectionsService } from "./collections.service.js";
const createSchema = z.object({
    name: z.string().min(1, "نام کالکشن الزامی است."),
    heroImageUrl: z.string().trim().optional().nullable(),
    subtitle: z.string().trim().optional().nullable(), // NEW
    isFeatured: z.boolean().optional(), // NEW
    displayOrder: z.number().int().optional(), // NEW
});
const updateSchema = z.object({
    name: z.string().min(1).optional(),
    heroImageUrl: z.string().trim().optional().nullable(),
    subtitle: z.string().trim().optional().nullable(), // NEW
    isFeatured: z.boolean().optional(), // NEW
    displayOrder: z.number().int().optional(), // NEW
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
            const body = await createSchema.parseAsync(req.body ?? {});
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
            const body = await updateSchema.parseAsync(req.body ?? {});
            const updated = await collectionsService.update(id, body);
            return res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    },
    delete: async (req, res, next) => {
        try {
            const { id } = req.params;
            await collectionsService.delete(id);
            return res.json({ success: true, data: { deleted: true } });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=collections.controller.js.map