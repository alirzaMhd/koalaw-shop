// src/infrastructure/db/repositories/cart.repo.ts
// Cart data access operations (snapshots live on cart_items).
import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient.js";
export const cartRepo = {
  // Carts
  findById(id) {
    return prisma.cart.findUnique({ where: { id } });
  },
  findActiveByUser(userId) {
    return prisma.cart.findFirst({ where: { userId, status: "active" } });
  },
  findByAnonymousId(anonymousId) {
    return prisma.cart.findFirst({ where: { anonymousId } });
  },
  createForUser(userId) {
    return prisma.cart.create({ data: { userId, status: "active" } });
  },
  createForAnonymous(anonymousId) {
    return prisma.cart.create({ data: { anonymousId, status: "active" } });
  },
  updateStatus(id, status) {
    return prisma.cart.update({ where: { id }, data: { status } });
  },
  // Items
  listItems(cartId) {
    return prisma.cartItem.findMany({
      where: { cartId },
      orderBy: { createdAt: "asc" },
    });
  },
  findItemById(itemId) {
    return prisma.cartItem.findUnique({ where: { id: itemId } });
  },
  findItemByProductVariant(cartId, productId, variantId) {
    return prisma.cartItem.findFirst({
      where: { cartId, productId, variantId: variantId || null },
    });
  },
  addItem(data) {
    return prisma.cartItem.create({ data });
  },
  updateItem(id, data) {
    return prisma.cartItem.update({ where: { id }, data });
  },
  removeItem(id) {
    return prisma.cartItem.delete({ where: { id } });
  },
  clearItems(cartId) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  },
  // Transactions for merge flows can be composed at service level.
};
export default cartRepo;
//# sourceMappingURL=cart.repo.js.map
