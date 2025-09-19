// src/modules/users/user.service.ts
// Profile, addresses, and notification preferences service.
// Works with the SQL schema you provided and maps rows to domain entities.

import { prisma } from "../../infrastructure/db/prismaClient";
import { logger } from "../../config/logger";
import { eventBus } from "../../events/eventBus";
import { AppError } from "../../common/errors/AppError";

import {
  User,
  UserAddress,
  UserNotificationPrefs,
  Gender,
  CustomerTier,
  mapDbUserToEntity,
  mapDbAddressToEntity,
  mapDbPrefsToEntity,
  DEFAULT_NOTIFICATION_PREFS,
  makeUserSummary,
  UserSummary,
} from "./user.entity";

// Inputs
export type UpdateProfileInput = Partial<{
  firstName: string;
  lastName: string;
  email: string | null;
  birthDate: string | Date | null;
  gender: Gender;
  customerTier: CustomerTier; // optional; protect in controllers (admin only)
}>;

export type UpsertNotificationPrefsInput = Partial<{
  orderUpdates: boolean;
  promotions: boolean;
  newProducts: boolean;
  marketing: boolean;
}>;

export type AddressCreateInput = {
  label?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  postalCode?: string | null;
  province: string;
  city: string;
  addressLine1: string;
  addressLine2?: string | null;
  country?: string; // default IR
  isDefault?: boolean;
};

export type AddressUpdateInput = Partial<AddressCreateInput>;

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

