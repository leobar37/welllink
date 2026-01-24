import { db } from "./index";
import { sql } from "drizzle-orm";
import { timeSlot, profile } from "./schema";

async function main() {
  // Get clinic profile ID
  const clinicProfile = await db.query.profile.findFirst({
    where: sql`${profile.username} = 'clinic_bienestar'`,
  });

  console.log("Clinic profile:", clinicProfile?.id);

  if (clinicProfile) {
    // Count slots for this profile
    const slots = await db.query.timeSlot.findMany({
      where: sql`${timeSlot.profileId} = ${clinicProfile.id}`,
      limit: 5,
      orderBy: sql`${timeSlot.startTime}`,
    });

    console.log(`Found ${slots.length} slots for clinic:`);
    slots.forEach((slot: any) => {
      console.log(`  - ${slot.startTime} (status: ${slot.status})`);
    });
  }
}

main().catch(console.error);
