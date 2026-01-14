import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  StorageStrategy,
  UploadResult,
  UploadOptions,
} from "./storage.interface";
import { env } from "../../config/env";

export class SupabaseStorageStrategy implements StorageStrategy {
  private supabase: SupabaseClient;
  private initialized = false;

  constructor(private bucket: string) {
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const { error } = await this.supabase.storage.getBucket(this.bucket);

    if (error && error.message.includes("not found")) {
      const { error: createError } = await this.supabase.storage.createBucket(
        this.bucket,
        {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
            "video/mp4",
          ],
        },
      );

      if (createError) {
        console.error("Failed to create bucket:", createError);
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }

      console.log(`Bucket "${this.bucket}" created successfully`);
    } else if (error) {
      console.error("Error checking bucket:", error);
      throw new Error(`Error checking bucket: ${error.message}`);
    } else {
      console.log(`Bucket "${this.bucket}" already exists`);
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
    const storagePath = `${userId}/${folder}/${uuid}.${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(storagePath, file, {
        contentType: options?.contentType || file.type,
        cacheControl: options?.cacheControl || "3600",
        upsert: options?.upsert || false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    return {
      storagePath,
      size: file.size,
      mimeType: file.type,
      filename: file.name,
    };
  }

  async download(storagePath: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(storagePath);

    if (error) {
      console.error("Download error:", error);
      throw new Error(`Download failed: ${error.message}`);
    }

    return data;
  }

  async delete(storagePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([storagePath]);

    if (error) {
      console.error("Delete error:", error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  getPublicUrl(storagePath: string): string {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  async getSignedUrl(
    storagePath: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error("Signed URL error:", error);
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async exists(storagePath: string): Promise<boolean> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list(storagePath.split("/").slice(0, -1).join("/"), {
        search: storagePath.split("/").pop(),
      });

    if (error) {
      return false;
    }

    return data.length > 0;
  }
}
