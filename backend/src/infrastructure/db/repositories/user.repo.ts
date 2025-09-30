// src/infrastructure/db/repositories/user.repo.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../prismaClient";

export const userRepo = {
  // Users
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
  findByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  },
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },
  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },
  upsertByEmail(email: string, createData: Prisma.UserCreateInput, updateData: Prisma.UserUpdateInput) {
    return prisma.user.upsert({
      where: { email },
      create: createData,
      update: updateData,
    });
  },

  // Notification prefs
  getNotificationPrefs(userId: string) {
    return prisma.userNotificationPrefs.findUnique({ where: { userId } });
  },
  upsertNotificationPrefs(userId: string, data: Prisma.UserNotificationPrefsUncheckedCreateInput) {
    return prisma.userNotificationPrefs.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  },

  // Addresses
  listAddresses(userId: string) {
    return prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },
  createAddress(userId: string, data: Omit<Prisma.UserAddressUncheckedCreateInput, "userId">) {
    return prisma.userAddress.create({ data: { ...data, userId } });
  },
  updateAddress(id: string, data: Prisma.UserAddressUncheckedUpdateInput) {
    return prisma.userAddress.update({ where: { id }, data });
  },
  deleteAddress(id: string) {
    return prisma.userAddress.delete({ where: { id } });
  },
  unsetDefaultAddresses(userId: string, exceptId?: string) {
    return prisma.userAddress.updateMany({
      where: { userId, isDefault: true, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      data: { isDefault: false },
    });
  },
};

export default userRepo;