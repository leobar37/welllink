import { inngest } from "../../lib/inngest-client";
import { db } from "../../db";
import { profile } from "../../db/schema/profile";
import { eq, and, sql } from "drizzle-orm";
import { inventoryItem } from "../../db/schema/inventory-item";
import { product } from "../../db/schema/product";
import { whatsappConfig } from "../../db/schema/whatsapp-config";
import { evolutionService } from "./types";

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
    const profilesWithLowStockRaw = await step.run(
      "get-low-stock-items",
      async () => {
        return getProfilesWithLowStock();
      }
    );

    // Cast the deserialized JSON data back to the proper type
    const profilesWithLowStock = profilesWithLowStockRaw as ProfileLowStockData[];

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

            // Log the notification
            console.log(`[LOW STOCK ALERT] Sending to profile ${profileData.profileId}:`);
            console.log(message);
            console.log("---");

            // Get the profile's WhatsApp number
            const profileDataResult = await db
              .select({ whatsappNumber: profile.whatsappNumber })
              .from(profile)
              .where(eq(profile.id, profileData.profileId))
              .limit(1);

            const targetPhone = profileDataResult[0]?.whatsappNumber;

            if (!targetPhone) {
              console.log(`[LOW STOCK ALERT] No WhatsApp number configured for profile ${profileData.profileId}, skipping notification`);
              results.push({
                profileId: profileData.profileId,
                success: false,
                error: "No WhatsApp number configured",
              });
              continue;
            }

            // Get the active WhatsApp configuration for this profile
            const configs = await db
              .select()
              .from(whatsappConfig)
              .where(
                and(
                  eq(whatsappConfig.profileId, profileData.profileId),
                  eq(whatsappConfig.isEnabled, true),
                  eq(whatsappConfig.isConnected, true)
                )
              )
              .limit(1);

            if (configs.length === 0) {
              console.log(`[LOW STOCK ALERT] No active WhatsApp config for profile ${profileData.profileId}, skipping notification`);
              results.push({
                profileId: profileData.profileId,
                success: false,
                error: "No active WhatsApp configuration",
              });
              continue;
            }

            // Send the WhatsApp message via Evolution API
            const formattedPhone = evolutionService.formatPhoneNumber(targetPhone);
            await evolutionService.sendText(configs[0].instanceName, {
              number: formattedPhone,
              text: message,
            });

            console.log(`[LOW STOCK ALERT] Successfully sent notification to profile ${profileData.profileId}`);

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
    const profilesWithLowStockRaw = await step.run(
      "get-low-stock-items",
      async () => {
        return getProfilesWithLowStock();
      }
    );

    // Cast the deserialized JSON data back to the proper type
    const profilesWithLowStock = profilesWithLowStockRaw as ProfileLowStockData[];

    const notificationResults = await step.run(
      "send-low-stock-notifications",
      async () => {
        const results: Array<{
          profileId: string;
          success: boolean;
          error?: string;
        }> = [];

        for (const profileData of profilesWithLowStock) {
          try {
            // Format the notification message
            const message = formatLowStockMessage(profileData);
            console.log(`[TEST LOW STOCK ALERT]:\n${message}`);

            // Get the profile's WhatsApp number
            const profileDataResult = await db
              .select({ whatsappNumber: profile.whatsappNumber })
              .from(profile)
              .where(eq(profile.id, profileData.profileId))
              .limit(1);

            const targetPhone = profileDataResult[0]?.whatsappNumber;

            if (!targetPhone) {
              console.log(`[TEST LOW STOCK ALERT] No WhatsApp number configured for profile ${profileData.profileId}, skipping notification`);
              results.push({
                profileId: profileData.profileId,
                success: false,
                error: "No WhatsApp number configured",
              });
              continue;
            }

            // Get the active WhatsApp configuration for this profile
            const configs = await db
              .select()
              .from(whatsappConfig)
              .where(
                and(
                  eq(whatsappConfig.profileId, profileData.profileId),
                  eq(whatsappConfig.isEnabled, true),
                  eq(whatsappConfig.isConnected, true)
                )
              )
              .limit(1);

            if (configs.length === 0) {
              console.log(`[TEST LOW STOCK ALERT] No active WhatsApp config for profile ${profileData.profileId}, skipping notification`);
              results.push({
                profileId: profileData.profileId,
                success: false,
                error: "No active WhatsApp configuration",
              });
              continue;
            }

            // Send the WhatsApp message via Evolution API
            const formattedPhone = evolutionService.formatPhoneNumber(targetPhone);
            await evolutionService.sendText(configs[0].instanceName, {
              number: formattedPhone,
              text: message,
            });

            console.log(`[TEST LOW STOCK ALERT] Successfully sent notification to profile ${profileData.profileId}`);

            results.push({
              profileId: profileData.profileId,
              success: true,
            });
          } catch (error) {
            console.error(`[TEST LOW STOCK ALERT] Failed to send notification for profile ${profileData.profileId}:`, error);
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

    return {
      success: true,
      profilesChecked: profilesWithLowStock.length,
      results: notificationResults,
    };
  }
);
