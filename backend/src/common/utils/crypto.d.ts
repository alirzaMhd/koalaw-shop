export declare function hashSHA256(input: string): string;
export declare function hmacSHA256(secret: string, input: string): string;
export declare function randomBytesHex(len?: number): string;
export declare function randomNumeric(len?: number): string;
export declare function signAccessToken(payload: object): {
    token: any;
    expMs: number;
};
export declare function signRefreshToken(payload: object): {
    token: any;
    expMs: number;
};
export declare function verifyAccessToken(token: string): any;
export declare function verifyRefreshToken(token: string): any;
//# sourceMappingURL=crypto.d.ts.map