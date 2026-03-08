import { inngest } from "../../lib/inngest-client";
import { db } from "../../db";
import { profile } from "../../db/schema/profile";
import { eq, and, sql } from "drizzle-orm";
import { inventoryItem } from "../../db/schema/inventory-item";
import { product } from "../../db/schema/product";

interface LowStockItem {
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  minStock: number;
  location: string;
}

interface ProfileLowStockData {
  profileId: string;
  profileName: string;
  userId: string;
  items: LowStockItem[];
}

/**
 * Get all profiles with their low stock items
 */
async function getProfilesWithLowStock(): Promise<ProfileLowStockData[]> {
  // Get all profiles
  const allProfiles = await db.query.profile.findMany({
    columns: { id: true, displayName: true, userId: true },
  });

  const results: ProfileLowStockData[] = [];

  for (const profileData of allProfiles) {
    // Get low stock items for this profile
    const lowStockItems = await db
      .select({
        id: inventoryItem.id,
        productId: inventoryItem.productId,
        location: inventoryItem.location,
        quantity: inventoryItem.quantity,
        minStock: product.minStock,
        productName: product.name,
        productSku: product.sku,
      })
      .from(inventoryItem)
      .innerJoin(product, eq(inventoryItem.productId, product.id))
      .where(
        and(
          eq(inventoryItem.profileId, profileData.id),
          eq(inventoryItem.isActive, true),
          sql`${inventoryItem.quantity} <= ${product.minStock}`
        )
      );

    if (lowStockItems.length > 0) {
      results.push({
        profileId: profileData.id,
        profileName: profileData.displayName || "Sin nombre",
        userId: profileData.userId,
        items: lowStockItems.map((item) => ({
          productId: item.productId as string,
          productName: (item.productName as string) || "Producto desconocido",
          productSku: (item.productSku as string) || "N/A",
          currentStock: Number(item.quantity),
          minStock: Number(item.minStock) || 0,
          location: item.location,
        })),
      });
    }
  }

  return results;
}

/**
 * Format notification message for low stock alert
 */
function formatLowStockMessage(profileData: ProfileLowStockData): string {
  const itemsList = profileData.items
    .map(
      (item) =>
        `• ${item.productName} (SKU: ${item.productSku}): ${item.currentStock}/${item.minStock} unidades`
    )
    .join("\n");

  return `⚠️ *ALERTA DE STOCK BAJO*\n\n` +
    `Perfil: ${profileData.profileName}\n` +
    `Productos con stock bajo:\n\n${itemsList}\n\n` +
    `Por favor, reabastece estos productos pronto.`;
}

export const checkLowStock = inngest.createFunction(
  {
    id: "check-low-stock",
    name: "Check Low Stock Items",
  },
  { cron: "0 9 * * *" }, // Daily at 9 AM
  async ({ step, logger }) => {
    logger.info("Starting daily low stock check");

    // Step 1: Get all profiles with low stock items
    const profilesWithLowStock = await step.run(
      "get-low-stock-items",
      async () => {
        return getProfilesWithLowStock();
      }
    );

    logger.info(
      `Found ${profilesWithLowStock.length} profiles with low stock items`
    );

    // Step 2: Send notifications for each profile with low stock
    const notificationResults = await step.run(
      "send-low-stock-notifications",
      async () => {
        const results: Array<{
          profileId: string;
          success: boolean;
          message?: string;
          error?: string;
        }> = [];

        for (const profileData of profilesWithLowStock) {
          try {
            // Format the notification message
            const message = formatLowStockMessage(profileData);

            // Log the notification (in production, this would send via WhatsApp/Email)
            console.log(`[LOW STOCK ALERT] Sending to profile ${profileData.profileId}:`);
            console.log(message);
            console.log("---");

            // TODO: Integrate with actual notification service
            // For now, we log to console
            // In production:
            // await whatsappService.sendMessage({
            //   to: profileData.adminPhone,
            //   message: message
            // });

            results.push({
              profileId: profileData.profileId,
              success: true,
              message: `Alert sent for ${profileData.items.length} items`,
            });
          } catch (error) {
            logger.error(
              `Failed to send alert for profile ${profileData.profileId}`,
              { error }
            );
            results.push({
              profileId: profileData.profileId,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        return results;
      }
    );

    const successCount = notificationResults.filter((r) => r.success).length;
    const failureCount = notificationResults.filter((r) => !r.success).length;

    logger.info(
      `Low stock check completed: ${successCount} sent, ${failureCount} failed`
    );

    return {
      success: true,
      profilesChecked: profilesWithLowStock.length,
      totalLowStockProducts: profilesWithLowStock.reduce(
        (sum, p) => sum + p.items.length,
        0
      ),
      notificationsSent: successCount,
      notificationsFailed: failureCount,
      timestamp: new Date().toISOString(),
    };
  }
);

// Export for manual testing
export const testLowStockAlert = inngest.createFunction(
  {
    id: "test-low-stock-alert",
    name: "Test Low Stock Alert (Manual)",
  },
  { event: "inventory.test-low-stock" },
  async ({ event, step, logger }) => {
    logger.info("Manual low stock check triggered");

    // Same logic but triggered manually
    const profilesWithLowStock = await step.run(
      "get-low-stock-items",
      async () => {
        return getProfilesWithLowStock();
      }
    );

    const notificationResults = await step.run(
      "send-low-stock-notifications",
      async () => {
        const results: Array<{
          profileId: string;
          success: boolean;
        }> = [];

        for (const profileData of profilesWithLowStock) {
          try {
            const message = formatLowStockMessage(profileData);
            console.log(`[TEST LOW STOCK ALERT]:\n${message}`);
            results.push({
              profileId: profileData.profileId,
              success: true,
            });
          } catch (error) {
            results.push({
              profileId: profileData.profileId,
              success: false,
            });
          }
        }

        return results;
      }
    );

    return {
      success: true,
      profilesChecked: profilesWithLowStock.length,
      results: notificationResults,
    };
  }
);
