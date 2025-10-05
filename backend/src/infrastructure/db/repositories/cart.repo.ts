// src/infrastructure/db/repositories/cart.repo.ts
// Cart data access operations (snapshots live on cart_items).

import { Prisma } from "../../../../../node_modules/.prisma/client/index.js";
import { prisma } from "../prismaClient.js";

export const cartRepo = {
  // Carts
  findById(id: string) {
    return prisma.cart.findUnique({ where: { id } });
  },
  findActiveByUser(userId: string) {
    return prisma.cart.findFirst({ where: { userId, status: "ACTIVE" } });
  },
  findByAnonymousId(anonymousId: string) {
    return prisma.cart.findFirst({ where: { anonymousId } });
  },
  createForUser(userId: string) {
    return prisma.cart.create({ data: { userId, status: "ACTIVE" } });
  },
  createForAnonymous(anonymousId: string) {
    return prisma.cart.create({ data: { anonymousId, status: "ACTIVE" } });
  },
  updateStatus(id: string, status: "ACTIVE" | "CONVERTED" | "ABANDONED") {
    return prisma.cart.update({ where: { id }, data: { status } });
  },

  // Items
  listItems(cartId: string) {
    return prisma.cartItem.findMany({ where: { cartId }, orderBy: { createdAt: "asc" } });
  },
  findItemById(itemId: string) {
    return prisma.cartItem.findUnique({ where: { id: itemId } });
  },
  findItemByProductVariant(cartId: string, productId: string, variantId?: string | null) {
    return prisma.cartItem.findFirst({ where: { cartId, productId, variantId: variantId || null } });
  },
  addItem(data: Prisma.CartItemUncheckedCreateInput) {
    return prisma.cartItem.create({ data });
  },
  updateItem(id: string, data: Prisma.CartItemUncheckedUpdateInput) {
    return prisma.cartItem.update({ where: { id }, data });
  },
  removeItem(id: string) {
    return prisma.cartItem.delete({ where: { id } });
  },
  clearItems(cartId: string) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  },

  // Transactions for merge flows can be composed at service level.
};

export default cartRepo;