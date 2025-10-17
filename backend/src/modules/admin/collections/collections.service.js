import { prisma } from "../../../infrastructure/db/prismaClient.js";
import { AppError } from "../../../common/errors/AppError.js";
class CollectionsService {
    async list() {
        return prisma.collection.findMany({
            select: {
                id: true,
                name: true,
                heroImageUrl: true,
                subtitle: true, // NEW
                isFeatured: true, // NEW
                displayOrder: true, // NEW
                _count: { select: { products: true } },
            },
            orderBy: { name: "asc" },
        });
    }
    async create(input) {
        const created = await prisma.collection.create({
            data: {
                name: input.name,
                heroImageUrl: input.heroImageUrl ?? null,
                subtitle: input.subtitle ?? null,
                isFeatured: input.isFeatured ?? false,
                displayOrder: input.displayOrder ?? 0,
            },
            select: {
                id: true,
                name: true,
                heroImageUrl: true,
                subtitle: true,
                isFeatured: true,
                displayOrder: true,
            },
        });
        return { collection: created };
    }
    async update(id, input) {
        const exists = await prisma.collection.findUnique({ where: { id }, select: { id: true } });
        if (!exists)
            throw new AppError("کالکشن یافت نشد.", 404, "COLLECTION_NOT_FOUND");
        const data = {};
        if (typeof input.name === "string")
            data.name = input.name;
        if (input.heroImageUrl !== undefined) {
            const v = (input.heroImageUrl ?? "").toString().trim();
            data.heroImageUrl = v ? v : null;
        }
        if (input.subtitle !== undefined) {
            const v = (input.subtitle ?? "").toString().trim();
            data.subtitle = v ? v : null;
        }
        if (typeof input.isFeatured === "boolean")
            data.isFeatured = input.isFeatured;
        if (typeof input.displayOrder === "number")
            data.displayOrder = input.displayOrder;
        const updated = await prisma.collection.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                heroImageUrl: true,
                subtitle: true,
                isFeatured: true,
                displayOrder: true,
            },
        });
        return { collection: updated };
    }
    async delete(id) {
        const exists = await prisma.collection.findUnique({ where: { id }, select: { id: true } });
        if (!exists)
            throw new AppError("کالکشن یافت نشد.", 404, "COLLECTION_NOT_FOUND");
        await prisma.collection.delete({ where: { id } });
        return { deleted: true };
    }
}
export const collectionsService = new CollectionsService();
//# sourceMappingURL=collections.service.js.map