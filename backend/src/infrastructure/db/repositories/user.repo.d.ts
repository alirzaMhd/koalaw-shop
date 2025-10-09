import { Prisma } from "@prisma/client";
export declare const userRepo: {
    findById(id: string): Prisma.Prisma__UserClient<{
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
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findByPhone(phone: string): Prisma.Prisma__UserClient<{
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
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findByEmail(email: string): Prisma.Prisma__UserClient<{
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
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    create(data: any): Prisma.Prisma__UserClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    update(id: string, data: any): Prisma.Prisma__UserClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    upsertByEmail(email: string, createData: any, updateData: any): Prisma.Prisma__UserClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    getNotificationPrefs(userId: string): Prisma.Prisma__UserNotificationPrefsClient<{
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        orderUpdates: boolean;
        promotions: boolean;
        newProducts: boolean;
        marketing: boolean;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    upsertNotificationPrefs(userId: string, data: any): Prisma.Prisma__UserNotificationPrefsClient<{
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        orderUpdates: boolean;
        promotions: boolean;
        newProducts: boolean;
        marketing: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    listAddresses(userId: string): Prisma.PrismaPromise<{
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
    }[]>;
    createAddress(userId: string, data: Omit<any, "userId">): Prisma.Prisma__UserAddressClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    updateAddress(id: string, data: any): Prisma.Prisma__UserAddressClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    deleteAddress(id: string): Prisma.Prisma__UserAddressClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    unsetDefaultAddresses(userId: string, exceptId?: string): Prisma.PrismaPromise<Prisma.BatchPayload>;
};
export default userRepo;
//# sourceMappingURL=user.repo.d.ts.map