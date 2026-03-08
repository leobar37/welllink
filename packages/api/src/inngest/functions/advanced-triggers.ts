/**
 * Advanced Automation Triggers
 * 
 * Implements the following trigger types:
 * - birthday: runs on client birthday
 * - inactivity: runs when no appointment in X days
 * - anniversary: runs on client registration anniversary
 * - low_stock: fires when product hits min_stock
 * - no_show: runs when appointment marked as no-show
 */

import { inngest } from "../../lib/inngest-client";
import { db } from "../../db";
import { eq, and, sql, isNull, gte, lte, or, not } from "drizzle-orm";
import { automation } from "../../db/schema/automation";
import { automationTrigger } from "../../db/schema/automation-trigger";
import { automationAction } from "../../db/schema/automation-action";
import { automationExecutionLog } from "../../db/schema/automation-execution-log";
import { client } from "../../db/schema/client";
import { reservation } from "../../db/schema/reservation";
import { profile } from "../../db/schema/profile";
import { product } from "../../db/schema/product";
import { inventoryItem } from "../../db/schema/inventory-item";
import { lowStockAlertSent } from "../../db/schema/low-stock-alert-sent";
import { whatsappConfig } from "../../db/schema/whatsapp-config";
import { EvolutionService } from "../../services/business/evolution-api";
import { env } from "../../config/env";
import type {
  BirthdayTriggerConfig,
  InactivityTriggerConfig,
  AnniversaryTriggerConfig,
  LowStockTriggerConfig,
  NoShowTriggerConfig,
} from "../../db/schema/automation-trigger";
import type { ReservationStatus } from "../../db/schema/reservation";

/**
 * Get EvolutionService instance
 */
function getEvolutionServiceInstance(): EvolutionService {
  return new EvolutionService({
    baseUrl: env.EVOLUTION_API_URL,
    apiKey: env.EVOLUTION_API_KEY,
  });
}

/**
 * Helper to process automation with trigger data
 */
async function processAutomationWithTriggerData(
  automationData: typeof automation.$inferSelect,
  triggerType: string,
  triggerData: Record<string, unknown>
): Promise<{ executed: boolean; success?: boolean; error?: string }> {
  const evolutionService = getEvolutionServiceInstance();

  // Get active actions for this automation
  const actions = await db.query.automationAction.findMany({
    where: and(
      eq(automationAction.automationId, automationData.id),
      eq(automationAction.isActive, true)
    ),
    orderBy: [automationAction.order],
  });

  if (actions.length === 0) {
    console.log(`[ADVANCED-TRIGGERS] No active actions for automation: ${automationData.name}`);
    return { executed: false };
  }

  // Create execution log
  const [executionLog] = await db.insert(automationExecutionLog).values({
    automationId: automationData.id,
    triggerType,
    triggerData,
    status: "running",
    startedAt: new Date(),
  }).returning();

  // Import and execute actions from execute-automation
  const { executeActions } = await import("./execute-automation");
  
  const result = await executeActions(
    actions,
    triggerData,
    automationData.profileId,
    evolutionService
  );

  // Update execution log
  await db.update(automationExecutionLog)
    .set({
      status: result.success ? "success" : (result.actionsExecuted.some(a => a.success) ? "partial" : "failed"),
      actionsExecuted: result.actionsExecuted,
      completedAt: new Date(),
      error: result.error,
    })
    .where(eq(automationExecutionLog.id, executionLog.id));

  return {
    executed: true,
    success: result.success,
    error: result.error,
  };
}

/**
 * Find automations with a specific trigger type
 */
async function findAutomationsByTriggerType(triggerType: "birthday" | "inactivity" | "anniversary" | "low_stock" | "no_show"): Promise<typeof automation.$inferSelect[]> {
  const triggers = await db.query.automationTrigger.findMany({
    where: and(
      sql`${automationTrigger.type} = ${triggerType}`,
      eq(automationTrigger.isActive, true)
    ),
  });

  if (triggers.length === 0) return [];

  const automationIds = Array.from(new Set(triggers.map(t => t.automationId)));
  
  return db.query.automation.findMany({
    where: and(
      eq(automation.enabled, true),
      sql`${automation.id} IN ${automationIds}`
    ),
  });
}

// ============================================================================
// BIRTHDAY TRIGGER
// ============================================================================

