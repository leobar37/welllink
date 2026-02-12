import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageStrategy,
  UploadResult,
  UploadOptions,
} from "./storage.interface";
import { env } from "../../config/env";

export class R2StorageStrategy implements StorageStrategy {
  private s3: S3Client;
  private bucket: string;
  private publicUrlBase: string;
  private initialized = false;

  constructor() {
    const accountId = env.R2_ACCOUNT_ID;
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
    const bucket = env.STORAGE_BUCKET;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and STORAGE_BUCKET are required for R2 storage",
      );
    }

    this.bucket = bucket;
    this.publicUrlBase = `https://${bucket}.${accountId}.r2.cloudflarestorage.com`;

    this.s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if bucket exists
      await this.s3.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        }),
      );
      console.log(`R2 storage initialized. Bucket "${this.bucket}" exists.`);
    } catch (error: any) {
      // Bucket doesn't exist, try to create it
      if (
        error.name === "NotFound" ||
        error.name === "NoSuchBucket" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        try {
          await this.s3.send(
            new CreateBucketCommand({
              Bucket: this.bucket,
            }),
          );
          console.log(
            `R2 storage initialized. Bucket "${this.bucket}" created.`,
          );
        } catch (createError: any) {
          console.error(
            `Failed to create bucket "${this.bucket}":`,
            createError.message,
          );
          throw new Error(
            `Failed to create storage bucket: ${createError.message}`,
          );
        }
      } else {
        // Other error (permissions, etc.)
        console.warn(
          `R2 storage initialized for bucket "${this.bucket}". Warning: ${error.message}`,
        );
      }
    }

    this.initialized = true;
  }

  async upload(
    userId: string,
    file: File,
    type: "file" | "asset",
    options?: UploadOptions,
  ): Promise<UploadResult> {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error("File too large (max 10MB)");
    }

    const nameParts = file.name.split(".");
    const ext = nameParts.length > 1 ? nameParts.pop() : "bin";

    const folder = type === "asset" ? "assets" : "files";
    const uuid = crypto.randomUUID();
    const key = `${userId}/${folder}/${uuid}.${ext}`;

    const buffer = await file.arrayBuffer();

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: options?.contentType || file.type,
        CacheControl: options?.cacheControl || "3600",
      }),
    );

    return {
      storagePath: key,
      size: file.size,
      mimeType: file.type,
      filename: file.name,
    };
  }

  async download(storagePath: string): Promise<Blob> {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      }),
    );

    if (!response.Body) {
      throw new Error(`File not found: ${storagePath}`);
    }

    // Convert stream to Blob
    const chunks: BlobPart[] = [];
    const reader = response.Body.transformToWebStream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return new Blob(chunks);
  }

  async delete(storagePath: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storagePath,
        }),
      );
    } catch (error) {
      console.warn(`Failed to delete file: ${storagePath}`, error);
    }
  }

  getPublicUrl(storagePath: string): string {
    return `${this.publicUrlBase}/${storagePath}`;
  }

  async getSignedUrl(
    storagePath: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    return await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      }),
      { expiresIn },
    );
  }

  async exists(storagePath: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: storagePath,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