class UserService {
  // Load full profile
  async getMe(userId: string): Promise<User> {
    const row = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!row) throw new AppError("کاربر یافت نشد.", 404, "USER_NOT_FOUND");
    return mapDbUserToEntity(row);
  }

  // Update profile fields
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
    const data: any = {};
    if (typeof input.firstName !== "undefined") data.firstName = input.firstName?.trim() || null;
    if (typeof input.lastName !== "undefined") data.lastName = input.lastName?.trim() || null;
    if (typeof input.email !== "undefined") data.email = input.email ? String(input.email).trim().toLowerCase() : null;
    if (typeof input.gender !== "undefined") data.gender = input.gender;
    if (typeof input.customerTier !== "undefined") data.customerTier = input.customerTier;
    if (typeof input.birthDate !== "undefined") data.birthDate = toDate(input.birthDate);

    try {
      const row = await prisma.user.update({
        where: { id: userId },
        data,
      });
      const entity = mapDbUserToEntity(row);
      eventBus.emit("user.profile.updated", { userId, fields: Object.keys(data) });
      return entity;
    } catch (e: any) {
      // Handle unique email
      if (e?.code === "P2002" && Array.isArray(e?.meta?.target) && e.meta.target.includes("email")) {
        throw new AppError("این ایمیل قبلاً ثبت شده است.", 409, "EMAIL_TAKEN");
      }
      logger.error({ err: e }, "updateProfile failed");
      throw e;
    }
  }

  // Ensure notification prefs exist
  async getNotificationPrefs(userId: string): Promise<UserNotificationPrefs> {
    let row = await prisma.userNotificationPrefs.findUnique({ where: { userId } });
    if (!row) {
      row = await prisma.userNotificationPrefs.create({
        data: { userId, ...DEFAULT_NOTIFICATION_PREFS },
      });
    }
    return mapDbPrefsToEntity(row);
  }

  async updateNotificationPrefs(
    userId: string,
    prefs: UpsertNotificationPrefsInput
  ): Promise<UserNotificationPrefs> {
    const existing = await prisma.userNotificationPrefs.findUnique({ where: { userId } });
    const data = {
      orderUpdates: prefs.orderUpdates,
      promotions: prefs.promotions,
      newProducts: prefs.newProducts,
      marketing: prefs.marketing,
    };
    let row;
    if (!existing) {
      row = await prisma.userNotificationPrefs.create({
        data: { userId, ...DEFAULT_NOTIFICATION_PREFS, ...data },
      });
    } else {
      row = await prisma.userNotificationPrefs.update({
        where: { userId },
        data,
      });
    }
    eventBus.emit("user.prefs.updated", { userId, prefs: data });
    return mapDbPrefsToEntity(row);
  }

  // Addresses
  async listAddresses(userId: string): Promise<UserAddress[]> {
    const rows = await prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(mapDbAddressToEntity);
  }

  async createAddress(userId: string, input: AddressCreateInput): Promise<UserAddress> {
    const country = input.country || "IR";
    const isDefault = Boolean(input.isDefault);

    const result = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        // unset existing default
        await tx.userAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      const row = await tx.userAddress.create({
        data: {
          userId,
          label: input.label ?? null,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          postalCode: input.postalCode ?? null,
          province: input.province,
          city: input.city,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 ?? null,
          country,
          isDefault,
        },
      });
      return row;
    });

    const entity = mapDbAddressToEntity(result);
    eventBus.emit("user.address.created", { userId, addressId: entity.id, isDefault: entity.isDefault });
    return entity;
  }

  async updateAddress(userId: string, addressId: string, input: AddressUpdateInput): Promise<UserAddress> {
    // Ensure ownership
    const existing = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
    if (!existing) throw new AppError("آدرس یافت نشد.", 404, "ADDRESS_NOT_FOUND");

    const willBeDefault = typeof input.isDefault !== "undefined" ? Boolean(input.isDefault) : existing.isDefault;

    const row = await prisma.$transaction(async (tx) => {
      if (willBeDefault) {
        await tx.userAddress.updateMany({
          where: { userId, isDefault: true, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }
      const updated = await tx.userAddress.update({
        where: { id: addressId },
        data: {
          label: input.label ?? undefined,
          firstName: input.firstName ?? undefined,
          lastName: input.lastName ?? undefined,
          phone: input.phone ?? undefined,
          postalCode: typeof input.postalCode !== "undefined" ? input.postalCode : undefined,
          province: input.province ?? undefined,
          city: input.city ?? undefined,
          addressLine1: input.addressLine1 ?? undefined,
          addressLine2: typeof input.addressLine2 !== "undefined" ? input.addressLine2 : undefined,
          country: input.country ?? undefined,
          isDefault: typeof input.isDefault !== "undefined" ? willBeDefault : undefined,
        },
      });
      return updated;
    });

    const entity = mapDbAddressToEntity(row);
    eventBus.emit("user.address.updated", { userId, addressId, isDefault: entity.isDefault });
    return entity;
  }

  async deleteAddress(userId: string, addressId: string): Promise<{ deleted: boolean; reassignedDefault?: string | null }> {
    const existing = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
    if (!existing) throw new AppError("آدرس یافت نشد.", 404, "ADDRESS_NOT_FOUND");

    let reassigned: string | null = null;

    await prisma.$transaction(async (tx) => {
      await tx.userAddress.delete({ where: { id: addressId } });

      if (existing.isDefault) {
        // pick another most recent address and set as default
        const another = await tx.userAddress.findFirst({
          where: { userId },
          orderBy: [{ createdAt: "desc" }],
        });
        if (another) {
          await tx.userAddress.update({
            where: { id: another.id },
            data: { isDefault: true },
          });
          reassigned = another.id;
        }
      }
    });

    eventBus.emit("user.address.deleted", { userId, addressId, reassignedDefault: reassigned });
    return { deleted: true, reassignedDefault: reassigned };
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<UserAddress> {
    const target = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
    if (!target) throw new AppError("آدرس یافت نشد.", 404, "ADDRESS_NOT_FOUND");

    const row = await prisma.$transaction(async (tx) => {
      await tx.userAddress.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      return tx.userAddress.update({ where: { id: addressId }, data: { isDefault: true } });
    });

    const entity = mapDbAddressToEntity(row);
    eventBus.emit("user.address.default_changed", { userId, addressId });
    return entity;
  }

  // Dashboard-style lightweight summary
  async getSummary(userId: string): Promise<UserSummary> {
    const [user, totalOrders, pendingOrders] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { customerTier: true } }),
      prisma.order.count({ where: { userId } }),
      prisma.order.count({
        where: { userId, status: { in: ["awaiting_payment", "processing"] as any } },
      }),
    ]);

    // favorites not modeled in current schema; keeping 0
    return makeUserSummary({
      totalOrders,
      pendingOrders,
      favorites: 0,
      tier: (user?.customerTier as CustomerTier) || "standard",
    });
  }
}

export const userService = new UserService();