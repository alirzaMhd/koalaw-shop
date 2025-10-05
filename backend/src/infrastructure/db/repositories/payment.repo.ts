// src/infrastructure/db/repositories/payment.repo.ts
// Payments data access (lookup by authority, by order, update states).

import { Prisma } from "../../../../../node_modules/.prisma/client/index.js";
import { prisma } from "../prismaClient.js";

export const paymentRepo = {
  findById(id: string) {
    return prisma.payment.findUnique({ where: { id } });
  },
  listForOrder(orderId: string) {
    return prisma.payment.findMany({ where: { orderId }, orderBy: { createdAt: "desc" } });
  },
  create(data: Prisma.PaymentUncheckedCreateInput) {
    return prisma.payment.create({ data });
  },
  update(id: string, data: Prisma.PaymentUncheckedUpdateInput) {
    return prisma.payment.update({ where: { id }, data });
  },
  findPendingGatewayByOrder(orderId: string) {
    return prisma.payment.findFirst({
      where: { orderId, method: "GATEWAY", status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
  },
  findByAuthority(authority: string) {
    return prisma.payment.findFirst({ where: { authority } });
  },
};

export default paymentRepo;