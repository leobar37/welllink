import { db } from "../../db/index";
import { inventoryItem } from "../../db/schema/inventory-item";
import { createdProfileIds } from "./profiles.seeder";
import { createdProductIds } from "./products.seeder";

export const createdInventoryItemIds: Record<string, string> = {};

export async function seedInventoryItems() {
  console.log("📊 Seeding inventory items...");

  const profileKeys = ["maria", "clinic"];
  const locations = ["default", "almacén principal"];

  // Default stock quantities for each product
  const stockQuantities = [100, 50, 80, 60, 120, 200, 90, 15];

  for (const profileKey of profileKeys) {
    const profileId = createdProfileIds[profileKey];

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping inventory items`);
      continue;
    }

    // Get all products for this profile
    const products = await db.query.product.findMany({
      where: (product, { eq }) => eq(product.profileId, profileId),
    });

    if (products.length === 0) {
      console.log(`  ⚠️  No products found for profile ${profileKey}, skipping inventory`);
      continue;
    }

    // Check if inventory items already exist
    const existingItems = await db.query.inventoryItem.findMany({
      where: (item, { eq }) => eq(item.profileId, profileId),
    });

    if (existingItems.length > 0) {
      console.log(`  ✓ Inventory items already exist for profile ${profileKey}, skipping`);
      if (!createdInventoryItemIds[profileKey] && existingItems[0]) {
        createdInventoryItemIds[profileKey] = existingItems[0].id;
      }
      continue;
    }

    // Create inventory items for each product at default location
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const quantity = stockQuantities[i % stockQuantities.length];

      const [created] = await db.insert(inventoryItem).values({
        profileId,
        productId: product.id,
        location: "default",
        quantity,
        reservedQuantity: 0,
        averageCost: product.cost || "0",
        lastRestockedAt: new Date(),
        isActive: true,
      }).returning();

      if (!createdInventoryItemIds[profileKey]) {
        createdInventoryItemIds[profileKey] = created.id;
      }
    }

    console.log(`  ✓ Created ${products.length} inventory items for profile ${profileKey}`);
  }

  console.log("✅ Inventory items seeded successfully\n");
}
