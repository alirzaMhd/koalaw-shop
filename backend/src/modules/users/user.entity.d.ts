export type Gender = "male" | "female" | "other" | "undisclosed";
export type CustomerTier = "standard" | "vip";
/**
 * Domain User (camelCase).
 * Note: Your SQL does not include "role"; we keep it optional and default to "customer" in mappers.
 */
export interface User {
    id: string;
    phone: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    birthDate?: Date | null;
    gender: Gender;
    customerTier: CustomerTier;
    phoneVerifiedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    role?: string;
}
/**
 * Public representation safe for returning to clients.
 */
export interface PublicUser {
    id: string;
    phoneMasked: string;
    firstName?: string | null;
    lastName?: string | null;
    customerTier: CustomerTier;
    gender: Gender;
    createdAt: Date;
}
/**
 * Notification Preferences (one-per-user).
 */
export interface UserNotificationPrefs {
    userId: string;
    orderUpdates: boolean;
    promotions: boolean;
    newProducts: boolean;
    marketing: boolean;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Address book entry for a user.
 */
export interface UserAddress {
    id: string;
    userId: string;
    label?: string | null;
    firstName: string;
    lastName: string;
    phone: string;
    postalCode?: string | null;
    province: string;
    city: string;
    addressLine1: string;
    addressLine2?: string | null;
    country: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Utilities
 */
export declare function maskPhone(phone: string): string;
export declare function getDisplayName(user: Pick<User, "firstName" | "lastName" | "phone">): string;
export declare const DEFAULT_NOTIFICATION_PREFS: Omit<UserNotificationPrefs, "userId" | "createdAt" | "updatedAt">;
/**
 * Mappers (handles either camelCase or snake_case sources)
 * Use these to convert DB rows (e.g., from Prisma or raw SQL) to domain entities.
 */
export declare function mapDbUserToEntity(row: any): User;
export declare function toPublicUser(u: User): PublicUser;
export declare function mapDbPrefsToEntity(row: any): UserNotificationPrefs;
export declare function mapDbAddressToEntity(row: any): UserAddress;
/**
 * Lightweight summary for dashboard (optional helper)
 */
export interface UserSummary {
    totalOrders: number;
    pendingOrders: number;
    favorites: number;
    tier: CustomerTier;
}
export declare function makeUserSummary(init?: Partial<UserSummary> & {
    tier?: CustomerTier;
}): UserSummary;
//# sourceMappingURL=user.entity.d.ts.map