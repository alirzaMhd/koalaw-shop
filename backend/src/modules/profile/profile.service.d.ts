export declare const profileService: {
    getProfile(userId: string): Promise<{
        id: any;
        email: any;
        phone: any;
        firstName: any;
        lastName: any;
        birthDate: any;
        gender: any;
        customerTier: any;
        tierStars: number;
        tierLabel: string;
        profileImage: any;
        bio: string;
        emailVerifiedAt: any;
        phoneVerifiedAt: any;
        createdAt: any;
        notificationPrefs: any;
        stats: {
            totalOrders: any;
            pendingShipment: any;
            wishlistCount: number;
            discountPercent: number;
        };
    }>;
    getStats(userId: string): Promise<{
        totalOrders: any;
        pendingShipment: any;
        wishlistCount: number;
        discountPercent: number;
    }>;
    getOrders(userId: string, status?: string): Promise<any>;
    getStatusLabel(status: string): string;
    updateProfile(userId: string, data: {
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        birthDate?: string | undefined;
        gender?: "UNDISCLOSED" | "MALE" | "FEMALE" | undefined;
    }): Promise<{
        id: any;
        email: any;
        phone: any;
        firstName: any;
        lastName: any;
        birthDate: any;
        gender: any;
        customerTier: any;
        tierStars: number;
        tierLabel: string;
        profileImage: any;
    }>;
    updateNotificationPrefs(userId: string, prefs: {
        orderUpdates?: boolean | undefined;
        promotions?: boolean | undefined;
        newProducts?: boolean | undefined;
        marketing?: boolean | undefined;
    }): Promise<any>;
    getAddresses(userId: string): Promise<any>;
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
    }): Promise<any>;
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
    }): Promise<any>;
    deleteAddress(userId: string, addressId: string): Promise<{
        success: boolean;
    }>;
    setDefaultAddress(userId: string, addressId: string): Promise<{
        success: boolean;
    }>;
};
//# sourceMappingURL=profile.service.d.ts.map