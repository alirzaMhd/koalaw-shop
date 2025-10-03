// src/infrastructure/db/repositories/order.repo.ts
// Orders data access (reads/writes, includes items and payments when needed).
import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient.js";
const includeDetail = {
  items: { orderBy: { position: "asc" } },
  payments: { orderBy: { createdAt: "desc" } },
};
export const orderRepo = {
  // Queries
  findById(id) {
    return prisma.order.findUnique({ where: { id }, include: includeDetail });
  },
  findByNumber(orderNumber) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: includeDetail,
    });
  },
  findForUser(id, userId) {
    return prisma.order.findFirst({
      where: { id, userId },
      include: includeDetail,
    });
  },
  count(where) {
    return prisma.order.count({ where });
  },
  list(where, page = 1, perPage = 12) {
    const skip = (page - 1) * perPage;
    return prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currencyCode: true,
        placedAt: true,
        _count: { select: { items: true } },
      },
    });
  },
  // Mutations
  create(data, items, payment) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data });
      if (items?.length) {
        await tx.orderItem.createMany({
          data: items.map((it, idx) => ({
            ...it,
            orderId: order.id,
            position: typeof it.position === "number" ? it.position : idx,
          })),
        });
      }
      if (payment) {
        await tx.payment.create({ data: { ...payment, orderId: order.id } });
      }
      return order;
    });
  },
  updateStatus(id, status) {
    return prisma.order.update({ where: { id }, data: { status } });
  },
  createPayment(orderId, data) {
    return prisma.payment.create({ data: { ...data, orderId } });
  },
  listItems(orderId) {
    return prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { position: "asc" },
    });
  },
};
export default orderRepo;
//# sourceMappingURL=order.repo.js.map
