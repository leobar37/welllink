import { promises as fs } from "fs";
import path from "path";
import type {
  StorageStrategy,
  UploadResult,
  UploadOptions,
} from "./storage.interface";

export class LocalStorageStrategy implements StorageStrategy {
  private uploadDir: string;
  private initialized = false;

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || path.join(process.cwd(), "uploads");
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log(`Local storage initialized at "${this.uploadDir}"`);
    } catch (error) {
      console.error("Failed to create upload directory:", error);
      throw new Error("Failed to initialize local storage");
    }

    this.initialized = true;
  }

  async upload(
    userId: string,
    file: File,
    type: "file" | "asset",
    _options?: UploadOptions
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

    const fullPath = path.join(this.uploadDir, storagePath);
    const dirPath = path.dirname(fullPath);

    await fs.mkdir(dirPath, { recursive: true });

    const buffer = await file.arrayBuffer();
    await fs.writeFile(fullPath, new Uint8Array(buffer));

    return {
      storagePath,
      size: file.size,
      mimeType: file.type,
      filename: file.name,
    };
  }

  async download(storagePath: string): Promise<Blob> {
    const fullPath = path.join(this.uploadDir, storagePath);

    try {
      const buffer = await fs.readFile(fullPath);
      return new Blob([buffer]);
    } catch (error) {
      throw new Error(`File not found: ${storagePath}`);
    }
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, storagePath);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.warn(`Failed to delete file: ${storagePath}`);
    }
  }

  getPublicUrl(storagePath: string): string {
    const baseUrl = process.env.API_BASE_URL || "http://localhost:5300";
    return `${baseUrl}/api/files/${encodeURIComponent(storagePath)}`;
  }

  async getSignedUrl(
    storagePath: string,
    _expiresIn: number = 3600
  ): Promise<string> {
    return this.getPublicUrl(storagePath);
  }

  async exists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(this.uploadDir, storagePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
