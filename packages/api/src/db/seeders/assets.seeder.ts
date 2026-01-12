import { createSeederContext } from "./helpers";
import { AssetRepository } from "../../services/repository/asset";
import { SEED_USERS } from "./users.seeder";
import { eq } from "drizzle-orm";
import { asset } from "../schema/asset";
import { db } from "../index";

// Store created asset IDs for reference in other seeders
export const createdAssetIds: Record<string, string> = {};

const ASSET_DATA = [
  // María's assets
  {
    key: "mariaAvatar",
    userId: SEED_USERS[0].id,
    // UI Avatars - genera avatares con iniciales
    path: "https://ui-avatars.com/api/?name=Maria+Test&size=300&background=10B981&color=fff&bold=true",
    filename: "maria-avatar.jpg",
    mimeType: "image/jpeg",
    size: 45000,
    type: "avatar",
    metadata: { width: 300, height: 300, generator: "ui-avatars" },
  },
  {
    key: "mariaCover",
    userId: SEED_USERS[0].id,
    // Placeholder.co - servicio gratuito de placeholders
    path: "https://placehold.co/1200x400/10B981/white?text=Maria+Test",
    filename: "maria-cover.jpg",
    mimeType: "image/jpeg",
    size: 120000,
    type: "cover",
    metadata: { width: 1200, height: 400, generator: "placehold.co" },
  },
  // María's Tu Historia assets
  {
    key: "mariaStorySelfBefore",
    userId: SEED_USERS[0].id,
    path: "https://placehold.co/1080x1350/172554/ffffff?text=Antes+Coach+Maria",
    filename: "maria-story-self-before.jpg",
    mimeType: "image/jpeg",
    size: 320000,
    type: "story",
    metadata: { width: 1080, height: 1350, scenario: "before" },
  },
  {
    key: "mariaStorySelfAfter",
    userId: SEED_USERS[0].id,
    path: "https://placehold.co/1080x1350/4ADE80/0F172A?text=Despues+Coach+Maria",
    filename: "maria-story-self-after.jpg",
    mimeType: "image/jpeg",
    size: 315000,
    type: "story",
    metadata: { width: 1080, height: 1350, scenario: "after" },
  },
  {
    key: "mariaStoryClientBefore",
    userId: SEED_USERS[0].id,
    path: "https://placehold.co/1080x1350/1E1B4B/ffffff?text=Antes+Cliente+Laura",
    filename: "maria-story-client-before.jpg",
    mimeType: "image/jpeg",
    size: 305000,
    type: "story",
    metadata: { width: 1080, height: 1350, subject: "client" },
  },
  {
    key: "mariaStoryClientAfter",
    userId: SEED_USERS[0].id,
    path: "https://placehold.co/1080x1350/FBBF24/0F172A?text=Despues+Cliente+Laura",
    filename: "maria-story-client-after.jpg",
    mimeType: "image/jpeg",
    size: 318000,
    type: "story",
    metadata: { width: 1080, height: 1350, subject: "client" },
  },
];

export async function seedAssets() {
  console.log("📸 Seeding assets...");

  const assetRepository = new AssetRepository();

  for (const assetData of ASSET_DATA) {
    const { key, userId, ...data } = assetData;
    const ctx = createSeederContext(userId);

    // Check if asset already exists (idempotent)
    const existingAsset = await db.query.asset.findFirst({
      where: eq(asset.path, data.path),
    });

    if (existingAsset) {
      console.log(`  ✓ Asset ${data.filename} already exists, skipping`);
      createdAssetIds[key] = existingAsset.id;
      continue;
    }

    // Use repository to create asset (preserves business logic)
    const created = await assetRepository.create(ctx, data);
    createdAssetIds[key] = created.id;
    console.log(
      `  ✓ Created asset: ${data.filename} (${data.type}) - ID: ${created.id}`,
    );
  }

  console.log("✅ Assets seeded successfully\n");
}
