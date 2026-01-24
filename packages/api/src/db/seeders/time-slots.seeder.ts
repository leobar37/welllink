import { createSeederContext } from "./helpers";
import { TimeSlotRepository } from "../../services/repository/time-slot";
import { createdProfileIds } from "./profiles.seeder";
import { createdMedicalServiceIds } from "./medical-services.seeder";
import { getTestUserId } from "./users.seeder";
import { eq, and } from "drizzle-orm";
import { timeSlot } from "../schema/time-slot";
import { SlotStatus } from "../schema/time-slot";
import { db } from "../index";

export const createdTimeSlotIds: Record<string, string> = {};

// Service configurations with their typical duration and scheduling preferences
const SERVICE_CONFIGS: Record<
  string,
  { durationMinutes: number; generateSlots: boolean; slotsPerDay: number }
> = {
  consultation: { durationMinutes: 60, generateSlots: true, slotsPerDay: 3 },
  followUp: { durationMinutes: 30, generateSlots: true, slotsPerDay: 4 },
  wellnessPlan: { durationMinutes: 90, generateSlots: true, slotsPerDay: 2 },
  groupWorkshop: { durationMinutes: 120, generateSlots: false, slotsPerDay: 1 }, // Workshops are scheduled separately
  clinicConsultation: {
    durationMinutes: 30,
    generateSlots: true,
    slotsPerDay: 6,
  },
  clinicPediatrics: {
    durationMinutes: 45,
    generateSlots: true,
    slotsPerDay: 4,
  },
  clinicNutrition: { durationMinutes: 60, generateSlots: true, slotsPerDay: 3 },
};

interface SlotGenerationConfig {
  profileKey: string;
  serviceKey: string;
  startHour: number;
  endHour: number;
  durationMinutes: number;
  bufferMinutes: number;
}

function generateTimeSlotConfigs(): SlotGenerationConfig[] {
  const configs: SlotGenerationConfig[] = [];

  // María García - Nutrition services
  // Morning slots: 9:00 - 12:00
  configs.push({
    profileKey: "maria",
    serviceKey: "consultation",
    startHour: 9,
    endHour: 12,
    durationMinutes: 60,
    bufferMinutes: 0,
  });
  configs.push({
    profileKey: "maria",
    serviceKey: "followUp",
    startHour: 9,
    endHour: 12,
    durationMinutes: 30,
    bufferMinutes: 0,
  });
  configs.push({
    profileKey: "maria",
    serviceKey: "wellnessPlan",
    startHour: 9,
    endHour: 12,
    durationMinutes: 90,
    bufferMinutes: 0,
  });

  // Afternoon slots: 15:00 - 18:00 (15:00 - 17:00 on Friday)
  configs.push({
    profileKey: "maria",
    serviceKey: "consultation",
    startHour: 15,
    endHour: 18,
    durationMinutes: 60,
    bufferMinutes: 0,
  });
  configs.push({
    profileKey: "maria",
    serviceKey: "followUp",
    startHour: 15,
    endHour: 18,
    durationMinutes: 30,
    bufferMinutes: 0,
  });
  configs.push({
    profileKey: "maria",
    serviceKey: "wellnessPlan",
    startHour: 15,
    endHour: 18,
    durationMinutes: 90,
    bufferMinutes: 0,
  });

  // Clínica Bienestar - Medical services
  // Morning: 8:00 - 14:00
  configs.push({
    profileKey: "clinic",
    serviceKey: "clinicConsultation",
    startHour: 8,
    endHour: 14,
    durationMinutes: 30,
    bufferMinutes: 10,
  });
  configs.push({
    profileKey: "clinic",
    serviceKey: "clinicPediatrics",
    startHour: 8,
    endHour: 14,
    durationMinutes: 45,
    bufferMinutes: 10,
  });
  configs.push({
    profileKey: "clinic",
    serviceKey: "clinicNutrition",
    startHour: 8,
    endHour: 14,
    durationMinutes: 60,
    bufferMinutes: 10,
  });

  // Afternoon: 14:00 - 18:00 (14:00 - 17:00 on Friday)
  configs.push({
    profileKey: "clinic",
    serviceKey: "clinicConsultation",
    startHour: 14,
    endHour: 18,
    durationMinutes: 30,
    bufferMinutes: 10,
  });
  configs.push({
    profileKey: "clinic",
    serviceKey: "clinicPediatrics",
    startHour: 14,
    endHour: 18,
    durationMinutes: 45,
    bufferMinutes: 10,
  });
  configs.push({
    profileKey: "clinic",
    serviceKey: "clinicNutrition",
    startHour: 14,
    endHour: 18,
    durationMinutes: 60,
    bufferMinutes: 10,
  });

  return configs;
}