/**
 * Check birthday triggers - runs daily to find clients with birthdays today
 */
export const checkBirthdayTriggers = inngest.createFunction(
  {
    id: "check-birthday-triggers",
    name: "Check Birthday Triggers",
  },
  { cron: "0 9 * * *" }, // Daily at 9 AM
  async ({ logger }) => {
    logger.info("Checking birthday triggers");

    const automations = await findAutomationsByTriggerType("birthday");
    
    if (automations.length === 0) {
      logger.info("No birthday trigger automations found");
      return { triggered: 0 };
    }

    // Get today's date (month and day only)
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate(); // 1-31

    // Find clients with birthdays today (ignoring year)
    // Using raw SQL to compare month and day
    const clientsWithBirthdays = await db
      .select({
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        profileId: client.profileId,
        birthday: client.birthday,
      })
      .from(client)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${client.birthday}) = ${month}`,
          sql`EXTRACT(DAY FROM ${client.birthday}) = ${day}`
        )
      );

    // Get all profiles
    const profiles = await db.query.profile.findMany({
      columns: { id: true, displayName: true },
    });
    const profileMap = new Map(profiles.map(p => [p.id, p.displayName]));

    let triggeredCount = 0;

    // For each automation, process matching clients
    for (const automationData of automations) {
      const triggerConfig = await db.query.automationTrigger.findMany({
        where: and(
          eq(automationTrigger.automationId, automationData.id),
          eq(automationTrigger.type, "birthday"),
          eq(automationTrigger.isActive, true)
        ),
      });

      // Get clients for this automation's profile
      const profileClients = clientsWithBirthdays.filter(
        c => c.profileId === automationData.profileId
      );

      for (const trigger of triggerConfig) {
        const config = trigger.config as BirthdayTriggerConfig;
        const daysBefore = config.daysBefore ?? 0;
        const daysAfter = config.daysAfter ?? 0;

        // Find clients with birthdays within the window
        const targetClients = profileClients.filter(c => {
          if (!c.birthday) return false;
          const bday = new Date(c.birthday);
          const bdayMonth = bday.getMonth() + 1;
          const bdayDay = bday.getDate();
          
          // Check if birthday matches today (considering window)
          if (bdayMonth === month && bdayDay === day) {
            return true;
          }
          
          // Check days before (e.g., if today is 15th and daysBefore is 3, include birthdays on 12th-15th)
          if (daysBefore > 0) {
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() - daysBefore);
            const beforeMonth = targetDate.getMonth() + 1;
            const beforeDay = targetDate.getDate();
            if (bdayMonth === beforeMonth && bdayDay === beforeDay) {
              return true;
            }
          }
          
          // Check days after
          if (daysAfter > 0) {
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + daysAfter);
            const afterMonth = targetDate.getMonth() + 1;
            const afterDay = targetDate.getDate();
            if (bdayMonth === afterMonth && bdayDay === afterDay) {
              return true;
            }
          }
          
          return false;
        });

        // Execute automation for each matching client
        for (const clientData of targetClients) {
          const triggerData = {
            triggerType: "birthday",
            clientId: clientData.id,
            clientName: clientData.name,
            clientPhone: clientData.phone,
            clientEmail: clientData.email,
            birthday: clientData.birthday?.toISOString(),
            profileId: clientData.profileId,
            profileName: profileMap.get(clientData.profileId) || "Unknown",
          };

          const result = await processAutomationWithTriggerData(
            automationData,
            "birthday",
            triggerData
          );

          if (result.executed) {
            triggeredCount++;
          }
        }
      }
    }

    logger.info(`Birthday triggers completed: ${triggeredCount} executions`);
    return { triggered: triggeredCount };
  }
);


// ============================================================================
// INACTIVITY TRIGGER
// ============================================================================

/**
 * Check inactivity triggers - runs daily to find inactive clients
 */
export const checkInactivityTriggers = inngest.createFunction(
  {
    id: "check-inactivity-triggers",
    name: "Check Inactivity Triggers",
  },
  { cron: "0 10 * * *" }, // Daily at 10 AM
  async ({ logger }) => {
    logger.info("Checking inactivity triggers");

    const automations = await findAutomationsByTriggerType("inactivity");
    
    if (automations.length === 0) {
      logger.info("No inactivity trigger automations found");
      return { triggered: 0 };
    }

    const today = new Date();
    let triggeredCount = 0;

    for (const automationData of automations) {
      const triggers = await db.query.automationTrigger.findMany({
        where: and(
          eq(automationTrigger.automationId, automationData.id),
          eq(automationTrigger.type, "inactivity"),
          eq(automationTrigger.isActive, true)
        ),
      });

      for (const trigger of triggers) {
        const config = trigger.config as InactivityTriggerConfig;
        const daysInactive = config.daysInactive;
        const minAppointments = config.minAppointments ?? 0;

        // Calculate cutoff date
        const cutoffDate = new Date(today);
        cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

        // Find clients with no appointments since cutoff date
        // First, get all clients for this profile
        const allClients = await db.query.client.findMany({
          where: eq(client.profileId, automationData.profileId),
          columns: { id: true, name: true, phone: true, email: true },
        });

        // Get appointments within the last (daysInactive + 30) days to check activity
        const activityCheckDate = new Date(today);
        activityCheckDate.setDate(activityCheckDate.getDate() - (daysInactive + 30));

        const recentAppointments = await db
          .select({
            clientId: reservation.customerPhone,
            lastAppointment: sql`MAX(${reservation.scheduledAtUtc})`.as("last_appointment"),
          })
          .from(reservation)
          .where(
            and(
              eq(reservation.profileId, automationData.profileId),
              gte(reservation.scheduledAtUtc, activityCheckDate),
              eq(reservation.status, "completed" as ReservationStatus)
            )
          )
          .groupBy(reservation.customerPhone);

        const activeClientPhones = new Set(
          recentAppointments.map(a => a.clientId as string)
        );

        // Get clients with no recent appointments
        const inactiveClients = allClients.filter(c => {
          const hasRecentAppointment = activeClientPhones.has(c.phone);
          return !hasRecentAppointment;
        });

        // For minAppointments filtering, we need to count total appointments
        if (minAppointments > 0) {
          const clientAppointmentCounts = await db
            .select({
              clientId: reservation.customerPhone,
              count: sql`COUNT(*)`.as("count"),
            })
            .from(reservation)
            .where(
              and(
                eq(reservation.profileId, automationData.profileId),
                eq(reservation.status, "completed" as ReservationStatus)
              )
            )
            .groupBy(reservation.customerPhone);

          const appointmentCountMap = new Map(
            clientAppointmentCounts.map(c => [c.clientId as string, Number(c.count)])
          );

          // Filter to only clients with at least minAppointments
          const filteredInactive = inactiveClients.filter(c => {
            const count = appointmentCountMap.get(c.phone) || 0;
            return count >= minAppointments;
          });

          // Execute automation for each inactive client
          for (const clientData of filteredInactive) {
            const lastAppointment = recentAppointments.find(
              a => a.clientId === clientData.phone
            )?.lastAppointment as Date | undefined;

            const triggerData = {
              triggerType: "inactivity",
              clientId: clientData.id,
              clientName: clientData.name,
              clientPhone: clientData.phone,
              clientEmail: clientData.email,
              daysInactive,
              lastAppointment: lastAppointment?.toISOString(),
              profileId: automationData.profileId,
            };

            const result = await processAutomationWithTriggerData(
              automationData,
              "inactivity",
              triggerData
            );

            if (result.executed) {
              triggeredCount++;
            }
          }
        } else {
          // No minimum appointments requirement
          for (const clientData of inactiveClients) {
            const lastAppointment = recentAppointments.find(
              a => a.clientId === clientData.phone
            )?.lastAppointment as Date | undefined;

            const triggerData = {
              triggerType: "inactivity",
              clientId: clientData.id,
              clientName: clientData.name,
              clientPhone: clientData.phone,
              clientEmail: clientData.email,
              daysInactive,
              lastAppointment: lastAppointment?.toISOString(),
              profileId: automationData.profileId,
            };

            const result = await processAutomationWithTriggerData(
              automationData,
              "inactivity",
              triggerData
            );

            if (result.executed) {
              triggeredCount++;
            }
          }
        }
      }
    }

    logger.info(`Inactivity triggers completed: ${triggeredCount} executions`);
    return { triggered: triggeredCount };
  }
);


// ============================================================================
// ANNIVERSARY TRIGGER
// ============================================================================

/**
 * Check anniversary triggers - runs daily to find clients with registration anniversaries
 */
export const checkAnniversaryTriggers = inngest.createFunction(
  {
    id: "check-anniversary-triggers",
    name: "Check Anniversary Triggers",
  },
  { cron: "0 9 * * *" }, // Daily at 9 AM
  async ({ logger }) => {
    logger.info("Checking anniversary triggers");

    const automations = await findAutomationsByTriggerType("anniversary");
    
    if (automations.length === 0) {
      logger.info("No anniversary trigger automations found");
      return { triggered: 0 };
    }

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const year = today.getFullYear();

    let triggeredCount = 0;

    for (const automationData of automations) {
      const triggers = await db.query.automationTrigger.findMany({
        where: and(
          eq(automationTrigger.automationId, automationData.id),
          eq(automationTrigger.type, "anniversary"),
          eq(automationTrigger.isActive, true)
        ),
      });

      // Get clients with registration dates matching today
      const clientsWithAnniversaries = await db
        .select({
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email,
          profileId: client.profileId,
          registrationDate: client.registrationDate,
          createdAt: client.createdAt,
        })
        .from(client)
        .where(eq(client.profileId, automationData.profileId));

      for (const trigger of triggers) {
        const config = trigger.config as AnniversaryTriggerConfig;
        const { anniversaryType, daysBefore = 0, daysAfter = 0, minPeriods = 0 } = config;

        for (const clientData of clientsWithAnniversaries) {
          const regDate = clientData.registrationDate || clientData.createdAt;
          if (!regDate) continue;

          const reg = new Date(regDate);
          const regMonth = reg.getMonth() + 1;
          const regDay = reg.getDate();

          // Check if anniversary month/day matches today (considering window)
          let isAnniversary = false;
          
          if (regMonth === month && regDay === day) {
            isAnniversary = true;
          } else if (daysBefore > 0 || daysAfter > 0) {
            // Check window around today
            const beforeDate = new Date(today);
            beforeDate.setDate(beforeDate.getDate() - daysBefore);
            const afterDate = new Date(today);
            afterDate.setDate(afterDate.getDate() + daysAfter);
            
            const checkDate = new Date(today.getFullYear(), regMonth - 1, regDay);
            if (checkDate >= beforeDate && checkDate <= afterDate) {
              isAnniversary = true;
            }
          }

          if (!isAnniversary) continue;

          // Check minimum periods
          if (minPeriods > 0) {
            const yearsSinceRegistration = year - reg.getFullYear();
            const monthsSinceRegistration = yearsSinceRegistration * 12 + (month - regMonth);
            
            if (anniversaryType === "yearly" && yearsSinceRegistration < minPeriods) {
              continue;
            }
            if (anniversaryType === "monthly" && monthsSinceRegistration < minPeriods) {
              continue;
            }
            if (anniversaryType === "quarterly" && monthsSinceRegistration < minPeriods * 3) {
              continue;
            }
          }

          // Calculate anniversary number
          let anniversaryNumber: number;
          let anniversaryTypeLabel: string;
          
          if (anniversaryType === "yearly") {
            anniversaryNumber = year - reg.getFullYear();
            anniversaryTypeLabel = "año";
          } else if (anniversaryType === "quarterly") {
            const monthsSince = (year - reg.getFullYear()) * 12 + (month - regMonth);
            anniversaryNumber = Math.floor(monthsSince / 3);
            anniversaryTypeLabel = "trimestre";
          } else {
            const monthsSince = (year - reg.getFullYear()) * 12 + (month - regMonth);
            anniversaryNumber = monthsSince;
            anniversaryTypeLabel = "mes";
          }

          const triggerData = {
            triggerType: "anniversary",
            clientId: clientData.id,
            clientName: clientData.name,
            clientPhone: clientData.phone,
            clientEmail: clientData.email,
            registrationDate: regDate.toISOString(),
            anniversaryNumber,
            anniversaryType: anniversaryTypeLabel,
            profileId: automationData.profileId,
          };

          const result = await processAutomationWithTriggerData(
            automationData,
            "anniversary",
            triggerData
          );

          if (result.executed) {
            triggeredCount++;
          }
        }
      }
    }

    logger.info(`Anniversary triggers completed: ${triggeredCount} executions`);
    return { triggered: triggeredCount };
  }
);


// ============================================================================
// LOW STOCK TRIGGER (Enhanced for Automations)
// ============================================================================

/**
 * Check low stock triggers - fires when products hit min_stock threshold
 */
export const checkLowStockTriggers = inngest.createFunction(
  {
    id: "check-low-stock-triggers",
    name: "Check Low Stock Triggers",
  },
  { cron: "0 8 * * *" }, // Daily at 8 AM
  async ({ logger }) => {
    logger.info("Checking low stock triggers");

    const automations = await findAutomationsByTriggerType("low_stock");
    
    if (automations.length === 0) {
      logger.info("No low stock trigger automations found");
      return { triggered: 0 };
    }

    let triggeredCount = 0;

    for (const automationData of automations) {
      const triggers = await db.query.automationTrigger.findMany({
        where: and(
          eq(automationTrigger.automationId, automationData.id),
          eq(automationTrigger.type, "low_stock"),
          eq(automationTrigger.isActive, true)
        ),
      });

      for (const trigger of triggers) {
        const config = trigger.config as LowStockTriggerConfig;
        
        // Build query for low stock items
        let conditions = [
          eq(inventoryItem.profileId, automationData.profileId),
          eq(inventoryItem.isActive, true),
          sql`${inventoryItem.quantity} <= ${product.minStock}`,
        ];

        if (config.productIds && config.productIds.length > 0) {
          conditions.push(sql`${inventoryItem.productId} IN ${config.productIds}`);
        }

        const lowStockItems = await db
          .select({
            id: inventoryItem.id,
            productId: inventoryItem.productId,
            productName: product.name,
            productSku: product.sku,
            quantity: inventoryItem.quantity,
            minStock: product.minStock,
            location: inventoryItem.location,
          })
          .from(inventoryItem)
          .innerJoin(product, eq(inventoryItem.productId, product.id))
          .where(and(...conditions));

        if (lowStockItems.length === 0) {
          continue;
        }

        // Get profile info
        const profileData = await db.query.profile.findFirst({
          where: eq(profile.id, automationData.profileId),
          columns: { displayName: true },
        });

        // Check for one-time alerts (don't repeat until replenished)
        let alreadyAlerted: Set<string> = new Set();
        if (config.oneTimeUntilReplenished) {
          const alertRecords = await db.query.lowStockAlertSent.findMany({
            where: eq(lowStockAlertSent.profileId, automationData.profileId),
          });
          alreadyAlerted = new Set(alertRecords.map(a => a.productId));
        }

        // Filter out already alerted products
        const newLowStockItems = lowStockItems.filter(
          item => !alreadyAlerted.has(item.productId)
        );

        for (const item of newLowStockItems) {
          const triggerData = {
            triggerType: "low_stock",
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            currentStock: Number(item.quantity),
            minStock: Number(item.minStock),
            location: item.location,
            profileId: automationData.profileId,
            profileName: profileData?.displayName || "Unknown",
          };

          const result = await processAutomationWithTriggerData(
            automationData,
            "low_stock",
            triggerData
          );

          if (result.executed) {
            triggeredCount++;

            // Track alert if one-time
            if (config.oneTimeUntilReplenished) {
              await db.insert(lowStockAlertSent).values({
                profileId: automationData.profileId,
                productId: item.productId,
                sentAt: new Date(),
              });
            }
          }
        }
      }
    }

    logger.info(`Low stock triggers completed: ${triggeredCount} executions`);
    return { triggered: triggeredCount };
  }
);


// ============================================================================
// NO-SHOW TRIGGER (Event-based)
// ============================================================================

/**
 * Event handler for no-show triggers - fires when appointment marked as no-show
 */
export const handleNoShowTrigger = inngest.createFunction(
  {
    id: "handle-no-show-trigger",
    name: "Handle No-Show Trigger",
  },
  { event: "reservation.no_show" },
  async ({ event, logger }) => {
    logger.info("Processing no-show trigger", { reservationId: event.data.reservationId });

    const automations = await findAutomationsByTriggerType("no_show");
    
    if (automations.length === 0) {
      logger.info("No no-show trigger automations found");
      return { triggered: 0 };
    }

    // Get the reservation details
    const reservationData = await db.query.reservation.findFirst({
      where: eq(reservation.id, event.data.reservationId),
    });

    if (!reservationData) {
      logger.error("Reservation not found", { reservationId: event.data.reservationId });
      return { triggered: 0, error: "Reservation not found" };
    }

    // Get client info
    const clientData = await db.query.client.findFirst({
      where: and(
        eq(client.phone, reservationData.customerPhone),
        eq(client.profileId, reservationData.profileId)
      ),
    });

    let triggeredCount = 0;

    // Get profile name
    const profileData = await db.query.profile.findFirst({
      where: eq(profile.id, reservationData.profileId),
      columns: { displayName: true },
    });

    for (const automationData of automations) {
      // Only process automations for the same profile
      if (automationData.profileId !== reservationData.profileId) {
        continue;
      }

      const triggers = await db.query.automationTrigger.findMany({
        where: and(
          eq(automationTrigger.automationId, automationData.id),
          eq(automationTrigger.type, "no_show"),
          eq(automationTrigger.isActive, true)
        ),
      });

      for (const trigger of triggers) {
        const config = trigger.config as NoShowTriggerConfig;
        
        // Apply delay if configured
        if (config.delayHours && config.delayHours > 0) {
          // In a real implementation, this would schedule a delayed job
          // For now, we'll just execute immediately
          logger.info(`No-show delay configured: ${config.delayHours} hours (executing immediately)`);
        }

        const triggerData = {
          triggerType: "no_show",
          reservationId: reservationData.id,
          clientId: clientData?.id,
          clientName: clientData?.name || reservationData.customerName,
          clientPhone: reservationData.customerPhone,
          clientEmail: clientData?.email || reservationData.customerEmail,
          scheduledAt: reservationData.scheduledAtUtc?.toISOString(),
          serviceId: reservationData.serviceId,
          profileId: reservationData.profileId,
          profileName: profileData?.displayName || "Unknown",
        };

        const result = await processAutomationWithTriggerData(
          automationData,
          "no_show",
          triggerData
        );

        if (result.executed) {
          triggeredCount++;
        }
      }
    }

    logger.info(`No-show triggers completed: ${triggeredCount} executions`);
    return { triggered: triggeredCount };
  }
);


// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Test function to manually trigger birthday check
 */
export const testBirthdayTriggers = inngest.createFunction(
  {
    id: "test-birthday-triggers",
    name: "Test Birthday Triggers",
  },
  { event: "automation.test.birthday" },
  async ({ logger }) => {
    logger.info("Manually testing birthday triggers");
    // Execute the logic directly
    const automations = await findAutomationsByTriggerType("birthday");
    if (automations.length === 0) {
      logger.info("No birthday trigger automations found");
      return { triggered: 0 };
    }
    
    // Get today's date (month and day only)
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const clientsWithBirthdays = await db
      .select({
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        profileId: client.profileId,
        birthday: client.birthday,
      })
      .from(client)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${client.birthday}) = ${month}`,
          sql`EXTRACT(DAY FROM ${client.birthday}) = ${day}`
        )
      );
    
    return { triggered: 0, clientsFound: clientsWithBirthdays.length };
  }
);

