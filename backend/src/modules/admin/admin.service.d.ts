export declare const adminService: {
    getDashboardStats(): Promise<{
        stats: {
            totalProducts: any;
            totalOrders: any;
            totalUsers: any;
            totalRevenue: any;
            pendingOrders: any;
            activeProducts: any;
            newsletterSubscribers: any;
            pendingReviews: any;
        };
        recentOrders: any;
        topProducts: any;
        recentUsers: any;
    }>;
    listAllProducts(query: {
        page?: number;
        perPage?: number;
        search?: string;
        category?: string;
        isActive?: boolean;
    }): Promise<{
        products: any;
        meta: {
            page: number;
            perPage: number;
            total: any;
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
        orders: any;
        meta: {
            page: number;
            perPage: number;
            total: any;
            totalPages: number;
        };
    }>;
    updateOrderStatus(orderId: string, status: string): Promise<any>;
    listAllUsers(query: {
        page?: number;
        perPage?: number;
        search?: string;
        role?: string;
    }): Promise<{
        users: any;
        meta: {
            page: number;
            perPage: number;
            total: any;
            totalPages: number;
        };
    }>;
    updateUserRole(userId: string, role: string): Promise<any>;
    updateUserTier(userId: string, tier: string): Promise<any>;
    listPendingReviews(query: {
        page?: number;
        perPage?: number;
    }): Promise<{
        reviews: any;
        meta: {
            page: number;
            perPage: number;
            total: any;
            totalPages: number;
        };
    }>;
    listBrands(): Promise<any>;
    createBrand(data: {
        name: string;
        slug?: string;
    }): Promise<any>;
    updateBrand(id: string, data: {
        name?: string;
        slug?: string;
    }): Promise<any>;
    deleteBrand(id: string): Promise<{
        deleted: boolean;
    }>;
    listCollections(): Promise<any>;
    createCollection(data: {
        name: string;
    }): Promise<any>;
    updateCollection(id: string, data: {
        name: string;
    }): Promise<any>;
    deleteCollection(id: string): Promise<{
        deleted: boolean;
    }>;
    getNewsletterStats(): Promise<{
        total: any;
        active: any;
        unsubscribed: number;
        recentSubscribers: any;
    }>;
    listCoupons(query: {
        page?: number;
        perPage?: number;
    }): Promise<{
        coupons: any;
        meta: {
            page: number;
            perPage: number;
            total: any;
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
    }): Promise<any>;
    updateCoupon(id: string, data: any): Promise<any>;
    deleteCoupon(id: string): Promise<{
        deleted: boolean;
    }>;
};
//# sourceMappingURL=admin.service.d.ts.map