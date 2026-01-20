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

function generateTimeSlots() {
  const slots = [];
  const now = new Date();
  let slotIndex = 0;

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 0, 0, 0);

  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    for (let hour = 9; hour <= 11; hour++) {
      const startTime = new Date(currentDate);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(currentDate);
      endTime.setHours(hour + 1, 0, 0, 0);

      slots.push({
        key: `slot_morning_${day}_${hour}`,
        profileKey: "maria",
        serviceKey: "consultation",
        startTime,
        endTime,
        maxReservations: 1,
        status: "available" as SlotStatus,
        expiresAt: new Date(endTime.getTime() + 24 * 60 * 60 * 1000),
      });
    }

    for (let hour = 15; hour <= 17; hour++) {
      const startTime = new Date(currentDate);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(currentDate);
      endTime.setHours(hour + 1, 0, 0, 0);

      slots.push({
        key: `slot_afternoon_${day}_${hour}`,
        profileKey: "maria",
        serviceKey: "consultation",
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

  for (const slotData of SLOT_DATA) {
    const { key, profileKey, serviceKey, ...data } = slotData;
    const profileId = createdProfileIds[profileKey];
    const serviceId = createdMedicalServiceIds[serviceKey];
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping time slot`);
      continue;
    }

    if (!serviceId) {
      console.log(`  ⚠️  Service ${serviceKey} not found, skipping time slot`);
      continue;
    }

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
