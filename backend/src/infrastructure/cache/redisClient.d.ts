export declare const redis: any;
export declare function setJSON(key: string, value: any, ttlSec?: number): Promise<void>;
export declare function getJSON<T = any>(key: string): Promise<T | null>;
export declare function incrWithTTL(key: string, ttlSec: number): Promise<number>;
export default redis;
//# sourceMappingURL=redisClient.d.ts.map