// backend/src/modules/admin/admin.service.ts
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { AppError } from "../../common/errors/AppError.js";
import { logger } from "../../config/logger.js";
export const adminService = {
    // ========== DASHBOARD STATS ==========
    async getDashboardStats() {
        const [totalProducts, totalOrders, totalUsers, totalRevenue, pendingOrders, activeProducts, newsletterSubscribers, pendingReviews, recentOrders, topProducts, recentUsers,] = await Promise.all([
            // Total products
            prisma.product.count(),
            // Total orders
            prisma.order.count(),
            // Total users
            prisma.user.count(),
            // Total revenue (sum of all paid orders)
            prisma.order.aggregate({
                where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
                _sum: { total: true },
            }),
            // Pending orders (awaiting payment + processing)
            prisma.order.count({
                where: { status: { in: ["AWAITING_PAYMENT", "PROCESSING"] } },
            }),
            // Active products
            prisma.product.count({ where: { isActive: true } }),
            // Newsletter subscribers
            prisma.newsletterSubscription.count({
                where: { unsubscribedAt: null },
            }),
            // Pending reviews
            prisma.productReview.count({ where: { status: "PENDING" } }),
            // Recent orders (last 10)
            prisma.order.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { email: true, firstName: true, lastName: true } },
                },
            }),
            // Top selling products
            prisma.product.findMany({
                take: 10,
                orderBy: { ratingCount: "desc" },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    heroImageUrl: true,
                    ratingAvg: true,
                    ratingCount: true,
                },
            }),
            // Recent users
            prisma.user.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                    role: true,
                },
            }),
        ]);
        return {
            stats: {
                totalProducts,
                totalOrders,
                totalUsers,
                totalRevenue: totalRevenue._sum.total || 0,
                pendingOrders,
                activeProducts,
                newsletterSubscribers,
                pendingReviews,
            },
            recentOrders: recentOrders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                total: order.total,
                createdAt: order.createdAt,
                user: order.user,
            })),
            topProducts,
            recentUsers,
        };
    },
    // ========== PRODUCT MANAGEMENT ==========
    async listAllProducts(query) {
        const page = Math.max(1, query.page || 1);
        const perPage = Math.min(100, Math.max(1, query.perPage || 20));
        const skip = (page - 1) * perPage;
        const where = {};
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.category)
            where.category = query.category;
        if (typeof query.isActive === "boolean")
            where.isActive = query.isActive;
        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: perPage,
                orderBy: { createdAt: "desc" },
                include: {
                    brand: true,
                    variants: true,
                    images: { orderBy: { position: "asc" }, take: 1 },
                },
            }),
        ]);
        return {
            products,
            meta: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
        };
    },
    async deleteProduct(id) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product)
            throw AppError.notFound("محصول یافت نشد");
        await prisma.product.delete({ where: { id } });
        logger.info({ productId: id }, "Product deleted by admin");
        return { deleted: true };
    },
    // ========== ORDER MANAGEMENT ==========
    async listAllOrders(query) {
        const page = Math.max(1, query.page || 1);
        const perPage = Math.min(100, Math.max(1, query.perPage || 20));
        const skip = (page - 1) * perPage;
        const where = {};
        if (query.status && query.status !== "all") {
            where.status = query.status.toUpperCase();
        }
        if (query.search) {
            where.OR = [
                { orderNumber: { contains: query.search, mode: "insensitive" } },
                { shippingFirstName: { contains: query.search, mode: "insensitive" } },
                { shippingLastName: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [total, orders] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                skip,
                take: perPage,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { email: true, firstName: true, lastName: true } },
                    items: {
                        include: {
                            product: { select: { title: true, heroImageUrl: true } },
                        },
                    },
                },
            }),
        ]);
        return {
            orders,
            meta: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
        };
    },
    async updateOrderStatus(orderId, status) {
        const validStatuses = [
            "DRAFT",
            "AWAITING_PAYMENT",
            "PAID",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "RETURNED",
        ];
        if (!validStatuses.includes(status.toUpperCase())) {
            throw AppError.badRequest("وضعیت نامعتبر است");
        }
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status: status.toUpperCase() },
            include: {
                user: { select: { email: true } },
            },
        });
        logger.info({ orderId, status }, "Order status updated by admin");
        return order;
    },
    // ========== USER MANAGEMENT ==========
    async listAllUsers(query) {
        const page = Math.max(1, query.page || 1);
        const perPage = Math.min(100, Math.max(1, query.perPage || 20));
        const skip = (page - 1) * perPage;
        const where = {};
        if (query.search) {
            where.OR = [
                { email: { contains: query.search, mode: "insensitive" } },
                { firstName: { contains: query.search, mode: "insensitive" } },
                { lastName: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.role && query.role !== "all") {
            where.role = query.role.toUpperCase();
        }
        const [total, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip,
                take: perPage,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    customerTier: true,
                    createdAt: true,
                    emailVerifiedAt: true,
                    _count: {
                        select: { orders: true },
                    },
                },
            }),
        ]);
        return {
            users,
            meta: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
        };
    },
    async updateUserRole(userId, role) {
        const validRoles = ["CUSTOMER", "ADMIN", "STAFF"];
        if (!validRoles.includes(role.toUpperCase())) {
            throw AppError.badRequest("نقش نامعتبر است");
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role: role.toUpperCase() },
        });
        logger.info({ userId, role }, "User role updated by admin");
        return user;
    },
    async updateUserTier(userId, tier) {
        const validTiers = ["STANDARD", "VIP"];
        if (!validTiers.includes(tier.toUpperCase())) {
            throw AppError.badRequest("سطح نامعتبر است");
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: { customerTier: tier.toUpperCase() },
        });
        logger.info({ userId, tier }, "User tier updated by admin");
        return user;
    },
    // ========== REVIEW MODERATION ==========
    async listPendingReviews(query) {
        const page = Math.max(1, query.page || 1);
        const perPage = Math.min(100, Math.max(1, query.perPage || 20));
        const skip = (page - 1) * perPage;
        const [total, reviews] = await Promise.all([
            prisma.productReview.count({ where: { status: "PENDING" } }),
            prisma.productReview.findMany({
                where: { status: "PENDING" },
                skip,
                take: perPage,
                orderBy: { createdAt: "desc" },
                include: {
                    product: { select: { title: true, heroImageUrl: true } },
                    user: { select: { email: true, firstName: true, lastName: true } },
                },
            }),
        ]);
        return {
            reviews,
            meta: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
        };
    },
    // ========== BRAND & COLLECTION MANAGEMENT ==========
    async listBrands() {
        return prisma.brand.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: { select: { products: true } },
            },
        });
    },
    async createBrand(data) {
        const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-");
        return prisma.brand.create({
            data: { name: data.name, slug },
        });
    },
    async updateBrand(id, data) {
        return prisma.brand.update({
            where: { id },
            data,
        });
    },
    async deleteBrand(id) {
        const productCount = await prisma.product.count({ where: { brandId: id } });
        if (productCount > 0) {
            throw AppError.badRequest(`این برند دارای ${productCount} محصول است. ابتدا محصولات را حذف کنید.`);
        }
        await prisma.brand.delete({ where: { id } });
        return { deleted: true };
    },
    async listCollections() {
        return prisma.collection.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: { select: { products: true } },
            },
        });
    },
    async createCollection(data) {
        return prisma.collection.create({
            data: { name: data.name },
        });
    },
    async updateCollection(id, data) {
        return prisma.collection.update({
            where: { id },
            data: { name: data.name },
        });
    },
    async deleteCollection(id) {
        await prisma.product.updateMany({
            where: { collectionId: id },
            data: { collectionId: null },
        });
        await prisma.collection.delete({ where: { id } });
        return { deleted: true };
    },
    // ========== NEWSLETTER MANAGEMENT ==========
    async getNewsletterStats() {
        const [total, active, recent] = await Promise.all([
            prisma.newsletterSubscription.count(),
            prisma.newsletterSubscription.count({ where: { unsubscribedAt: null } }),
            prisma.newsletterSubscription.count({
                where: {
                    unsubscribedAt: null,
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                },
            }),
        ]);
        return {
            total,
            active,
            unsubscribed: total - active,
            recentSubscribers: recent,
        };
    },
    // ========== COUPON MANAGEMENT ==========
    async listCoupons(query) {
        const page = Math.max(1, query.page || 1);
        const perPage = Math.min(100, Math.max(1, query.perPage || 20));
        const skip = (page - 1) * perPage;
        const [total, coupons] = await Promise.all([
            prisma.coupon.count(),
            prisma.coupon.findMany({
                skip,
                take: perPage,
                orderBy: { createdAt: "desc" },
                include: {
                    _count: { select: { redemptions: true } },
                },
            }),
        ]);
        return {
            coupons,
            meta: {
                page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage),
            },
        };
    },
    async createCoupon(data) {
        return prisma.coupon.create({
            data: {
                code: data.code.toUpperCase(),
                type: data.type,
                percentValue: data.percentValue || null,
                amountValue: data.amountValue || null,
                minSubtotal: data.minSubtotal || 0,
                maxUses: data.maxUses || null,
                maxUsesPerUser: data.maxUsesPerUser || null,
                startsAt: data.startsAt || null,
                endsAt: data.endsAt || null,
                isActive: true,
            },
        });
    },
    async updateCoupon(id, data) {
        return prisma.coupon.update({
            where: { id },
            data,
        });
    },
    async deleteCoupon(id) {
        await prisma.coupon.delete({ where: { id } });
        return { deleted: true };
    },
};
//# sourceMappingURL=admin.service.js.map