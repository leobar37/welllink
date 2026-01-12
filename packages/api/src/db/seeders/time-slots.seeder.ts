import { createSeederContext } from "./helpers";
import { TimeSlotRepository } from "../../services/repository/time-slot";
import { createdProfileIds } from "./profiles.seeder";
import { createdMedicalServiceIds } from "./medical-services.seeder";
import { SEED_USERS } from "./users.seeder";
import { eq, and } from "drizzle-orm";
import { timeSlot } from "../schema/time-slot";
import { SlotStatus } from "../schema/time-slot";
import { db } from "../index";

export const createdTimeSlotIds: Record<string, string> = {};

// Generate time slots for the next 7 days starting from tomorrow
function generateTimeSlots() {
  const slots = [];
  const now = new Date();
  let slotIndex = 0;

  // Start from tomorrow at 9 AM
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 0, 0, 0);

  // Generate slots for 7 days
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    // Morning slots: 9 AM, 10 AM, 11 AM
    for (let hour = 9; hour <= 11; hour++) {
      const startTime = new Date(currentDate);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(currentDate);
      endTime.setHours(hour + 1, 0, 0, 0);

      slots.push({
        key: `slot_morning_${day}_${hour}`,
        profileKey: "maria",
        serviceKey: "consultation",
        userIndex: 0,
        startTime,
        endTime,
        maxReservations: 1,
        status: "available" as SlotStatus,
        expiresAt: new Date(endTime.getTime() + 24 * 60 * 60 * 1000),
      });
    }

    // Afternoon slots: 3 PM, 4 PM, 5 PM
    for (let hour = 15; hour <= 17; hour++) {
      const startTime = new Date(currentDate);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(currentDate);
      endTime.setHours(hour + 1, 0, 0, 0);

      slots.push({
        key: `slot_afternoon_${day}_${hour}`,
        profileKey: "maria",
        serviceKey: "consultation",
        userIndex: 0,
        startTime,
        endTime,
        maxReservations: 1,
        status: "available" as SlotStatus,
        expiresAt: new Date(endTime.getTime() + 24 * 60 * 60 * 1000),
      });
    }
  }

  return slots;
}

export async function seedTimeSlots() {
  console.log("⏰ Seeding time slots...");

  const timeSlotRepository = new TimeSlotRepository();
  const SLOT_DATA = generateTimeSlots();

  for (const slotData of SLOT_DATA) {
    const { key, profileKey, serviceKey, userIndex, ...data } = slotData;
    const profileId = createdProfileIds[profileKey];
    const serviceId = createdMedicalServiceIds[serviceKey];
    const userId = SEED_USERS[userIndex].id;
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping time slot`,
      );
      continue;
    }

    if (!serviceId) {
      console.log(
        `  ⚠️  Service ${serviceKey} not found, skipping time slot`,
      );
      continue;
    }

    // Check if slot already exists at this time (idempotent)
    const existingSlot = await db.query.timeSlot.findFirst({
      where: and(
        eq(timeSlot.profileId, profileId),
        eq(timeSlot.serviceId, serviceId),
      ),
    });

    if (existingSlot) {
      createdTimeSlotIds[key] = existingSlot.id;
      continue;
    }

    // Use repository to create time slot (preserves business logic)
    const created = await timeSlotRepository.create({
      ...data,
      profileId,
      serviceId,
    });

    createdTimeSlotIds[key] = created.id;
  }

  const totalSlots = Object.keys(createdTimeSlotIds).length;
  console.log(`  ✓ Created ${totalSlots} time slots for the next 7 days`);
  console.log("✅ Time slots seeded successfully\n");
}
