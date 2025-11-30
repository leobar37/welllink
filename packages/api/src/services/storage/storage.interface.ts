export interface UploadResult {
  storagePath: string;
  size: number;
  mimeType: string;
  filename: string;
}

export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface StorageStrategy {
  /**
   * Initialize storage (auto-create bucket if needed)
   */
  initialize(): Promise<void>;

  /**
   * Upload a file to storage
   */
  upload(
    userId: string,
    file: File,
    type: "file" | "asset",
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Download a file from storage
   */
  download(storagePath: string): Promise<Blob>;

  /**
   * Delete a file from storage
   */
  delete(storagePath: string): Promise<void>;

  /**
   * Get public URL for a file
   */
  getPublicUrl(storagePath: string): string;

  /**
   * Get signed URL for temporary access
   */
  getSignedUrl(storagePath: string, expiresIn?: number): Promise<string>;

  /**
   * Check if a file exists
   */
  exists(storagePath: string): Promise<boolean>;
}
