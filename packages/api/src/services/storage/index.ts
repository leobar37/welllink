import type { StorageStrategy } from "./storage.interface";
import { SupabaseStorageStrategy } from "./supabase.storage";
import { LocalStorageStrategy } from "./local.storage";

export type StorageProvider = "supabase" | "local";

export function createStorageStrategy(
  provider?: StorageProvider
): StorageStrategy {
  const storageProvider =
    provider || (process.env.STORAGE_PROVIDER as StorageProvider) || "local";

  switch (storageProvider) {
    case "supabase": {
      const bucket = process.env.STORAGE_BUCKET;
      if (!bucket) {
        throw new Error("STORAGE_BUCKET is required for Supabase storage");
      }
      return new SupabaseStorageStrategy(bucket);
    }

    case "local":
    default:
      return new LocalStorageStrategy();
  }
}

export * from "./storage.interface";
export { SupabaseStorageStrategy } from "./supabase.storage";
export { LocalStorageStrategy } from "./local.storage";
