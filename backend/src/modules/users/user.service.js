// src/modules/users/user.service.ts
// Profile, addresses, and notification preferences service.
// Works with the SQL schema you provided and maps rows to domain entities.
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { logger } from "../../config/logger.js";
import { eventBus } from "../../events/eventBus.js";
import { AppError } from "../../common/errors/AppError.js";
import { mapDbUserToEntity, mapDbAddressToEntity, mapDbPrefsToEntity, DEFAULT_NOTIFICATION_PREFS, makeUserSummary, } from "./user.entity.js";
function toDate(v) {
    if (!v)
        return null;
    if (v instanceof Date)
        return v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}
class UserService {
    // Load full profile
    async getMe(userId) {
        const row = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!row)
            throw new AppError("کاربر یافت نشد.", 404, "USER_NOT_FOUND");
        return mapDbUserToEntity(row);
    }
    // Update profile fields
    async updateProfile(userId, input) {
        const data = {};
        if (typeof input.firstName !== "undefined")
            data.firstName = input.firstName?.trim() || null;
        if (typeof input.lastName !== "undefined")
            data.lastName = input.lastName?.trim() || null;
        if (typeof input.email !== "undefined")
            data.email = input.email ? String(input.email).trim().toLowerCase() : null;
        if (typeof input.gender !== "undefined")
            data.gender = input.gender;
        if (typeof input.customerTier !== "undefined")
            data.customerTier = input.customerTier;
        if (typeof input.birthDate !== "undefined")
            data.birthDate = toDate(input.birthDate);
        try {
            const row = await prisma.user.update({
                where: { id: userId },
                data,
            });
            const entity = mapDbUserToEntity(row);
            eventBus.emit("user.profile.updated", { userId, fields: Object.keys(data) });
            return entity;
        }
        catch (e) {
            // Handle unique email
            if (e?.code === "P2002" && Array.isArray(e?.meta?.target) && e.meta.target.includes("email")) {
                throw new AppError("این ایمیل قبلاً ثبت شده است.", 409, "EMAIL_TAKEN");
            }
            logger.error({ err: e }, "updateProfile failed");
            throw e;
        }
    }
    // Ensure notification prefs exist
    async getNotificationPrefs(userId) {
        let row = await prisma.userNotificationPrefs.findUnique({ where: { userId } });
        if (!row) {
            row = await prisma.userNotificationPrefs.create({
                data: { userId, ...DEFAULT_NOTIFICATION_PREFS },
            });
        }
        return mapDbPrefsToEntity(row);
    }
    async updateNotificationPrefs(userId, prefs) {
        const existing = await prisma.userNotificationPrefs.findUnique({ where: { userId } });
        // Build an update payload that only contains fields explicitly provided
        const updateData = {};
        if (typeof prefs.orderUpdates !== "undefined")
            updateData.orderUpdates = prefs.orderUpdates;
        if (typeof prefs.promotions !== "undefined")
            updateData.promotions = prefs.promotions;
        if (typeof prefs.newProducts !== "undefined")
            updateData.newProducts = prefs.newProducts;
        if (typeof prefs.marketing !== "undefined")
            updateData.marketing = prefs.marketing;
        // Build a create payload with concrete boolean values (falling back to defaults)
        const createData = {
            userId,
            orderUpdates: prefs.orderUpdates ?? DEFAULT_NOTIFICATION_PREFS.orderUpdates,
            promotions: prefs.promotions ?? DEFAULT_NOTIFICATION_PREFS.promotions,
            newProducts: prefs.newProducts ?? DEFAULT_NOTIFICATION_PREFS.newProducts,
            marketing: prefs.marketing ?? DEFAULT_NOTIFICATION_PREFS.marketing,
        };
        let row;
        if (!existing) {
            row = await prisma.userNotificationPrefs.create({
                data: createData,
            });
        }
        else {
            row = await prisma.userNotificationPrefs.update({
                where: { userId },
                data: updateData,
            });
        }
        const entity = mapDbPrefsToEntity(row);
        eventBus.emit("user.prefs.updated", { userId, prefs: entity });
        return entity;
    }
    // Addresses
    async listAddresses(userId) {
        const rows = await prisma.userAddress.findMany({
            where: { userId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        });
        return rows.map(mapDbAddressToEntity);
    }
    async createAddress(userId, input) {
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
    async updateAddress(userId, addressId, input) {
        // Ensure ownership
        const existing = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
        if (!existing)
            throw new AppError("آدرس یافت نشد.", 404, "ADDRESS_NOT_FOUND");
        const willBeDefault = typeof input.isDefault !== "undefined" ? Boolean(input.isDefault) : existing.isDefault;
        const row = await prisma.$transaction(async (tx) => {
            if (willBeDefault) {
                await tx.userAddress.updateMany({
                    where: { userId, isDefault: true, NOT: { id: addressId } },
                    data: { isDefault: false },
                });
            }
            const data = {};
            if (typeof input.label !== "undefined")
                data.label = input.label;
            if (typeof input.firstName !== "undefined")
                data.firstName = input.firstName;
            if (typeof input.lastName !== "undefined")
                data.lastName = input.lastName;
            if (typeof input.phone !== "undefined")
                data.phone = input.phone;
            if (typeof input.postalCode !== "undefined")
                data.postalCode = input.postalCode;
            if (typeof input.province !== "undefined")
                data.province = input.province;
            if (typeof input.city !== "undefined")
                data.city = input.city;
            if (typeof input.addressLine1 !== "undefined")
                data.addressLine1 = input.addressLine1;
            if (typeof input.addressLine2 !== "undefined")
                data.addressLine2 = input.addressLine2;
            if (typeof input.country !== "undefined")
                data.country = input.country;
            if (typeof input.isDefault !== "undefined")
                data.isDefault = willBeDefault;
            const updated = await tx.userAddress.update({
                where: { id: addressId },
                data,
            });
            return updated;
        });
        const entity = mapDbAddressToEntity(row);
        eventBus.emit("user.address.updated", { userId, addressId, isDefault: entity.isDefault });
        return entity;
    }
    async deleteAddress(userId, addressId) {
        const existing = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
        if (!existing)
            throw new AppError("آدرس یافت نشد.", 404, "ADDRESS_NOT_FOUND");
        let reassigned = null;
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
    async setDefaultAddress(userId, addressId) {
        const target = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
        if (!target)
            throw new AppError("آدرس یافت نشد.", 404, "ADDRESS_NOT_FOUND");
        const row = await prisma.$transaction(async (tx) => {
            await tx.userAddress.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
            return tx.userAddress.update({ where: { id: addressId }, data: { isDefault: true } });
        });
        const entity = mapDbAddressToEntity(row);
        eventBus.emit("user.address.default_changed", { userId, addressId });
        return entity;
    }
    // Dashboard-style lightweight summary
    async getSummary(userId) {
        const [user, totalOrders, pendingOrders] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { customerTier: true } }),
            prisma.order.count({ where: { userId } }),
            prisma.order.count({
                where: { userId, status: { in: ["awaiting_payment", "processing"] } },
            }),
        ]);
        // favorites not modeled in current schema; keeping 0
        return makeUserSummary({
            totalOrders,
            pendingOrders,
            favorites: 0,
            tier: user?.customerTier || "standard",
        });
    }
}
export const userService = new UserService();
//# sourceMappingURL=user.service.js.map