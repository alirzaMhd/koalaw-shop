export declare const profileService: {
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        phone: string;
        firstName: string;
        lastName: string;
        birthDate: string | undefined;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        tierStars: number;
        tierLabel: string;
        profileImage: string;
        bio: string;
        emailVerifiedAt: Date | null;
        phoneVerifiedAt: Date | null;
        createdAt: Date;
        notificationPrefs: {
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            orderUpdates: boolean;
            promotions: boolean;
            newProducts: boolean;
            marketing: boolean;
        } | {
            orderUpdates: true;
            promotions: true;
            newProducts: true;
            marketing: false;
        };
        stats: {
            totalOrders: number;
            pendingShipment: number;
            wishlistCount: number;
            discountPercent: number;
        };
    }>;
    getStats(userId: string): Promise<{
        totalOrders: number;
        pendingShipment: number;
        wishlistCount: number;
        discountPercent: number;
    }>;
    getOrders(userId: string, status?: string): Promise<{
        id: any;
        orderNumber: any;
        status: string;
        statusLabel: string;
        total: any;
        currencyCode: any;
        createdAt: any;
        placedAt: any;
        items: {
            id: any;
            title: any;
            variantName: any;
            quantity: any;
            unitPrice: any;
            lineTotal: any;
            imageUrl: any;
        }[];
        itemCount: number;
    }[]>;
    getStatusLabel(status: string): string;
    updateProfile(userId: string, data: {
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        birthDate?: string | undefined;
        gender?: "UNDISCLOSED" | "MALE" | "FEMALE" | undefined;
    }): Promise<{
        id: string;
        email: string;
        phone: string;
        firstName: string;
        lastName: string;
        birthDate: string | undefined;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        tierStars: number;
        tierLabel: string;
        profileImage: string;
    }>;
    updateNotificationPrefs(userId: string, prefs: {
        orderUpdates?: boolean | undefined;
        promotions?: boolean | undefined;
        newProducts?: boolean | undefined;
        marketing?: boolean | undefined;
    }): Promise<{
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        orderUpdates: boolean;
        promotions: boolean;
        newProducts: boolean;
        marketing: boolean;
    }>;
    getAddresses(userId: string): Promise<{
        id: any;
        label: any;
        firstName: any;
        lastName: any;
        phone: any;
        postalCode: any;
        province: any;
        city: any;
        addressLine1: any;
        addressLine2: any;
        country: any;
        isDefault: any;
        createdAt: any;
    }[]>;
    createAddress(userId: string, data: {
        label?: string | undefined;
        firstName: string;
        lastName: string;
        phone: string;
        postalCode?: string | undefined;
        province: string;
        city: string;
        addressLine1: string;
        addressLine2?: string | undefined;
        country?: string | undefined;
        isDefault?: boolean | undefined;
    }): Promise<{
        id: string;
        phone: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        label: string | null;
        postalCode: string | null;
        province: string;
        city: string;
        addressLine1: string;
        addressLine2: string | null;
        country: string;
        isDefault: boolean;
    }>;
    updateAddress(userId: string, addressId: string, data: {
        label?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        postalCode?: string | undefined;
        province?: string | undefined;
        city?: string | undefined;
        addressLine1?: string | undefined;
        addressLine2?: string | undefined;
        isDefault?: boolean | undefined;
    }): Promise<{
        id: string;
        phone: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        label: string | null;
        postalCode: string | null;
        province: string;
        city: string;
        addressLine1: string;
        addressLine2: string | null;
        country: string;
        isDefault: boolean;
    }>;
    deleteAddress(userId: string, addressId: string): Promise<{
        success: boolean;
    }>;
    setDefaultAddress(userId: string, addressId: string): Promise<{
        success: boolean;
    }>;
};
//# sourceMappingURL=profile.service.d.ts.map