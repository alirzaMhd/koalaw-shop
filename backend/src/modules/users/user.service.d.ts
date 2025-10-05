import { type User, type UserAddress, type UserNotificationPrefs, type Gender, type CustomerTier, type UserSummary } from "./user.entity.js";
export type UpdateProfileInput = Partial<{
    firstName: string;
    lastName: string;
    email: string | null;
    birthDate: string | Date | null;
    gender: Gender;
    customerTier: CustomerTier;
}>;
export type UpsertNotificationPrefsInput = Partial<{
    orderUpdates: boolean;
    promotions: boolean;
    newProducts: boolean;
    marketing: boolean;
}>;
export type AddressCreateInput = {
    label?: string | null;
    firstName: string;
    lastName: string;
    phone: string;
    postalCode?: string | null;
    province: string;
    city: string;
    addressLine1: string;
    addressLine2?: string | null;
    country?: string;
    isDefault?: boolean;
};
export type AddressUpdateInput = Partial<AddressCreateInput>;
declare class UserService {
    getMe(userId: string): Promise<User>;
    updateProfile(userId: string, input: UpdateProfileInput): Promise<User>;
    getNotificationPrefs(userId: string): Promise<UserNotificationPrefs>;
    updateNotificationPrefs(userId: string, prefs: UpsertNotificationPrefsInput): Promise<UserNotificationPrefs>;
    listAddresses(userId: string): Promise<UserAddress[]>;
    createAddress(userId: string, input: AddressCreateInput): Promise<UserAddress>;
    updateAddress(userId: string, addressId: string, input: AddressUpdateInput): Promise<UserAddress>;
    deleteAddress(userId: string, addressId: string): Promise<{
        deleted: boolean;
        reassignedDefault?: string | null;
    }>;
    setDefaultAddress(userId: string, addressId: string): Promise<UserAddress>;
    getSummary(userId: string): Promise<UserSummary>;
}
export declare const userService: UserService;
export {};
//# sourceMappingURL=user.service.d.ts.map