import { Prisma } from "@prisma/client";
export declare const userRepo: {
    findById(id: string): Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        passwordHash: string;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        emailVerifiedAt: Date | null;
        phoneVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profileImageUrl: string | null;
        role: import("@prisma/client").$Enums.UserRole;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findByPhone(phone: string): Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        passwordHash: string;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        emailVerifiedAt: Date | null;
        phoneVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profileImageUrl: string | null;
        role: import("@prisma/client").$Enums.UserRole;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    findByEmail(email: string): Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        passwordHash: string;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        emailVerifiedAt: Date | null;
        phoneVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profileImageUrl: string | null;
        role: import("@prisma/client").$Enums.UserRole;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    create(data: Prisma.UserCreateInput): Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        passwordHash: string;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        emailVerifiedAt: Date | null;
        phoneVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profileImageUrl: string | null;
        role: import("@prisma/client").$Enums.UserRole;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    update(id: string, data: Prisma.UserUpdateInput): Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        passwordHash: string;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        emailVerifiedAt: Date | null;
        phoneVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profileImageUrl: string | null;
        role: import("@prisma/client").$Enums.UserRole;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, {
        log: any;
    }>;
    upsertByEmail(email: string, createData: Prisma.UserCreateInput, updateData: Prisma.UserUpdateInput): Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        passwordHash: string;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        birthDate: Date | null;
        gender: import("@prisma/client").$Enums.Gender;
        customerTier: import("@prisma/client").$Enums.CustomerTier;
        emailVerifiedAt: Date | null;
        phoneVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profileImageUrl: string | null;
        role: import("@prisma/client").$Enums.UserRole;
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
    upsertNotificationPrefs(userId: string, data: Prisma.UserNotificationPrefsUncheckedCreateInput): Prisma.Prisma__UserNotificationPrefsClient<{
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
    createAddress(userId: string, data: Omit<Prisma.UserAddressUncheckedCreateInput, "userId">): Prisma.Prisma__UserAddressClient<{
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
    updateAddress(id: string, data: Prisma.UserAddressUncheckedUpdateInput): Prisma.Prisma__UserAddressClient<{
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