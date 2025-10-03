import { S3Client } from "@aws-sdk/client-s3";
export declare const s3: S3Client;
export declare const s3Storage: {
    putObject(bucket: string, key: string, body: Buffer | Uint8Array | Blob | string, contentType?: string): Promise<void>;
    deleteObject(bucket: string, key: string): Promise<void>;
    head(bucket: string, key: string): Promise<import("@aws-sdk/client-s3").HeadObjectCommandOutput | null>;
    getSignedUrl(bucket: string, key: string, expiresInSec?: number): Promise<string>;
    getUploadSignedUrl(bucket: string, key: string, contentType?: string, expiresInSec?: number): Promise<string>;
};
export default s3Storage;
//# sourceMappingURL=s3.storage.d.ts.map