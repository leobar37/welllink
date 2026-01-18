import { createSeederContext } from "./helpers";
import { AssetRepository } from "../../services/repository/asset";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
import { asset } from "../schema/asset";
import { db } from "../index";

export const createdAssetIds: Record<string, string> = {};

const ASSET_DATA = [
  {
    key: "mariaAvatar",
    path: "https://ui-avatars.com/api/?name=Maria+Test&size=300&background=10B981&color=fff&bold=true",
    filename: "maria-avatar.jpg",
    mimeType: "image/jpeg",
    size: 45000,
    metadata: { width: 300, height: 300, generator: "ui-avatars" },
  },
  {
    key: "mariaCover",
    path: "https://placehold.co/1200x400/10B981/white?text=Maria+Test",
    filename: "maria-cover.jpg",
    mimeType: "image/jpeg",
    size: 120000,
    metadata: { width: 1200, height: 400, generator: "placehold.co" },
  },
  {
    key: "mariaStorySelfBefore",
    path: "https://placehold.co/1080x1350/172554/ffffff?text=Antes+Coach+Maria",
    filename: "maria-story-self-before.jpg",
    mimeType: "image/jpeg",
    size: 320000,
    metadata: { width: 1080, height: 1350, scenario: "before" },
  },
  {
    key: "mariaStorySelfAfter",
    path: "https://placehold.co/1080x1350/4ADE80/0F172A?text=Despues+Coach+Maria",
    filename: "maria-story-self-after.jpg",
    mimeType: "image/jpeg",
    size: 315000,
    metadata: { width: 1080, height: 1350, scenario: "after" },
  },
  {
    key: "mariaStoryClientBefore",
    path: "https://placehold.co/1080x1350/1E1B4B/ffffff?text=Antes+Cliente+Laura",
    filename: "maria-story-client-before.jpg",
    mimeType: "image/jpeg",
    size: 305000,
    metadata: { width: 1080, height: 1350, subject: "client" },
  },
  {
    key: "mariaStoryClientAfter",
    path: "https://placehold.co/1080x1350/FBBF24/0F172A?text=Despues+Cliente+Laura",
    filename: "maria-story-client-after.jpg",
    mimeType: "image/jpeg",
    size: 318000,
    metadata: { width: 1080, height: 1350, subject: "client" },
  },
];

export async function seedAssets() {
  console.log("📸 Seeding assets...");

  const assetRepository = new AssetRepository();
  const userId = await getTestUserId();

  for (const assetData of ASSET_DATA) {
    const { key, ...data } = assetData;
    const ctx = createSeederContext(userId);

    const existingAsset = await db.query.asset.findFirst({
      where: eq(asset.path, data.path),
    });

    if (existingAsset) {
      console.log(`  ✓ Asset ${data.filename} already exists, skipping`);
      createdAssetIds[key] = existingAsset.id;
      continue;
    }

    const created = await assetRepository.create(ctx, { ...data, userId });
    createdAssetIds[key] = created.id;
    console.log(`  ✓ Created asset: ${data.filename} - ID: ${created.id}`);
  }

  console.log("✅ Assets seeded successfully\n");
}
