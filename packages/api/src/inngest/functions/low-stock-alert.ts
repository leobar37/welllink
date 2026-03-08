import { inngest } from "../../lib/inngest-client";
import { db } from "../../db";
import { profile } from "../../db/schema/profile";
import { eq, and, sql, inArray } from "drizzle-orm";
import { inventoryItem } from "../../db/schema/inventory-item";
import { product } from "../../db/schema/product";
import { whatsappConfig } from "../../db/schema/whatsapp-config";
import { lowStockAlertSent } from "../../db/schema/low-stock-alert-sent";
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

/**
 * Get products that already have alerts sent for a profile
 * Returns a map of productId -> alert record
 */
async function getExistingAlertsForProfile(
  profileId: string,
  productIds: string[]
): Promise<Map<string, { id: string; stockAtAlert: number | null }>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const alerts = await db
    .select({
      id: lowStockAlertSent.id,
      productId: lowStockAlertSent.productId,
      stockAtAlert: lowStockAlertSent.stockAtAlert,
    })
    .from(lowStockAlertSent)
    .where(
      and(
        eq(lowStockAlertSent.profileId, profileId),
        inArray(lowStockAlertSent.productId, productIds)
      )
    );

  const alertMap = new Map<string, { id: string; stockAtAlert: number | null }>();
  for (const alert of alerts) {
    alertMap.set(alert.productId, {
      id: alert.id,
      stockAtAlert: alert.stockAtAlert as number | null,
    });
  }

  return alertMap;
}

/**
 * Record that alerts were sent for products
 */
async function recordAlertsSent(
  profileId: string,
  items: LowStockItem[]
): Promise<void> {
  for (const item of items) {
    await db.insert(lowStockAlertSent).values({
      profileId,
      productId: item.productId,
      stockAtAlert: item.currentStock,
    });
  }
}

/**
 * Clear alert tracking for products that are no longer low stock
 * (i.e., stock has been replenished above minStock)
 */
