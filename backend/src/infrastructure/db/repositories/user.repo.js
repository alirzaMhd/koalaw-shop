// src/infrastructure/db/repositories/user.repo.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient.js";
export const userRepo = {
  // Users
  findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },
  findByPhone(phone) {
    return prisma.user.findUnique({ where: { phone } });
  },
  findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },
  create(data) {
    return prisma.user.create({ data });
  },
  update(id, data) {
    return prisma.user.update({ where: { id }, data });
  },
  upsertByEmail(email, createData, updateData) {
    return prisma.user.upsert({
      where: { email },
      create: createData,
      update: updateData,
    });
  },
  // Notification prefs
  getNotificationPrefs(userId) {
    return prisma.userNotificationPrefs.findUnique({ where: { userId } });
  },
  upsertNotificationPrefs(userId, data) {
    return prisma.userNotificationPrefs.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  },
  // Addresses
  listAddresses(userId) {
    return prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },
  createAddress(userId, data) {
    return prisma.userAddress.create({ data: { ...data, userId } });
  },
  updateAddress(id, data) {
    return prisma.userAddress.update({ where: { id }, data });
  },
  deleteAddress(id) {
    return prisma.userAddress.delete({ where: { id } });
  },
  unsetDefaultAddresses(userId, exceptId) {
    return prisma.userAddress.updateMany({
      where: {
        userId,
        isDefault: true,
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      data: { isDefault: false },
    });
  },
};
export default userRepo;
//# sourceMappingURL=user.repo.js.map