/**
 * Test function to manually trigger inactivity check
 */
export const testInactivityTriggers = inngest.createFunction(
  {
    id: "test-inactivity-triggers",
    name: "Test Inactivity Triggers",
  },
  { event: "automation.test.inactivity" },
  async ({ logger }) => {
    logger.info("Manually testing inactivity triggers");
    const automations = await findAutomationsByTriggerType("inactivity");
    return { triggered: 0, automationsFound: automations.length };
  }
);

/**
 * Test function to manually trigger anniversary check
 */
export const testAnniversaryTriggers = inngest.createFunction(
  {
    id: "test-anniversary-triggers",
    name: "Test Anniversary Triggers",
  },
  { event: "automation.test.anniversary" },
  async ({ logger }) => {
    logger.info("Manually testing anniversary triggers");
    const automations = await findAutomationsByTriggerType("anniversary");
    return { triggered: 0, automationsFound: automations.length };
  }
);

/**
 * Test function to manually trigger low stock check
 */
export const testLowStockTriggers = inngest.createFunction(
  {
    id: "test-low-stock-triggers",
    name: "Test Low Stock Triggers",
  },
  { event: "automation.test.low_stock" },
  async ({ logger }) => {
    logger.info("Manually testing low stock triggers");
    const automations = await findAutomationsByTriggerType("low_stock");
    return { triggered: 0, automationsFound: automations.length };
  }
);
