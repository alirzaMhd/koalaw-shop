// src/infrastructure/db/repositories/product.repo.ts
// Product data access layer. Keep logic in services; repos only encapsulate Prisma calls.
import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient.js";
export const productRepo = {
  // Queries
  findById(id, include) {
    return prisma.product.findUnique({ where: { id }, include });
  },
  findBySlug(slug, include) {
    return prisma.product.findUnique({ where: { slug }, include });
  },
  count(where) {
    return prisma.product.count({ where });
  },
  findMany(args) {
    const { where, orderBy, skip, take, include } = args;
    return prisma.product.findMany({ where, orderBy, skip, take, include });
  },
  // Mutations
  create(data) {
    return prisma.product.create({ data });
  },
  update(id, data) {
    return prisma.product.update({ where: { id }, data });
  },
  delete(id) {
    return prisma.product.delete({ where: { id } });
  },
  // Images
  listImages(productId) {
    return prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: "asc" },
    });
  },
  addImage(productId, data) {
    return prisma.productImage.create({ data: { ...data, productId } });
  },
  updateImage(id, data) {
    return prisma.productImage.update({ where: { id }, data });
  },
  removeImage(id) {
    return prisma.productImage.delete({ where: { id } });
  },
  replaceImages(productId, images) {
    return prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId } });
      if (!images.length) return [];
      await tx.productImage.createMany({
        data: images.map((img, idx) => ({
          ...img,
          productId,
          position: typeof img.position === "number" ? img.position : idx,
        })),
      });
      return tx.productImage.findMany({
        where: { productId },
        orderBy: { position: "asc" },
      });
    });
  },
  // Variants
  listVariants(productId) {
    return prisma.productVariant.findMany({
      where: { productId },
      orderBy: { position: "asc" },
    });
  },
  addVariant(productId, data) {
    return prisma.productVariant.create({ data: { ...data, productId } });
  },
  updateVariant(id, data) {
    return prisma.productVariant.update({ where: { id }, data });
  },
  removeVariant(id) {
    return prisma.productVariant.delete({ where: { id } });
  },
  replaceVariants(productId, variants) {
    return prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId } });
      if (!variants.length) return [];
      await tx.productVariant.createMany({
        data: variants.map((v, idx) => ({
          ...v,
          productId,
          position: typeof v.position === "number" ? v.position : idx,
        })),
      });
      return tx.productVariant.findMany({
        where: { productId },
        orderBy: { position: "asc" },
      });
    });
  },
};
export default productRepo;
//# sourceMappingURL=product.repo.js.map
