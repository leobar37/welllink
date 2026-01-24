import { createSeederContext } from "./helpers";
import { createdProfileIds } from "./profiles.seeder";
import { getTestUserId } from "./users.seeder";
import { eq, and } from "drizzle-orm";
import { availabilityRule } from "../schema/availability-rule";
import { db } from "../index";

export const createdAvailabilityRuleIds: Record<string, string> = {};

const AVAILABILITY_RULE_DATA = [
  // María García - Consulta de Nutrición (Perfil individual)
  // Horario matutino: 9:00 - 12:00
  {
    key: "maria_monday_morning",
    profileKey: "maria",
    dayOfWeek: 1,
    startTime: "09:00:00",
    endTime: "12:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  {
    key: "maria_tuesday_morning",
    profileKey: "maria",
    dayOfWeek: 2,
    startTime: "09:00:00",
    endTime: "12:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  {
    key: "maria_wednesday_morning",
    profileKey: "maria",
    dayOfWeek: 3,
    startTime: "09:00:00",
    endTime: "12:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  {
    key: "maria_thursday_morning",
    profileKey: "maria",
    dayOfWeek: 4,
    startTime: "09:00:00",
    endTime: "12:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  {
    key: "maria_friday_morning",
    profileKey: "maria",
    dayOfWeek: 5,
    startTime: "09:00:00",
    endTime: "12:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  // Horario vespertino: 15:00 - 18:00 (Lunes-Jueves), 15:00 - 17:00 (Viernes)
  {
    key: "maria_monday_afternoon",
    profileKey: "maria",
    dayOfWeek: 1,
    startTime: "15:00:00",
    endTime: "18:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  {
    key: "maria_tuesday_afternoon",
    profileKey: "maria",
    dayOfWeek: 2,
    startTime: "15:00:00",
    endTime: "18:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  {
    key: "maria_wednesday_afternoon",
    profileKey: "maria",
    dayOfWeek: 3,
    startTime: "15:00:00",
    endTime: "18:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  {
    key: "maria_thursday_afternoon",
    profileKey: "maria",
    dayOfWeek: 4,
    startTime: "15:00:00",
    endTime: "18:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  {
    key: "maria_friday_afternoon",
    profileKey: "maria",
    dayOfWeek: 5,
    startTime: "15:00:00",
    endTime: "17:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  // Clínica Bienestar (Perfil organizacional)
  // Horario continuo: 8:00 - 18:00 con turnos de 30 min
  {
    key: "clinic_monday_morning",
    profileKey: "clinic",
    dayOfWeek: 1,
    startTime: "08:00:00",
    endTime: "14:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
  {
    key: "clinic_monday_afternoon",
    profileKey: "clinic",
    dayOfWeek: 1,
    startTime: "14:00:00",
    endTime: "18:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
  {
    key: "clinic_tuesday_morning",
    profileKey: "clinic",
    dayOfWeek: 2,
    startTime: "08:00:00",
    endTime: "14:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
  {
    key: "clinic_tuesday_afternoon",
    profileKey: "clinic",
    dayOfWeek: 2,
    startTime: "14:00:00",
    endTime: "18:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
  {
    key: "clinic_wednesday_morning",
    profileKey: "clinic",
    dayOfWeek: 3,
    startTime: "08:00:00",
    endTime: "14:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
  {
    key: "clinic_wednesday_afternoon",
    profileKey: "clinic",
    dayOfWeek: 3,
    startTime: "14:00:00",
    endTime: "18:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
  {
    key: "clinic_thursday_morning",
    profileKey: "clinic",
    dayOfWeek: 4,
    startTime: "08:00:00",
    endTime: "14:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
  {
    key: "clinic_thursday_afternoon",
    profileKey: "clinic",
    dayOfWeek: 4,
    startTime: "14:00:00",
    endTime: "18:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
  {
    key: "clinic_friday_morning",
    profileKey: "clinic",
    dayOfWeek: 5,
    startTime: "08:00:00",
    endTime: "14:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
  {
    key: "clinic_friday_afternoon",
    profileKey: "clinic",
    dayOfWeek: 5,
    startTime: "14:00:00",
    endTime: "17:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
  // Sábados para ambos perfiles (horario reducido)
  {
    key: "maria_saturday",
    profileKey: "maria",
    dayOfWeek: 6,
    startTime: "09:00:00",
    endTime: "13:00:00",
    slotDuration: 60,
    bufferTime: 0,
    maxAppointmentsPerSlot: 1,
    isActive: true,
  },
  {
    key: "clinic_saturday",
    profileKey: "clinic",
    dayOfWeek: 6,
    startTime: "09:00:00",
    endTime: "13:00:00",
    slotDuration: 30,
    bufferTime: 10,
    maxAppointmentsPerSlot: 2,
    isActive: true,
  },
];

export async function seedAvailabilityRules() {
  console.log("📅 Seeding availability rules...");

  const userId = await getTestUserId();

  for (const ruleData of AVAILABILITY_RULE_DATA) {
    const { key, profileKey, ...data } = ruleData;
    const profileId = createdProfileIds[profileKey];

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping availability rule`,
      );
      continue;
    }

    // Check if rule already exists for this profile and day
    const existingRule = await db.query.availabilityRule.findFirst({
      where: and(
        eq(availabilityRule.profileId, profileId),
        eq(availabilityRule.dayOfWeek, data.dayOfWeek),
        eq(availabilityRule.startTime, data.startTime),
      ),
    });

    if (existingRule) {
      console.log(
        `  ✓ Availability rule for day ${data.dayOfWeek} (${data.startTime}) already exists, skipping`,
      );
      createdAvailabilityRuleIds[key] = existingRule.id;
      continue;
    }

    // Insert directly to match the existing table structure
    const [created] = await db
      .insert(availabilityRule)
      .values({
        profileId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        slotDuration: data.slotDuration,
        bufferTime: data.bufferTime,
        maxAppointmentsPerSlot: data.maxAppointmentsPerSlot,
        isActive: data.isActive,
        createdAt: new Date(),
      })
      .returning();

    createdAvailabilityRuleIds[key] = created.id;
    const dayName = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][
      data.dayOfWeek
    ];
    console.log(
      `  ✓ Created availability rule: ${dayName} ${data.startTime}-${data.endTime} (${data.slotDuration}min) - ID: ${created.id}`,
    );
  }

  console.log("✅ Availability rules seeded successfully\n");
}
