import { prisma } from "../../../infrastructure/db/prismaClient.js";
import { AppError } from "../../../common/errors/AppError.js";
class CollectionsService {
    async list() {
        return prisma.collection.findMany({
            select: {
                id: true,
                name: true,
                heroImageUrl: true, // include in admin list
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
            },
            select: { id: true, name: true, heroImageUrl: true },
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
        // allow explicit null to clear image; ignore if undefined
        if (input.heroImageUrl !== undefined)
            data.heroImageUrl = input.heroImageUrl || null;
        const updated = await prisma.collection.update({
            where: { id },
            data,
            select: { id: true, name: true, heroImageUrl: true },
        });
        return { collection: updated };
    }
}
export const collectionsService = new CollectionsService();
//# sourceMappingURL=collections.service.js.map