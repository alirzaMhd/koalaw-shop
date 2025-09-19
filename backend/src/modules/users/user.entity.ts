// src/modules/users/user.entity.ts
// Domain types and mappers for User, Addresses, and Notification Preferences.
// Designed to match your SQL migration while keeping camelCase in the domain layer.

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

  // Optional in domain; default "customer" if not stored in DB
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

  country: string; // e.g., "IR"
  isDefault: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Utilities
 */
export function maskPhone(phone: string): string {
  const d = (phone || "").replace(/\D/g, "");
  return d ? d.replace(/\d(?=\d{4})/g, "•") : "";
}

export function getDisplayName(user: Pick<User, "firstName" | "lastName" | "phone">): string {
  const n = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return n || maskPhone(user.phone);
}

export const DEFAULT_NOTIFICATION_PREFS: Omit<UserNotificationPrefs, "userId" | "createdAt" | "updatedAt"> = {
  orderUpdates: true,
  promotions: true,
  newProducts: true,
  marketing: false,
};

function toDate(v: any): Date | null {
  if (!v) return null;
  return v instanceof Date ? v : new Date(v);
}

/**
 * Mappers (handles either camelCase or snake_case sources)
 * Use these to convert DB rows (e.g., from Prisma or raw SQL) to domain entities.
 */
export function mapDbUserToEntity(row: any): User {
  if (!row) throw new Error("mapDbUserToEntity: row is required");
  const user: User = {
    id: row.id,
    phone: row.phone,
    email: row.email ?? null,

    firstName: row.firstName ?? row.first_name ?? null,
    lastName: row.lastName ?? row.last_name ?? null,
    birthDate: toDate(row.birthDate ?? row.birth_date),

    gender: (row.gender ?? "undisclosed") as Gender,
    customerTier: (row.customerTier ?? row.customer_tier ?? "standard") as CustomerTier,

    phoneVerifiedAt: toDate(row.phoneVerifiedAt ?? row.phone_verified_at),

    createdAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.created_at ?? row.createdAt)) as Date,
    updatedAt: (row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updated_at ?? row.updatedAt)) as Date,

    // Not present in SQL schema; keep for domain compatibility (defaults to "customer")
    role: row.role ?? "customer",
  };
  return user;
}

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    phoneMasked: maskPhone(u.phone),
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    customerTier: u.customerTier,
    gender: u.gender,
    createdAt: u.createdAt,
  };
}

export function mapDbPrefsToEntity(row: any): UserNotificationPrefs {
  if (!row) throw new Error("mapDbPrefsToEntity: row is required");
  return {
    userId: row.userId ?? row.user_id,
    orderUpdates: Boolean(row.orderUpdates ?? row.order_updates ?? true),
    promotions: Boolean(row.promotions ?? true),
    newProducts: Boolean(row.newProducts ?? row.new_products ?? true),
    marketing: Boolean(row.marketing ?? false),
    createdAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.created_at ?? row.createdAt)) as Date,
    updatedAt: (row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updated_at ?? row.updatedAt)) as Date,
  };
}

export function mapDbAddressToEntity(row: any): UserAddress {
  if (!row) throw new Error("mapDbAddressToEntity: row is required");
  return {
    id: row.id,
    userId: row.userId ?? row.user_id,

    label: row.label ?? null,

    firstName: row.firstName ?? row.first_name,
    lastName: row.lastName ?? row.last_name,
    phone: row.phone,

    postalCode: row.postalCode ?? row.postal_code ?? null,
    province: row.province,
    city: row.city,
    addressLine1: row.addressLine1 ?? row.address_line1,
    addressLine2: row.addressLine2 ?? row.address_line2 ?? null,

    country: row.country ?? "IR",
    isDefault: Boolean(row.isDefault ?? row.is_default ?? false),

    createdAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.created_at ?? row.createdAt)) as Date,
    updatedAt: (row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updated_at ?? row.updatedAt)) as Date,
  };
}

/**
 * Lightweight summary for dashboard (optional helper)
 */
export interface UserSummary {
  totalOrders: number;
  pendingOrders: number;
  favorites: number;
  tier: CustomerTier;
}

export function makeUserSummary(init?: Partial<UserSummary> & { tier?: CustomerTier }): UserSummary {
  return {
    totalOrders: init?.totalOrders ?? 0,
    pendingOrders: init?.pendingOrders ?? 0,
    favorites: init?.favorites ?? 0,
    tier: init?.tier ?? "standard",
  };
}