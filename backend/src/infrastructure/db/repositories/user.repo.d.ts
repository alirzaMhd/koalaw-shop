import { Prisma } from "@prisma/client";
export declare const userRepo: {
    findById(id: string): any;
    findByPhone(phone: string): any;
    findByEmail(email: string): any;
    create(data: Prisma.UserCreateInput): any;
    update(id: string, data: Prisma.UserUpdateInput): any;
    upsertByEmail(email: string, createData: Prisma.UserCreateInput, updateData: Prisma.UserUpdateInput): any;
    getNotificationPrefs(userId: string): any;
    upsertNotificationPrefs(userId: string, data: Prisma.UserNotificationPrefsUncheckedCreateInput): any;
    listAddresses(userId: string): any;
    createAddress(userId: string, data: Omit<Prisma.UserAddressUncheckedCreateInput, "userId">): any;
    updateAddress(id: string, data: Prisma.UserAddressUncheckedUpdateInput): any;
    deleteAddress(id: string): any;
    unsetDefaultAddresses(userId: string, exceptId?: string): any;
};
export default userRepo;
//# sourceMappingURL=user.repo.d.ts.map