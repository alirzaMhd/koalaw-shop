import type { RequestHandler } from "express";
/**
 * Extend Express Request to include user property
 * This should match the declaration in authGuard.ts
 */
declare module "express-serve-static-core" {
    interface Request {
        user?: {
            id?: string;
            sub?: string;
            role?: string;
            [k: string]: any;
        };
    }
}
/**
 * Admin Guard Middleware
 *
 * Checks if the authenticated user has admin or staff privileges.
 *
 * @throws AppError.unauthorized if user is not authenticated
 * @throws AppError.forbidden if user doesn't have admin/staff role
 *
 * @example
 * // Use in routes:
 * router.get('/admin/dashboard', authGuard, adminGuard, adminController.getDashboard);
 *
 * // Or apply to all routes in a router:
 * router.use(authGuard);
 * router.use(adminGuard);
 * router.get('/dashboard', adminController.getDashboard);
 */
export declare const adminGuard: RequestHandler;
/**
 * Strict Admin Guard Middleware
 *
 * Only allows ADMIN role (excludes STAFF).
 * Use this for highly sensitive operations.
 *
 * @throws AppError.unauthorized if user is not authenticated
 * @throws AppError.forbidden if user is not an admin
 */
export declare const strictAdminGuard: RequestHandler;
/**
 * Role Check Middleware Factory
 *
 * Creates a middleware that checks for specific role(s).
 *
 * @param allowedRoles - Array of allowed role names (case-insensitive)
 * @returns RequestHandler middleware
 *
 * @example
 * // Allow only admins
 * router.use(requireRole(['ADMIN']));
 *
 * // Allow admins and staff
 * router.use(requireRole(['ADMIN', 'STAFF']));
 */
export declare const requireRole: (allowedRoles: string[]) => RequestHandler;
/**
 * Helper function to check if user has admin privileges
 * Can be used in controllers for conditional logic
 *
 * @param user - User object from req.user
 * @returns boolean indicating if user is admin or staff
 */
export declare const isAdmin: (user?: {
    role?: string;
}) => boolean;
/**
 * Helper function to check if user has strict admin privileges
 *
 * @param user - User object from req.user
 * @returns boolean indicating if user is admin (not staff)
 */
export declare const isStrictAdmin: (user?: {
    role?: string;
}) => boolean;
export default adminGuard;
//# sourceMappingURL=adminGuard.d.ts.map