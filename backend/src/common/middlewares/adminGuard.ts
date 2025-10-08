// backend/src/common/middlewares/adminGuard.ts
// Admin authorization guard: ensures user has admin or staff role
// Must be used AFTER authGuard to ensure req.user exists

import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { logger } from "../../config/logger.js";

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
      [k: string]: any 
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
export const adminGuard: RequestHandler = (req, _res, next) => {
  try {
    // Ensure user is authenticated (authGuard should be called first)
    if (!req.user) {
      logger.warn(
        { 
          path: req.path, 
          method: req.method 
        }, 
        "Admin guard called without authentication"
      );
      throw AppError.unauthorized("لطفاً ابتدا وارد شوید.");
    }

    // Extract and normalize role
    const userRole = req.user.role;
    
    if (!userRole || typeof userRole !== "string") {
      logger.warn(
        { 
          userId: req.user.id || req.user.sub, 
          role: userRole 
        }, 
        "User has invalid or missing role"
      );
      throw AppError.forbidden("نقش کاربری نامعتبر است.");
    }

    const normalizedRole = userRole.trim().toUpperCase();

    // Check if user has admin or staff privileges
    const isAdmin = normalizedRole === "ADMIN";
    const isStaff = normalizedRole === "STAFF";

    if (!isAdmin && !isStaff) {
      logger.warn(
        { 
          userId: req.user.id || req.user.sub, 
          role: normalizedRole,
          path: req.path,
          method: req.method
        }, 
        "Unauthorized admin access attempt"
      );
      throw AppError.forbidden(
        "دسترسی محدود. این بخش فقط برای مدیران سیستم در دسترس است."
      );
    }

    // Log successful admin access
    logger.info(
      { 
        userId: req.user.id || req.user.sub, 
        role: normalizedRole,
        path: req.path,
        method: req.method
      }, 
      "Admin access granted"
    );

    // User is authorized, proceed to next middleware
    next();
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
};

/**
 * Strict Admin Guard Middleware
 * 
 * Only allows ADMIN role (excludes STAFF).
 * Use this for highly sensitive operations.
 * 
 * @throws AppError.unauthorized if user is not authenticated
 * @throws AppError.forbidden if user is not an admin
 */
export const strictAdminGuard: RequestHandler = (req, _res, next) => {
  try {
    if (!req.user) {
      throw AppError.unauthorized("لطفاً ابتدا وارد شوید.");
    }

    const userRole = req.user.role;
    
    if (!userRole || typeof userRole !== "string") {
      throw AppError.forbidden("نقش کاربری نامعتبر است.");
    }

    const normalizedRole = userRole.trim().toUpperCase();

    if (normalizedRole !== "ADMIN") {
      logger.warn(
        { 
          userId: req.user.id || req.user.sub, 
          role: normalizedRole,
          path: req.path,
          method: req.method
        }, 
        "Unauthorized strict admin access attempt"
      );
      throw AppError.forbidden(
        "دسترسی محدود. این عملیات فقط برای ادمین‌های اصلی مجاز است."
      );
    }

    logger.info(
      { 
        userId: req.user.id || req.user.sub, 
        role: normalizedRole,
        path: req.path,
        method: req.method
      }, 
      "Strict admin access granted"
    );

    next();
  } catch (error) {
    next(error);
  }
};

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
export const requireRole = (allowedRoles: string[]): RequestHandler => {
  const normalizedRoles = allowedRoles.map(r => r.trim().toUpperCase());
  
  return (req, _res, next) => {
    try {
      if (!req.user) {
        throw AppError.unauthorized("لطفاً ابتدا وارد شوید.");
      }

      const userRole = req.user.role;
      
      if (!userRole || typeof userRole !== "string") {
        throw AppError.forbidden("نقش کاربری نامعتبر است.");
      }

      const normalizedUserRole = userRole.trim().toUpperCase();

      if (!normalizedRoles.includes(normalizedUserRole)) {
        logger.warn(
          { 
            userId: req.user.id || req.user.sub, 
            role: normalizedUserRole,
            requiredRoles: normalizedRoles,
            path: req.path,
            method: req.method
          }, 
          "Role check failed"
        );
        throw AppError.forbidden(
          `دسترسی محدود. نقش‌های مجاز: ${allowedRoles.join(", ")}`
        );
      }

      logger.debug(
        { 
          userId: req.user.id || req.user.sub, 
          role: normalizedUserRole,
          path: req.path
        }, 
        "Role check passed"
      );

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper function to check if user has admin privileges
 * Can be used in controllers for conditional logic
 * 
 * @param user - User object from req.user
 * @returns boolean indicating if user is admin or staff
 */
export const isAdmin = (user?: { role?: string }): boolean => {
  if (!user || !user.role) return false;
  const role = user.role.trim().toUpperCase();
  return role === "ADMIN" || role === "STAFF";
};

/**
 * Helper function to check if user has strict admin privileges
 * 
 * @param user - User object from req.user
 * @returns boolean indicating if user is admin (not staff)
 */
export const isStrictAdmin = (user?: { role?: string }): boolean => {
  if (!user || !user.role) return false;
  const role = user.role.trim().toUpperCase();
  return role === "ADMIN";
};

// Default export (main admin guard)
export default adminGuard;