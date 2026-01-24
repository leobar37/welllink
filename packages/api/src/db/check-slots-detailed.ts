import { db } from "./index";
import { sql } from "drizzle-orm";
import { timeSlot } from "./schema";

async function main() {
  const profileId = "48949bce-3873-4737-b50e-58f48625f147";

  // Get all slots for this profile
  const allSlots = await db.query.timeSlot.findMany({
    where: sql`${timeSlot.profileId} = ${profileId}`,
    limit: 10,
    orderBy: sql`${timeSlot.startTime}`,
  });

  console.log("Total slots found:", allSlots.length);
  console.log("\nFirst 5 slots:");
  allSlots.forEach((s: any) => {
    console.log(`  - ${s.id}: ${s.startTime} (status: ${s.status})`);
  });

  // Try finding with date filter (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const todaySlots = await db
    .select()
    .from(timeSlot)
    .where(
      sql`${timeSlot.profileId} = ${profileId} AND ${timeSlot.startTime} >= ${today} AND ${timeSlot.startTime} <= ${endOfDay}`,
    )
    .limit(5);

  console.log(`\nSlots for today (${today.toISOString()}):`, todaySlots.length);
  todaySlots.forEach((s: any) => {
    console.log(`  - ${s.id}: ${s.startTime}`);
  });
}

main().catch(console.error);
