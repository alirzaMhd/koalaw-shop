// src/modules/profile/profile.service.ts
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { AppError } from "../../common/errors/AppError.js";
const KOALA_DEFAULTS = {
  firstName: "کوالا",
  lastName: "کوچولو",
  profileImage: "/assets/images/profile.png",
  bio: "یک کوالای خوشحال که عاشق محصولات زیباست! 🐨💕",
};
// Customer tier star mapping
const TIER_STARS = {
  STANDARD: { stars: 3, label: "مشتری عادی" },
  VIP: { stars: 5, label: "مشتری ویژه" },
};
export const profileService = {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        customerTier: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        createdAt: true,
        notificationPrefs: true,
        profileImageUrl: true, // NEW
      },
    });
    if (!user) {
      throw new AppError("کاربر یافت نشد.", 404, "NOT_FOUND");
    }
    // Get stats
    const stats = await this.getStats(userId);
    // Get tier info
    const tierInfo = TIER_STARS[user.customerTier] || TIER_STARS.STANDARD;
    // Apply cute koala defaults
    return {
      id: user.id,
      email: user.email,
      phone: user.phone || "",
      firstName: user.firstName || KOALA_DEFAULTS.firstName,
      lastName: user.lastName || KOALA_DEFAULTS.lastName,
      birthDate: user.birthDate
        ? user.birthDate.toISOString().split("T")[0]
        : "",
      gender: user.gender,
      customerTier: user.customerTier,
      tierStars: tierInfo.stars,
      tierLabel: tierInfo.label,
      profileImage: user.profileImageUrl || KOALA_DEFAULTS.profileImage, // NEW
      bio: KOALA_DEFAULTS.bio,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      createdAt: user.createdAt,
      notificationPrefs: user.notificationPrefs || {
        orderUpdates: true,
        promotions: true,
        newProducts: true,
        marketing: false,
      },
      stats,
    };
  },
  async getStats(userId) {
    // Total orders
    const totalOrders = await prisma.order.count({
      where: { userId },
    });
    // Pending shipment (paid, processing, shipped statuses)
    const pendingShipment = await prisma.order.count({
      where: {
        userId,
        status: {
          in: ["PAID", "PROCESSING", "SHIPPED"],
        },
      },
    });
    // Wishlist count - currently 0 (no wishlist table)
    const wishlistCount = 0;
    // Calculate discount based on customer tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { customerTier: true },
    });
    const discountPercent = user?.customerTier === "VIP" ? 15 : 0;
    return {
      totalOrders,
      pendingShipment,
      wishlistCount,
      discountPercent,
    };
  },
  async getOrders(userId, status) {
    const where = { userId };
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                heroImageUrl: true,
              },
            },
          },
        },
      },
    });
    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: this.getStatusLabel(order.status),
      total: order.total,
      currencyCode: order.currencyCode,
      createdAt: order.createdAt,
      placedAt: order.placedAt,
      items: order.items.map((item) => ({
        id: item.id,
        title: item.title,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        imageUrl:
          item.imageUrl ||
          item.product?.heroImageUrl ||
          "/assets/images/product.png",
      })),
      itemCount: order.items.length,
    }));
  },
  getStatusLabel(status) {
    const labels = {
      DRAFT: "پیش‌نویس",
      AWAITING_PAYMENT: "در انتظار پرداخت",
      PAID: "پرداخت شده",
      PROCESSING: "در حال پردازش",
      SHIPPED: "ارسال شده",
      DELIVERED: "تحویل شده",
      CANCELLED: "لغو شده",
      RETURNED: "مرجوع شده",
    };
    return labels[status] || status;
  },
  async updateProfile(userId, data) {
    const updateData = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    }
    if (data.gender !== undefined) updateData.gender = data.gender;
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        customerTier: true,
        profileImageUrl: true, // NEW
      },
    });
    const tierInfo = TIER_STARS[user.customerTier] || TIER_STARS.STANDARD;
    return {
      id: user.id,
      email: user.email,
      phone: user.phone || "",
      firstName: user.firstName || KOALA_DEFAULTS.firstName,
      lastName: user.lastName || KOALA_DEFAULTS.lastName,
      birthDate: user.birthDate
        ? user.birthDate.toISOString().split("T")[0]
        : "",
      gender: user.gender,
      customerTier: user.customerTier,
      tierStars: tierInfo.stars,
      tierLabel: tierInfo.label,
      profileImage: user.profileImageUrl || KOALA_DEFAULTS.profileImage, // NEW
    };
  },
  async updateNotificationPrefs(userId, prefs) {
    const notificationPrefs = await prisma.userNotificationPrefs.upsert({
      where: { userId },
      create: {
        userId,
        orderUpdates: prefs.orderUpdates ?? true,
        promotions: prefs.promotions ?? true,
        newProducts: prefs.newProducts ?? true,
        marketing: prefs.marketing ?? false,
      },
      update: prefs,
    });
    return notificationPrefs;
  },
  async getAddresses(userId) {
    const addresses = await prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return addresses.map((addr) => ({
      id: addr.id,
      label: addr.label,
      firstName: addr.firstName,
      lastName: addr.lastName,
      phone: addr.phone,
      postalCode: addr.postalCode,
      province: addr.province,
      city: addr.city,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      country: addr.country,
      isDefault: addr.isDefault,
      createdAt: addr.createdAt,
    }));
  },
  async createAddress(userId, data) {
    // If this is set as default, unset all others
    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    const address = await prisma.userAddress.create({
      data: {
        userId,
        label: data.label || null,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        postalCode: data.postalCode || null,
        province: data.province,
        city: data.city,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        country: data.country || "IR",
        isDefault: data.isDefault || false,
      },
    });
    return address;
  },
  async updateAddress(userId, addressId, data) {
    // Check if address belongs to user
    const existing = await prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      throw new AppError("آدرس یافت نشد.", 404, "NOT_FOUND");
    }
    // If setting as default, unset all others
    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }
    const updateData = {};
    if (data.label !== undefined) updateData.label = data.label;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.province !== undefined) updateData.province = data.province;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.addressLine1 !== undefined)
      updateData.addressLine1 = data.addressLine1;
    if (data.addressLine2 !== undefined)
      updateData.addressLine2 = data.addressLine2;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    const address = await prisma.userAddress.update({
      where: { id: addressId },
      data: updateData,
    });
    return address;
  },
  async deleteAddress(userId, addressId) {
    // Check if address belongs to user
    const existing = await prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      throw new AppError("آدرس یافت نشد.", 404, "NOT_FOUND");
    }
    await prisma.userAddress.delete({
      where: { id: addressId },
    });
    return { success: true };
  },
  async setDefaultAddress(userId, addressId) {
    // Check if address belongs to user
    const existing = await prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) {
      throw new AppError("آدرس یافت نشد.", 404, "NOT_FOUND");
    }
    // Unset all others
    await prisma.userAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
    // Set this one as default
    await prisma.userAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
    return { success: true };
  },
};
//# sourceMappingURL=profile.service.js.map
