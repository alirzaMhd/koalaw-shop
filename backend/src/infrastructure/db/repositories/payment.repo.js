// src/infrastructure/db/repositories/payment.repo.ts
// Payments data access (lookup by authority, by order, update states).
import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient.js";
export const paymentRepo = {
  findById(id) {
    return prisma.payment.findUnique({ where: { id } });
  },
  listForOrder(orderId) {
    return prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  },
  create(data) {
    return prisma.payment.create({ data });
  },
  update(id, data) {
    return prisma.payment.update({ where: { id }, data });
  },
  findPendingGatewayByOrder(orderId) {
    return prisma.payment.findFirst({
      where: { orderId, method: "gateway", status: "pending" },
      orderBy: { createdAt: "desc" },
    });
  },
  findByAuthority(authority) {
    return prisma.payment.findFirst({ where: { authority } });
  },
};
export default paymentRepo;
//# sourceMappingURL=payment.repo.js.map
