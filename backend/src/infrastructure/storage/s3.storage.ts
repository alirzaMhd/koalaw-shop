// src/infrastructure/storage/s3.storage.ts
// S3/MinIO storage adapter: uploads and signed URLs.
// Requires @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner.

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const region = env.S3_REGION || "auto";
const endpoint = env.S3_ENDPOINT || undefined;
const forcePathStyle = String(env.S3_FORCE_PATH_STYLE || "false") === "true";
const credentials =
  env.S3_ACCESS_KEY && env.S3_SECRET_KEY
    ? { accessKeyId: String(env.S3_ACCESS_KEY), secretAccessKey: String(env.S3_SECRET_KEY) }
    : undefined;

export const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle,
  credentials,
});

export const s3Storage = {
  async putObject(bucket: string, key: string, body: Buffer | Uint8Array | Blob | string, contentType?: string) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    logger.info({ bucket, key, size: (body as any)?.length }, "S3 object uploaded");
  },

  async deleteObject(bucket: string, key: string) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    logger.info({ bucket, key }, "S3 object deleted");
  },

  async head(bucket: string, key: string) {
    try {
      const out = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return out;
    } catch (e) {
      return null;
    }
  },

  async getSignedUrl(bucket: string, key: string, expiresInSec = 300) {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3, cmd, { expiresIn: expiresInSec });
  },

  async getUploadSignedUrl(bucket: string, key: string, contentType?: string, expiresInSec = 300) {
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    return getSignedUrl(s3, cmd, { expiresIn: expiresInSec });
  },
};

export default s3Storage;