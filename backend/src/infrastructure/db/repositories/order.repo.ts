// src/infrastructure/db/repositories/order.repo.ts
// Orders data access (reads/writes, includes items and payments when needed).

import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";

const includeDetail = {
  items: { orderBy: { position: "asc" as const } },
  payments: { orderBy: { createdAt: "desc" as const } },
} as const;

export const orderRepo = {
  // Queries
  findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: includeDetail });
  },
  findByNumber(orderNumber: string) {
    return prisma.order.findUnique({ where: { orderNumber }, include: includeDetail });
  },
  findForUser(id: string, userId: string) {
    return prisma.order.findFirst({ where: { id, userId }, include: includeDetail });
  },
  count(where?: Prisma.OrderWhereInput) {
    return prisma.order.count({ where });
  },
  list(where: Prisma.OrderWhereInput, page = 1, perPage = 12) {
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
  create(data: Prisma.OrderCreateInput, items?: Array<Prisma.OrderItemUncheckedCreateInput>, payment?: Prisma.PaymentUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data });
      if (items?.length) {
        await tx.orderItem.createMany({
          data: items.map((it, idx) => ({ ...it, orderId: order.id, position: typeof it.position === "number" ? it.position : idx })),
        });
      }
      if (payment) {
        await tx.payment.create({ data: { ...payment, orderId: order.id } });
      }
      return order;
    });
  },
  updateStatus(id: string, status: Prisma.OrderUpdateInput["status"]) {
    return prisma.order.update({ where: { id }, data: { status } });
  },
  createPayment(orderId: string, data: Prisma.PaymentUncheckedCreateInput) {
    return prisma.payment.create({ data: { ...data, orderId } });
  },
  listItems(orderId: string) {
    return prisma.orderItem.findMany({ where: { orderId }, orderBy: { position: "asc" } });
  },
};

export default orderRepo;