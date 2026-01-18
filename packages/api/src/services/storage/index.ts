import type { StorageStrategy } from "./storage.interface";
import { R2StorageStrategy } from "./r2.storage";
import { env } from "../../config/env";

export type StorageProvider = "r2";

export async function createStorageStrategy(
  provider?: StorageProvider,
): Promise<StorageStrategy> {
  const storageProvider =
    provider || (env.STORAGE_PROVIDER as StorageProvider) || "r2";

  switch (storageProvider) {
    case "r2": {
      const bucket = env.STORAGE_BUCKET;
      const accountId = env.R2_ACCOUNT_ID;
      const accessKeyId = env.R2_ACCESS_KEY_ID;
      const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

      if (!bucket) {
        throw new Error("STORAGE_BUCKET is required for R2 storage");
      }

      if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error(
          "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required for R2 storage",
        );
      }

      return new R2StorageStrategy();
    }

    default:
      throw new Error(`Unsupported storage provider: ${storageProvider}`);
  }
}

export * from "./storage.interface";
export { R2StorageStrategy } from "./r2.storage";
