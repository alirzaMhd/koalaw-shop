// src/infrastructure/db/repositories/product.repo.ts
// Product data access layer. Keep logic in services; repos only encapsulate Prisma calls.

import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";

export type ProductWhere = Prisma.ProductWhereInput;
export type ProductOrderBy = Prisma.ProductOrderByWithRelationInput;

export const productRepo = {
  // Queries
  findById(id: string, include?: Prisma.ProductInclude) {
    return prisma.product.findUnique({ where: { id }, include });
  },
  findBySlug(slug: string, include?: Prisma.ProductInclude) {
    return prisma.product.findUnique({ where: { slug }, include });
  },
  count(where?: ProductWhere) {
    return prisma.product.count({ where });
  },
  findMany(args: {
    where?: ProductWhere;
    orderBy?: ProductOrderBy | ProductOrderBy[];
    skip?: number;
    take?: number;
    include?: Prisma.ProductInclude;
  }) {
    const { where, orderBy, skip, take, include } = args;
    return prisma.product.findMany({ where, orderBy, skip, take, include });
  },

  // Mutations
  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  },
  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.product.delete({ where: { id } });
  },

  // Images
  listImages(productId: string) {
    return prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: "asc" },
    });
  },
  addImage(productId: string, data: Omit<Prisma.ProductImageUncheckedCreateInput, "productId">) {
    return prisma.productImage.create({ data: { ...data, productId } });
  },
  updateImage(id: string, data: Prisma.ProductImageUncheckedUpdateInput) {
    return prisma.productImage.update({ where: { id }, data });
  },
  removeImage(id: string) {
    return prisma.productImage.delete({ where: { id } });
  },
  replaceImages(productId: string, images: Array<Omit<Prisma.ProductImageUncheckedCreateInput, "productId">>) {
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
      return tx.productImage.findMany({ where: { productId }, orderBy: { position: "asc" } });
    });
  },

  // Variants
  listVariants(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId },
      orderBy: { position: "asc" },
    });
  },
  addVariant(productId: string, data: Omit<Prisma.ProductVariantUncheckedCreateInput, "productId">) {
    return prisma.productVariant.create({ data: { ...data, productId } });
  },
  updateVariant(id: string, data: Prisma.ProductVariantUncheckedUpdateInput) {
    return prisma.productVariant.update({ where: { id }, data });
  },
  removeVariant(id: string) {
    return prisma.productVariant.delete({ where: { id } });
  },
  replaceVariants(productId: string, variants: Array<Omit<Prisma.ProductVariantUncheckedCreateInput, "productId">>) {
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
      return tx.productVariant.findMany({ where: { productId }, orderBy: { position: "asc" } });
    });
  },
};

export default productRepo;