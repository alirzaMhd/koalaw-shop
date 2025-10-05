export declare const authService: {
    register(args: {
        email: string;
        password: string;
        ip?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            emailVerifiedAt: Date | null;
        };
        needsVerification: boolean;
    }>;
    login(args: {
        email: string;
        password: string;
        ip?: string;
        userAgent?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            emailVerifiedAt: Date;
        };
        tokens: {
            accessToken: string;
            accessTokenExpiresAt: number;
            refreshToken: string;
            refreshTokenExpiresAt: number;
            jti: `${string}-${string}-${string}-${string}-${string}`;
        };
    }>;
    verifyEmail(args: {
        email: string;
        code: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            emailVerifiedAt: Date | null;
        };
        tokens: {
            accessToken: string;
            accessTokenExpiresAt: number;
            refreshToken: string;
            refreshTokenExpiresAt: number;
            jti: `${string}-${string}-${string}-${string}-${string}`;
        };
    }>;
    resendVerificationCode(args: {
        email: string;
    }): Promise<{
        ttlSec: number;
    }>;
    forgotPassword(args: {
        email: string;
    }): Promise<{
        ttlSec: number;
    }>;
    resetPassword(args: {
        email: string;
        code: string;
        newPassword: string;
    }): Promise<{
        success: boolean;
    }>;
    refresh(args: {
        refreshToken?: string | undefined;
        ip?: string | undefined;
        userAgent?: string | undefined;
    }): Promise<{
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            emailVerifiedAt: Date | null;
        };
        tokens: {
            accessToken: string;
            accessTokenExpiresAt: number;
            refreshToken: string;
            refreshTokenExpiresAt: number;
            jti: `${string}-${string}-${string}-${string}-${string}`;
        };
    }>;
    logout(args: {
        userId: string;
        jti?: string | undefined;
        all?: boolean | undefined;
    }): Promise<{
        revoked: boolean;
    }>;
    me(userId: string): Promise<{
        id: string;
        email: string;
        phone: string | null;
        firstName: string | null;
        lastName: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        emailVerifiedAt: Date | null;
    }>;
};
//# sourceMappingURL=auth.service.d.ts.map