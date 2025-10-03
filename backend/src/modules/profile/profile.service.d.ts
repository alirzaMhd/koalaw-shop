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
        tierStars: any;
        tierLabel: any;
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
        firstName?: string;
        lastName?: string;
        phone?: string;
        birthDate?: string;
        gender?: "UNDISCLOSED" | "MALE" | "FEMALE";
    }): Promise<{
        id: any;
        email: any;
        phone: any;
        firstName: any;
        lastName: any;
        birthDate: any;
        gender: any;
        customerTier: any;
        tierStars: any;
        tierLabel: any;
        profileImage: any;
    }>;
    updateNotificationPrefs(userId: string, prefs: {
        orderUpdates?: boolean;
        promotions?: boolean;
        newProducts?: boolean;
        marketing?: boolean;
    }): Promise<any>;
    getAddresses(userId: string): Promise<any>;
    createAddress(userId: string, data: {
        label?: string;
        firstName: string;
        lastName: string;
        phone: string;
        postalCode?: string;
        province: string;
        city: string;
        addressLine1: string;
        addressLine2?: string;
        country?: string;
        isDefault?: boolean;
    }): Promise<any>;
    updateAddress(userId: string, addressId: string, data: {
        label?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        postalCode?: string;
        province?: string;
        city?: string;
        addressLine1?: string;
        addressLine2?: string;
        isDefault?: boolean;
    }): Promise<any>;
    deleteAddress(userId: string, addressId: string): Promise<{
        success: boolean;
    }>;
    setDefaultAddress(userId: string, addressId: string): Promise<{
        success: boolean;
    }>;
};
//# sourceMappingURL=profile.service.d.ts.map