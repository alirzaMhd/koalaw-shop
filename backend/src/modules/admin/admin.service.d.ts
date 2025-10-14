export declare const adminService: {
    getDashboardStats(): Promise<{
        stats: {
            totalProducts: number;
            totalOrders: number;
            totalUsers: number;
            totalRevenue: number;
            pendingOrders: number;
            activeProducts: number;
            newsletterSubscribers: number;
            pendingReviews: number;
        };
        recentOrders: {
            id: any;
            orderNumber: any;
            status: any;
            total: any;
            createdAt: any;
            user: any;
        }[];
        topProducts: {
            id: string;
            title: string;
            price: number;
            ratingAvg: import("@prisma/client/runtime/library").Decimal;
            ratingCount: number;
            heroImageUrl: string | null;
        }[];
        recentUsers: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            createdAt: Date;
            role: import("@prisma/client").$Enums.UserRole;
        }[];
    }>;
    listAllProducts(query: {
        page?: number;
        perPage?: number;
        search?: string;
        category?: string;
        isActive?: boolean;
    }): Promise<{
        products: ({
            brand: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
            };
            images: {
                id: string;
                createdAt: Date;
                productId: string;
                position: number;
                url: string;
                alt: string | null;
            }[];
            variants: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                currencyCode: string;
                productId: string;
                price: number | null;
                isActive: boolean;
                variantName: string;
                position: number;
                sku: string | null;
                stock: number;
                colorName: string | null;
                colorHexCode: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currencyCode: string;
            title: string;
            slug: string;
            brandId: string;
            colorThemeId: string | null;
            collectionId: string | null;
            category: import("@prisma/client").$Enums.ProductCategory;
            subtitle: string | null;
            description: string | null;
            ingredients: string | null;
            howToUse: string | null;
            price: number;
            compareAtPrice: number | null;
            ratingAvg: import("@prisma/client/runtime/library").Decimal;
            ratingCount: number;
            isBestseller: boolean;
            isFeatured: boolean;
            isSpecialProduct: boolean;
            isActive: boolean;
            heroImageUrl: string | null;
            internalNotes: string | null;
        })[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    deleteProduct(id: string): Promise<{
        deleted: boolean;
    }>;
    listAllOrders(query: {
        page?: number;
        perPage?: number;
        status?: string;
        search?: string;
    }): Promise<{
        orders: ({
            user: {
                email: string;
                firstName: string | null;
                lastName: string | null;
            } | null;
            items: ({
                product: {
                    title: string;
                    heroImageUrl: string | null;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                orderId: string;
                currencyCode: string;
                productId: string | null;
                title: string;
                variantId: string | null;
                variantName: string | null;
                unitPrice: number;
                quantity: number;
                lineTotal: number;
                imageUrl: string | null;
                position: number;
            })[];
        } & {
            status: import("@prisma/client").$Enums.OrderStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            orderNumber: string;
            shippingMethod: import("@prisma/client").$Enums.ShippingMethod;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            couponCode: string | null;
            giftWrap: boolean;
            note: string | null;
            subtotal: number;
            discountTotal: number;
            shippingTotal: number;
            giftWrapTotal: number;
            total: number;
            currencyCode: string;
            shippingFirstName: string;
            shippingLastName: string;
            shippingPhone: string;
            shippingPostalCode: string | null;
            shippingProvince: string;
            shippingCity: string;
            shippingAddressLine1: string;
            shippingAddressLine2: string | null;
            shippingCountry: string;
            placedAt: Date;
        })[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    updateOrderStatus(orderId: string, status: string): Promise<{
        user: {
            email: string;
        } | null;
    } & {
        status: import("@prisma/client").$Enums.OrderStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        orderNumber: string;
        shippingMethod: import("@prisma/client").$Enums.ShippingMethod;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        couponCode: string | null;
        giftWrap: boolean;
        note: string | null;
        subtotal: number;
        discountTotal: number;
        shippingTotal: number;
        giftWrapTotal: number;
        total: number;
        currencyCode: string;
        shippingFirstName: string;
        shippingLastName: string;
        shippingPhone: string;
        shippingPostalCode: string | null;
        shippingProvince: string;
        shippingCity: string;
        shippingAddressLine1: string;
        shippingAddressLine2: string | null;
        shippingCountry: string;
        placedAt: Date;
    }>;
    listAllUsers(query: {
        page?: number;
        perPage?: number;
        search?: string;
        role?: string;
    }): Promise<{
        users: {
            id: string;
            phone: string | null;
            email: string;
            firstName: string | null;
            lastName: string | null;
            customerTier: import("@prisma/client").$Enums.CustomerTier;
            createdAt: Date;
            role: import("@prisma/client").$Enums.UserRole;
            emailVerifiedAt: Date | null;
            _count: {
                orders: number;
            };
        }[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    updateUserRole(userId: string, role: string): Promise<{
        id: string;
        phone: string | null;
        email: string;
        firstName: string | null;
        lastName: string | null;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        phoneVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        role: import("@prisma/client").$Enums.UserRole;
        emailVerifiedAt: Date | null;
        passwordHash: string;
        profileImageUrl: string | null;
    }>;
    updateUserTier(userId: string, tier: string): Promise<{
        id: string;
        phone: string | null;
        email: string;
        firstName: string | null;
        lastName: string | null;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        phoneVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        role: import("@prisma/client").$Enums.UserRole;
        emailVerifiedAt: Date | null;
        passwordHash: string;
        profileImageUrl: string | null;
    }>;
    listPendingReviews(query: {
        page?: number;
        perPage?: number;
    }): Promise<{
        reviews: ({
            user: {
                email: string;
                firstName: string | null;
                lastName: string | null;
            } | null;
            product: {
                title: string;
                heroImageUrl: string | null;
            };
        } & {
            status: import("@prisma/client").$Enums.ReviewStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            productId: string;
            rating: number;
            title: string | null;
            body: string;
            guestName: string | null;
        })[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    listBrands(): Promise<({
        _count: {
            products: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    })[]>;
    createBrand(data: {
        name: string;
        slug?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    updateBrand(id: string, data: {
        name?: string;
        slug?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    deleteBrand(id: string): Promise<{
        deleted: boolean;
    }>;
    listCollections(): Promise<({
        _count: {
            products: number;
        };
    } & {
        name: string;
        id: string;
    })[]>;
    createCollection(data: {
        name: string;
    }): Promise<{
        name: string;
        id: string;
    }>;
    updateCollection(id: string, data: {
        name: string;
    }): Promise<{
        name: string;
        id: string;
    }>;
    deleteCollection(id: string): Promise<{
        deleted: boolean;
    }>;
    getNewsletterStats(): Promise<{
        total: number;
        active: number;
        unsubscribed: number;
        recentSubscribers: number;
    }>;
    listCoupons(query: {
        page?: number;
        perPage?: number;
    }): Promise<{
        coupons: ({
            _count: {
                redemptions: number;
            };
        } & {
            code: string;
            type: import("@prisma/client").$Enums.CouponType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            percentValue: number | null;
            amountValue: number | null;
            minSubtotal: number;
            maxUses: number | null;
            maxUsesPerUser: number | null;
            startsAt: Date | null;
            endsAt: Date | null;
        })[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
    createCoupon(data: {
        code: string;
        type: "PERCENT" | "AMOUNT" | "FREE_SHIPPING";
        percentValue?: number;
        amountValue?: number;
        minSubtotal?: number;
        maxUses?: number;
        maxUsesPerUser?: number;
        startsAt?: Date;
        endsAt?: Date;
    }): Promise<{
        code: string;
        type: import("@prisma/client").$Enums.CouponType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        percentValue: number | null;
        amountValue: number | null;
        minSubtotal: number;
        maxUses: number | null;
        maxUsesPerUser: number | null;
        startsAt: Date | null;
        endsAt: Date | null;
    }>;
    updateCoupon(id: string, data: any): Promise<{
        code: string;
        type: import("@prisma/client").$Enums.CouponType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        percentValue: number | null;
        amountValue: number | null;
        minSubtotal: number;
        maxUses: number | null;
        maxUsesPerUser: number | null;
        startsAt: Date | null;
        endsAt: Date | null;
    }>;
    deleteCoupon(id: string): Promise<{
        deleted: boolean;
    }>;
    getUser(userId: string): Promise<{
        id: string;
        phone: string | null;
        email: string;
        firstName: string | null;
        lastName: string | null;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        phoneVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        role: import("@prisma/client").$Enums.UserRole;
        emailVerifiedAt: Date | null;
        profileImageUrl: string | null;
        _count: {
            orders: number;
            productReviews: number;
            addresses: number;
        };
    }>;
    deleteUser(userId: string): Promise<{
        deleted: boolean;
    }>;
    listNewsletterSubscribers(query: {
        page?: number;
        perPage?: number;
        status?: string;
    }): Promise<{
        subscribers: {
            id: string;
            email: string;
            createdAt: Date;
            source: string | null;
            consent: boolean;
            unsubscribedAt: Date | null;
        }[];
        meta: {
            page: number;
            perPage: number;
            total: number;
            totalPages: number;
        };
    }>;
};
//# sourceMappingURL=admin.service.d.ts.map