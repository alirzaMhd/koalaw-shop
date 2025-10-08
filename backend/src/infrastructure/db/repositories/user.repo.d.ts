export declare const userRepo: {
    findById(id: string): any;
    findByPhone(phone: string): any;
    findByEmail(email: string): any;
    create(data: any): any;
    update(id: string, data: any): any;
    upsertByEmail(email: string, createData: any, updateData: any): any;
    getNotificationPrefs(userId: string): any;
    upsertNotificationPrefs(userId: string, data: any): any;
    listAddresses(userId: string): any;
    createAddress(userId: string, data: Omit<any, "userId">): any;
    updateAddress(id: string, data: any): any;
    deleteAddress(id: string): any;
    unsetDefaultAddresses(userId: string, exceptId?: string): any;
};
export default userRepo;
//# sourceMappingURL=user.repo.d.ts.map