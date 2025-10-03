// src/modules/users/user.entity.ts
// Domain types and mappers for User, Addresses, and Notification Preferences.
// Designed to match your SQL migration while keeping camelCase in the domain layer.
/**
 * Utilities
 */
export function maskPhone(phone) {
    const d = (phone || "").replace(/\D/g, "");
    return d ? d.replace(/\d(?=\d{4})/g, "•") : "";
}
export function getDisplayName(user) {
    const n = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return n || maskPhone(user.phone);
}
export const DEFAULT_NOTIFICATION_PREFS = {
    orderUpdates: true,
    promotions: true,
    newProducts: true,
    marketing: false,
};
function toDate(v) {
    if (!v)
        return null;
    return v instanceof Date ? v : new Date(v);
}
/**
 * Mappers (handles either camelCase or snake_case sources)
 * Use these to convert DB rows (e.g., from Prisma or raw SQL) to domain entities.
 */
export function mapDbUserToEntity(row) {
    if (!row)
        throw new Error("mapDbUserToEntity: row is required");
    const user = {
        id: row.id,
        phone: row.phone,
        email: row.email ?? null,
        firstName: row.firstName ?? row.first_name ?? null,
        lastName: row.lastName ?? row.last_name ?? null,
        birthDate: toDate(row.birthDate ?? row.birth_date),
        gender: (row.gender ?? "undisclosed"),
        customerTier: (row.customerTier ?? row.customer_tier ?? "standard"),
        phoneVerifiedAt: toDate(row.phoneVerifiedAt ?? row.phone_verified_at),
        createdAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.created_at ?? row.createdAt)),
        updatedAt: (row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updated_at ?? row.updatedAt)),
        // Not present in SQL schema; keep for domain compatibility (defaults to "customer")
        role: row.role ?? "customer",
    };
    return user;
}
export function toPublicUser(u) {
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
export function mapDbPrefsToEntity(row) {
    if (!row)
        throw new Error("mapDbPrefsToEntity: row is required");
    return {
        userId: row.userId ?? row.user_id,
        orderUpdates: Boolean(row.orderUpdates ?? row.order_updates ?? true),
        promotions: Boolean(row.promotions ?? true),
        newProducts: Boolean(row.newProducts ?? row.new_products ?? true),
        marketing: Boolean(row.marketing ?? false),
        createdAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.created_at ?? row.createdAt)),
        updatedAt: (row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updated_at ?? row.updatedAt)),
    };
}
export function mapDbAddressToEntity(row) {
    if (!row)
        throw new Error("mapDbAddressToEntity: row is required");
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
        createdAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.created_at ?? row.createdAt)),
        updatedAt: (row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updated_at ?? row.updatedAt)),
    };
}
export function makeUserSummary(init) {
    return {
        totalOrders: init?.totalOrders ?? 0,
        pendingOrders: init?.pendingOrders ?? 0,
        favorites: init?.favorites ?? 0,
        tier: init?.tier ?? "standard",
    };
}
//# sourceMappingURL=user.entity.js.map