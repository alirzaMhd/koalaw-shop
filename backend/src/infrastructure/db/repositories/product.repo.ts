// src/infrastructure/db/repositories/product.repo.ts
// Product data access layer. Keep logic in services; repos only encapsulate Prisma calls.

import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient.js";


export const productRepo = {
  // Queries
  findById(id: string, include?: any) {
    return prisma.product.findUnique({ where: { id }, include: include ?? null });
  },
  findBySlug(slug: string, include?: any) {
    return prisma.product.findUnique({ where: { slug }, include: include ?? null });
  },
  count(where?: any) {
    if (where) {
      return prisma.product.count({ where });
    }
    return prisma.product.count();
  },
  findMany(args: {
    where?: any;
    orderBy?: any | any[];
    skip?: number;
    take?: number;
    include?: any;
  }) {
    const { where, orderBy, skip, take, include } = args;
    const params: any = {};
    if (where) params.where = where;
    if (orderBy) params.orderBy = orderBy;
    if (typeof skip === "number") params.skip = skip;
    if (typeof take === "number") params.take = take;
    if (include !== undefined) params.include = include;
    return prisma.product.findMany(params);
  },

  // Mutations
  create(data: any) {
    return prisma.product.create({ data });
  },
  update(id: string, data: any) {
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
  addImage(productId: string, data: Omit<any, "productId">) {
    return prisma.productImage.create({ data: { ...data, productId } });
  },
  updateImage(id: string, data: any) {
    return prisma.productImage.update({ where: { id }, data });
  },
  removeImage(id: string) {
    return prisma.productImage.delete({ where: { id } });
  },
  replaceImages(productId: string, images: Array<Omit<any, "productId">>) {
    return prisma.$transaction(async (tx: { productImage: { deleteMany: (arg0: { where: { productId: string; }; }) => any; createMany: (arg0: { data: { productId: string; position: number; }[]; }) => any; findMany: (arg0: { where: { productId: string; }; orderBy: { position: string; }; }) => any; }; }) => {
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
  addVariant(productId: string, data: Omit<any, "productId">) {
    return prisma.productVariant.create({ data: { ...data, productId } });
  },
  updateVariant(id: string, data: any) {
    return prisma.productVariant.update({ where: { id }, data });
  },
  removeVariant(id: string) {
    return prisma.productVariant.delete({ where: { id } });
  },
  replaceVariants(productId: string, variants: Array<Omit<any, "productId">>) {
    return prisma.$transaction(async (tx: { productVariant: { deleteMany: (arg0: { where: { productId: string; }; }) => any; createMany: (arg0: { data: { productId: string; position: number; }[]; }) => any; findMany: (arg0: { where: { productId: string; }; orderBy: { position: string; }; }) => any; }; }) => {
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