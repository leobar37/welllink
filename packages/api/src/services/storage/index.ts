import type { StorageStrategy } from "./storage.interface";
import { LocalStorageStrategy } from "./local.storage";

export type StorageProvider = "supabase" | "local";

export async function createStorageStrategy(
  provider?: StorageProvider,
): Promise<StorageStrategy> {
  const storageProvider =
    provider || (process.env.STORAGE_PROVIDER as StorageProvider) || "local";

  switch (storageProvider) {
    case "supabase": {
      const bucket = process.env.STORAGE_BUCKET;
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!bucket) {
        throw new Error("STORAGE_BUCKET is required for Supabase storage");
      }

      if (!supabaseUrl || !supabaseKey) {
        console.warn(
          "Supabase credentials not found, falling back to local storage",
        );
        return new LocalStorageStrategy();
      }

      // Dynamic import to avoid initialization errors
      const { SupabaseStorageStrategy } = await import("./supabase.storage");
      return new SupabaseStorageStrategy(bucket);
    }

    case "local":
    default:
      return new LocalStorageStrategy();
  }
}

export * from "./storage.interface";
export { LocalStorageStrategy } from "./local.storage";

// Dynamic export for Supabase to avoid initialization errors
export const SupabaseStorageStrategy = async () => {
  const { SupabaseStorageStrategy: Strategy } =
    await import("./supabase.storage");
  return Strategy;
};
