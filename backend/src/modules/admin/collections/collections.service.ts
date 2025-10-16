import { prisma } from "../../../infrastructure/db/prismaClient.js";
import { AppError } from "../../../common/errors/AppError.js";

class CollectionsService {
  async list() {
    return prisma.collection.findMany({
      select: {
        id: true,
        name: true,
        heroImageUrl: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async create(input: { name: string; heroImageUrl?: string | null }) {
    const created = await prisma.collection.create({
      data: {
        name: input.name,
        heroImageUrl: input.heroImageUrl ?? null,
      },
      select: { id: true, name: true, heroImageUrl: true },
    });
    return { collection: created };
  }

  async update(id: string, input: { name?: string; heroImageUrl?: string | null }) {
    const exists = await prisma.collection.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new AppError("کالکشن یافت نشد.", 404, "COLLECTION_NOT_FOUND");

    const data: any = {};
    if (typeof input.name === "string") data.name = input.name;
    if (input.heroImageUrl !== undefined) {
      const v = (input.heroImageUrl ?? "").toString().trim();
      data.heroImageUrl = v ? v : null;
    }

    const updated = await prisma.collection.update({
      where: { id },
      data,
      select: { id: true, name: true, heroImageUrl: true },
    });
    return { collection: updated };
  }

  async delete(id: string) {
    const exists = await prisma.collection.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new AppError("کالکشن یافت نشد.", 404, "COLLECTION_NOT_FOUND");
    await prisma.collection.delete({ where: { id } });
    return { deleted: true };
  }
}

export const collectionsService = new CollectionsService();