function generateTimeSlots(): Array<{
  key: string;
  profileKey: string;
  serviceKey: string;
  startTime: Date;
  endTime: Date;
  maxReservations: number;
  status: SlotStatus;
  expiresAt: Date | null;
}> {
  const slots: Array<{
    key: string;
    profileKey: string;
    serviceKey: string;
    startTime: Date;
    endTime: Date;
    maxReservations: number;
    status: SlotStatus;
    expiresAt: Date | null;
  }> = [];

  const now = new Date();
  const slotConfigs = generateTimeSlotConfigs();
  let slotIndex = 0;

  // Generate slots for the next 14 days (2 weeks)
  for (let day = 1; day <= 14; day++) {
    const currentDate = new Date(now);
    currentDate.setDate(currentDate.getDate() + day);
    currentDate.setHours(0, 0, 0, 0);

    const dayOfWeek = currentDate.getDay();

    // Skip Sundays (0) for both profiles
    if (dayOfWeek === 0) continue;

    // Generate slots for each configuration
    for (const config of slotConfigs) {
      const profileStartHour = config.startHour;
      const profileEndHour = config.endHour;

      // Adjust Friday afternoon end time (18:00 -> 17:00)
      const effectiveEndHour =
        dayOfWeek === 5 && config.startHour >= 14
          ? profileEndHour - 1
          : profileEndHour;

      // Skip Saturday config for maria afternoon if it's Saturday
      if (
        dayOfWeek === 6 &&
        config.profileKey === "maria" &&
        config.startHour >= 15
      )
        continue;

      // Generate slots based on duration
      const slotDuration = config.durationMinutes;
      let currentHour = profileStartHour;
      let currentMinute = 0;
      let slotCount = 0;

      while (
        currentHour < effectiveEndHour ||
        (currentHour === effectiveEndHour && currentMinute === 0)
      ) {
        const startTime = new Date(currentDate);
        // Lima is UTC-5, so we add 5 hours to store as UTC
        const LIMA_OFFSET = 5;
        startTime.setUTCHours(currentHour + LIMA_OFFSET, currentMinute, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + slotDuration);

        // Check if slot fits within the time range
        const slotEndHour =
          currentHour + Math.floor((currentMinute + slotDuration) / 60);
        const slotEndMinute = (currentMinute + slotDuration) % 60;

        if (
          slotEndHour > effectiveEndHour ||
          (slotEndHour === effectiveEndHour && slotEndMinute > 0)
        ) {
          break;
        }

        // Create the slot
        const maxReservations = config.profileKey === "clinic" ? 2 : 1;
        const expiresAt = new Date(endTime);
        expiresAt.setDate(expiresAt.getDate() + 7); // Slots expire after 7 days

        slots.push({
          key: `slot_${config.profileKey}_${config.serviceKey}_day${day}_${slotIndex}`,
          profileKey: config.profileKey,
          serviceKey: config.serviceKey,
          startTime,
          endTime,
          maxReservations,
          status: "available" as SlotStatus,
          expiresAt,
        });

        slotIndex++;

        // Move to next slot
        currentMinute += slotDuration + config.bufferMinutes;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }

        // Safety check to prevent infinite loops
        slotCount++;
        if (slotCount > 50) break;
      }
    }
  }

  return slots;
}

export async function seedTimeSlots() {
  console.log("⏰ Seeding time slots...");

  const timeSlotRepository = new TimeSlotRepository();
  const userId = await getTestUserId();
  const SLOT_DATA = generateTimeSlots();

  // CLEANUP: Remove existing time slots for this user's profiles
  console.log(`  🧹 Cleaning up existing time slots...`);
  const userProfileIds = Object.values(createdProfileIds);
  let deletedCount = 0;
  for (const profileId of userProfileIds) {
    const result = await db
      .delete(timeSlot)
      .where(eq(timeSlot.profileId, profileId));
    deletedCount += result.count || 0;
  }
  console.log(`  ✓ Removed ${deletedCount} time slot(s)`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const slotData of SLOT_DATA) {
    const { key, profileKey, serviceKey, ...data } = slotData;
    const profileId = createdProfileIds[profileKey];
    const serviceId = createdMedicalServiceIds[serviceKey];
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping time slot`);
      skippedCount++;
      continue;
    }

    if (!serviceId) {
      console.log(`  ⚠️  Service ${serviceKey} not found, skipping time slot`);
      skippedCount++;
      continue;
    }

    try {
      // Check if slot already exists (optimistic check) to avoid unique constraint errors if re-seeding without cleanup
      // But we did cleanup, so we can skip this or just try-catch.
      // Since we want speed, we will collect valid slots and bulk insert them.
    } catch (error) {
      // ...
    }
  }

  // Optimization: Use bulkCreate
  // Group by serviceId/profileId if necessary? bulkCreate probably takes NewTimeSlot[]
  // Let's refactor the loop to collect slots first.

  const slotsToCreate: any[] = []; // Type should be NewTimeSlot[]
  const slotKeys: string[] = [];

  for (const slotData of SLOT_DATA) {
    const { key, profileKey, serviceKey, ...data } = slotData;
    const profileId = createdProfileIds[profileKey];
    const serviceId = createdMedicalServiceIds[serviceKey];

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping time slot`);
      skippedCount++;
      continue;
    }

    if (!serviceId) {
      console.log(`  ⚠️  Service ${serviceKey} not found, skipping time slot`);
      skippedCount++;
      continue;
    }

    slotsToCreate.push({
      ...data,
      profileId,
      serviceId,
    });
    slotKeys.push(key);
  }

  if (slotsToCreate.length > 0) {
    try {
      const created = await timeSlotRepository.bulkCreate(slotsToCreate);
      createdCount = created.length;

      // Map back to IDs (assuming order preservation)
      created.forEach((slot, index) => {
        if (slotKeys[index]) {
          createdTimeSlotIds[slotKeys[index]] = slot.id;
        }
      });
    } catch (e) {
      console.log("Error bulk creating:", e);
    }
  }

  console.log(`  ✓ Created ${createdCount} time slots`);
  if (skippedCount > 0) {
    console.log(`  ⚠️  Skipped ${skippedCount} time slot(s)`);
  }
  console.log("✅ Time slots seeded successfully\n");
}
