export declare class AppError extends Error {
    httpStatus: number;
    code: string;
    expose: boolean;
    details?: any;
    constructor(message: string, httpStatus?: number, code?: string, expose?: boolean, details?: any);
    toJSON(): {
        details?: any;
        name: string;
        message: string;
        httpStatus: number;
        code: string;
    };
    static badRequest(msg?: string, code?: string, details?: any): AppError;
    static unauthorized(msg?: string, code?: string): AppError;
    static forbidden(msg?: string, code?: string): AppError;
    static notFound(msg?: string, code?: string): AppError;
    static conflict(msg?: string, code?: string): AppError;
    static tooMany(msg?: string, code?: string): AppError;
    static internal(msg?: string, code?: string): AppError;
}
export default AppError;
//# sourceMappingURL=AppError.d.ts.map