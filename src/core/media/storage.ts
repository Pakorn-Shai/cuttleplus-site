import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { AllowedImageType } from "./validation";

export interface StoredObject {
  provider: "local" | "s3";
  bucket: string;
  objectKey: string;
  publicUrl: string;
}

interface StorageAdapter {
  put(objectKey: string, body: Uint8Array, contentType: AllowedImageType): Promise<StoredObject>;
  delete(objectKey: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  private readonly root = path.join(process.cwd(), "public", "uploads");

  async put(objectKey: string, body: Uint8Array): Promise<StoredObject> {
    const target = path.join(this.root, objectKey);
    if (!target.startsWith(`${this.root}${path.sep}`)) throw new Error("INVALID_OBJECT_KEY");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body, { flag: "wx" });
    return { provider: "local", bucket: "public/uploads", objectKey, publicUrl: `/uploads/${objectKey}` };
  }

  async delete(objectKey: string) {
    const target = path.join(this.root, objectKey);
    if (!target.startsWith(`${this.root}${path.sep}`)) throw new Error("INVALID_OBJECT_KEY");
    try { await unlink(target); } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
}

class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;

  constructor(private readonly config: { bucket: string; publicBaseUrl: string; endpoint?: string; region: string; accessKeyId: string; secretAccessKey: string }) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }

  async put(objectKey: string, body: Uint8Array, contentType: AllowedImageType): Promise<StoredObject> {
    await this.client.send(new PutObjectCommand({ Bucket: this.config.bucket, Key: objectKey, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
    return { provider: "s3", bucket: this.config.bucket, objectKey, publicUrl: `${this.config.publicBaseUrl.replace(/\/$/, "")}/${objectKey}` };
  }

  async delete(objectKey: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: objectKey }));
  }
}

export function getStorageAdapter(provider?: string): StorageAdapter {
  if (provider === "local") return new LocalStorageAdapter();
  const bucket = process.env.STORAGE_BUCKET;
  const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  if (bucket && publicBaseUrl && accessKeyId && secretAccessKey) {
    return new S3StorageAdapter({ bucket, publicBaseUrl, accessKeyId, secretAccessKey, endpoint: process.env.STORAGE_ENDPOINT, region: process.env.STORAGE_REGION ?? "auto" });
  }
  if (provider === "s3" || process.env.NODE_ENV === "production") throw new Error("STORAGE_NOT_CONFIGURED");
  return new LocalStorageAdapter();
}

export function createMediaObjectKey(mimeType: AllowedImageType, now = new Date()) {
  const extension: Record<AllowedImageType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
  return `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extension[mimeType]}`;
}
