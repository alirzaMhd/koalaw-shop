// src/common/errors/AppError.ts
// Application error with HTTP status, code, and safe exposure flag.
export class AppError extends Error {
    httpStatus;
    code;
    expose;
    details;
    constructor(message, httpStatus = 500, code = "INTERNAL_ERROR", expose = true, details) {
        super(message);
        this.name = "AppError";
        this.httpStatus = httpStatus;
        this.code = code;
        this.expose = expose;
        this.details = details;
        Error.captureStackTrace?.(this, AppError);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            httpStatus: this.httpStatus,
            code: this.code,
            ...(this.details ? { details: this.details } : {}),
        };
    }
    // Helpers
    static badRequest(msg = "درخواست نامعتبر است.", code = "BAD_REQUEST", details) {
        return new AppError(msg, 400, code, true, details);
    }
    static unauthorized(msg = "احراز هویت لازم است.", code = "UNAUTHORIZED") {
        return new AppError(msg, 401, code);
    }
    static forbidden(msg = "دسترسی غیرمجاز.", code = "FORBIDDEN") {
        return new AppError(msg, 403, code);
    }
    static notFound(msg = "یافت نشد.", code = "NOT_FOUND") {
        return new AppError(msg, 404, code);
    }
    static conflict(msg = "تعارض در درخواست.", code = "CONFLICT") {
        return new AppError(msg, 409, code);
    }
    static tooMany(msg = "دفعات درخواست بیش از حد مجاز.", code = "TOO_MANY_REQUESTS") {
        return new AppError(msg, 429, code);
    }
    static internal(msg = "خطای داخلی سرور.", code = "INTERNAL_ERROR") {
        return new AppError(msg, 500, code, false);
    }
}
export default AppError;
//# sourceMappingURL=AppError.js.map