async function clearReplenishedAlerts(profileId: string): Promise<number> {
  // Get all active alerts for this profile
  const existingAlerts = await db
    .select({
      productId: lowStockAlertSent.productId,
    })
    .from(lowStockAlertSent)
    .where(eq(lowStockAlertSent.profileId, profileId));

  if (existingAlerts.length === 0) {
    return 0;
  }

  const productIds = existingAlerts.map((a) => a.productId);

  // Check which products are now above minStock
  const inventoryWithProducts = await db
    .select({
      productId: inventoryItem.productId,
      quantity: inventoryItem.quantity,
      minStock: product.minStock,
    })
    .from(inventoryItem)
    .innerJoin(product, eq(inventoryItem.productId, product.id))
    .where(
      and(
        eq(inventoryItem.profileId, profileId),
        eq(inventoryItem.isActive, true),
        inArray(inventoryItem.productId, productIds)
      )
    );

  // Find products that are no longer low stock
  const replenishedProductIds: string[] = [];
  for (const item of inventoryWithProducts) {
    if (Number(item.quantity) > Number(item.minStock)) {
      replenishedProductIds.push(item.productId as string);
    }
  }

  // Delete alerts for replenished products
  if (replenishedProductIds.length > 0) {
    await db
      .delete(lowStockAlertSent)
      .where(
        and(
          eq(lowStockAlertSent.profileId, profileId),
          inArray(lowStockAlertSent.productId, replenishedProductIds)
        )
      );
  }

  return replenishedProductIds.length;
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

    // Step 2: Clear alerts for products that have been replenished
    const clearResults = await step.run(
      "clear-replenished-alerts",
      async () => {
        const results: Array<{ profileId: string; cleared: number }> = [];
        
        for (const profileData of profilesWithLowStock) {
          const cleared = await clearReplenishedAlerts(profileData.profileId);
          if (cleared > 0) {
            results.push({
              profileId: profileData.profileId,
              cleared,
            });
            logger.info(`Cleared ${cleared} alerts for profile ${profileData.profileId} (stock replenished)`);
          }
        }
        
        return results;
      }
    );

    // Step 3: Send notifications for each profile with low stock (excluding already alerted products)
    const notificationResults = await step.run(
      "send-low-stock-notifications",
      async () => {
        const results: Array<{
          profileId: string;
          success: boolean;
          message?: string;
          error?: string;
          newAlertsSent?: number;
          skippedDuplicates?: number;
        }> = [];

        for (const profileData of profilesWithLowStock) {
          try {
            // Get existing alerts to filter out duplicates
            const productIds = profileData.items.map((item) => item.productId);
            const existingAlerts = await getExistingAlertsForProfile(
              profileData.profileId,
              productIds
            );

            // Filter out products that already have alerts sent
            const newLowStockItems = profileData.items.filter(
              (item) => !existingAlerts.has(item.productId)
            );

            // If no new items to alert, skip
            if (newLowStockItems.length === 0) {
              logger.info(
                `Profile ${profileData.profileId}: All ${profileData.items.length} products already alerted, skipping`
              );
              results.push({
                profileId: profileData.profileId,
                success: true,
                message: "No new items to alert",
                skippedDuplicates: profileData.items.length,
              });
              continue;
            }

            // Create profile data with only new items
            const newProfileData: ProfileLowStockData = {
              ...profileData,
              items: newLowStockItems,
            };

            // Format the notification message
            const message = formatLowStockMessage(newProfileData);

            // Log the notification
            console.log(`[LOW STOCK ALERT] Sending to profile ${profileData.profileId}:`);
            console.log(message);
            console.log(`(Skipping ${profileData.items.length - newLowStockItems.length} already alerted products)`);
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

            // Record that alerts were sent for these products
            await recordAlertsSent(profileData.profileId, newLowStockItems);

            console.log(`[LOW STOCK ALERT] Recorded ${newLowStockItems.length} new alerts for profile ${profileData.profileId}`);

            results.push({
              profileId: profileData.profileId,
              success: true,
              message: `Alert sent for ${newLowStockItems.length} items`,
              newAlertsSent: newLowStockItems.length,
              skippedDuplicates: profileData.items.length - newLowStockItems.length,
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
    const newAlertsCount = notificationResults.reduce(
      (sum, r) => sum + (r.newAlertsSent || 0),
      0
    );
    const skippedDuplicatesCount = notificationResults.reduce(
      (sum, r) => sum + (r.skippedDuplicates || 0),
      0
    );

    logger.info(
      `Low stock check completed: ${successCount} sent, ${failureCount} failed, ${skippedDuplicatesCount} duplicates skipped`
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
      newAlertsSent: newAlertsCount,
      duplicatesSkipped: skippedDuplicatesCount,
      alertsCleared: clearResults.length,
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

    // Clear alerts for replenished products
    const clearResults = await step.run(
      "clear-replenished-alerts",
      async () => {
        const results: Array<{ profileId: string; cleared: number }> = [];
        
        for (const profileData of profilesWithLowStock) {
          const cleared = await clearReplenishedAlerts(profileData.profileId);
          if (cleared > 0) {
            results.push({
              profileId: profileData.profileId,
              cleared,
            });
          }
        }
        
        return results;
      }
    );

    const notificationResults = await step.run(
      "send-low-stock-notifications",
      async () => {
        const results: Array<{
          profileId: string;
          success: boolean;
          message?: string;
          error?: string;
          newAlertsSent?: number;
          skippedDuplicates?: number;
        }> = [];

        for (const profileData of profilesWithLowStock) {
          try {
            // Get existing alerts to filter out duplicates
            const productIds = profileData.items.map((item) => item.productId);
            const existingAlerts = await getExistingAlertsForProfile(
              profileData.profileId,
              productIds
            );

            // Filter out products that already have alerts sent
            const newLowStockItems = profileData.items.filter(
              (item) => !existingAlerts.has(item.productId)
            );

            // If no new items to alert, skip
            if (newLowStockItems.length === 0) {
              logger.info(
                `Profile ${profileData.profileId}: All ${profileData.items.length} products already alerted, skipping`
              );
              results.push({
                profileId: profileData.profileId,
                success: true,
                message: "No new items to alert",
                skippedDuplicates: profileData.items.length,
              });
              continue;
            }

            // Create profile data with only new items
            const newProfileData: ProfileLowStockData = {
              ...profileData,
              items: newLowStockItems,
            };

            // Format the notification message
            const message = formatLowStockMessage(newProfileData);
            console.log(`[TEST LOW STOCK ALERT]:\n${message}`);
            console.log(`(Skipping ${profileData.items.length - newLowStockItems.length} already alerted products)`);

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

            // Record that alerts were sent for these products
            await recordAlertsSent(profileData.profileId, newLowStockItems);

            console.log(`[TEST LOW STOCK ALERT] Recorded ${newLowStockItems.length} new alerts for profile ${profileData.profileId}`);

            results.push({
              profileId: profileData.profileId,
              success: true,
              newAlertsSent: newLowStockItems.length,
              skippedDuplicates: profileData.items.length - newLowStockItems.length,
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

    const successCount = notificationResults.filter((r) => r.success).length;
    const newAlertsCount = notificationResults.reduce(
      (sum, r) => sum + (r.newAlertsSent || 0),
      0
    );
    const skippedDuplicatesCount = notificationResults.reduce(
      (sum, r) => sum + (r.skippedDuplicates || 0),
      0
    );

    return {
      success: true,
      profilesChecked: profilesWithLowStock.length,
      results: notificationResults,
      newAlertsSent: newAlertsCount,
      duplicatesSkipped: skippedDuplicatesCount,
      alertsCleared: clearResults.length,
    };
  }
);
