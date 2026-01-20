import { createSeederContext } from "./helpers";
import { createdProfileIds } from "./profiles.seeder";
import { getTestUserId } from "./users.seeder";
import { eq, and } from "drizzle-orm";
import { availabilityRule } from "../schema/availability-rule";
import { db } from "../index";

export const createdAvailabilityRuleIds: Record<string, string> = {};

const AVAILABILITY_RULE_DATA = [
  {
    key: "monday_morning",
    profileKey: "maria",
    dayOfWeek: 1, // Monday
    startTime: "09:00:00",
    endTime: "12:00:00",
    isActive: true,
  },
  {
    key: "monday_afternoon",
    profileKey: "maria",
    dayOfWeek: 1, // Monday
    startTime: "15:00:00",
    endTime: "18:00:00",
    isActive: true,
  },
  {
    key: "tuesday_morning",
    profileKey: "maria",
    dayOfWeek: 2, // Tuesday
    startTime: "09:00:00",
    endTime: "12:00:00",
    isActive: true,
  },
  {
    key: "tuesday_afternoon",
    profileKey: "maria",
    dayOfWeek: 2, // Tuesday
    startTime: "15:00:00",
    endTime: "18:00:00",
    isActive: true,
  },
  {
    key: "wednesday_morning",
    profileKey: "maria",
    dayOfWeek: 3, // Wednesday
    startTime: "09:00:00",
    endTime: "12:00:00",
    isActive: true,
  },
  {
    key: "wednesday_afternoon",
    profileKey: "maria",
    dayOfWeek: 3, // Wednesday
    startTime: "15:00:00",
    endTime: "18:00:00",
    isActive: true,
  },
  {
    key: "thursday_morning",
    profileKey: "maria",
    dayOfWeek: 4, // Thursday
    startTime: "09:00:00",
    endTime: "12:00:00",
    isActive: true,
  },
  {
    key: "thursday_afternoon",
    profileKey: "maria",
    dayOfWeek: 4, // Thursday
    startTime: "15:00:00",
    endTime: "18:00:00",
    isActive: true,
  },
  {
    key: "friday_morning",
    profileKey: "maria",
    dayOfWeek: 5, // Friday
    startTime: "09:00:00",
    endTime: "12:00:00",
    isActive: true,
  },
  {
    key: "friday_afternoon",
    profileKey: "maria",
    dayOfWeek: 5, // Friday
    startTime: "15:00:00",
    endTime: "17:00:00",
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
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping availability rule`);
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
      console.log(`  ✓ Availability rule for day ${data.dayOfWeek} (${data.startTime}) already exists, skipping`);
      createdAvailabilityRuleIds[key] = existingRule.id;
      continue;
    }

    // Insert directly to match the existing table structure
    const [created] = await db.insert(availabilityRule).values({
      profileId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      isActive: data.isActive,
      createdAt: new Date(),
    }).returning();

    createdAvailabilityRuleIds[key] = created.id;
    const dayName = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][data.dayOfWeek];
    console.log(
      `  ✓ Created availability rule: ${dayName} ${data.startTime}-${data.endTime} - ID: ${created.id}`,
    );
  }

  console.log("✅ Availability rules seeded successfully\n");
}
