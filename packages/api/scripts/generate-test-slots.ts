import { db } from "../src/db/index";
import { timeSlot } from "../src/db/schema/time-slot";

// IDs from database
const PROFILE_ID = "7557a5ca-4f02-474c-a84b-8a2d4f650c58";
const SERVICE_ID = "67dbcfe6-49d7-4d39-8ddc-cdc68b88d633";

// Generate slots for next 3 Mondays
async function generateTestSlots() {
  console.log("Generating test slots for upcoming Mondays...\n");

  const today = new Date();
  const slots = [];

  // Find next 3 Mondays
  let mondaysFound = 0;
  let currentDate = new Date(today);
  currentDate.setHours(0, 0, 0, 0);

  while (mondaysFound < 3) {
    currentDate.setDate(currentDate.getDate() + 1);

    // Monday is day 1
    if (currentDate.getDay() === 1) {
      mondaysFound++;

      const dateStr = currentDate.toISOString().split('T')[0];
      console.log(`\n📅 Creating slots for Monday: ${dateStr}`);

      // Generate slots from 9:00 to 17:00 (every 30 minutes)
      for (let hour = 9; hour < 17; hour++) {
        for (let min of [0, 30]) {
          const startTime = new Date(currentDate);
          startTime.setHours(hour, min, 0, 0);

          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + 30);

          const slot = {
            id: crypto.randomUUID(),
            profileId: PROFILE_ID,
            serviceId: SERVICE_ID,
            startTime: new Date(startTime.getTime()),
            endTime: new Date(endTime.getTime()),
            maxReservations: 1,
            currentReservations: 0,
            status: "available" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          slots.push(slot);
          console.log(`  ✓ ${startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`);
        }
      }
    }
  }

  // Insert slots into database
  console.log(`\n💾 Inserting ${slots.length} slots into database...`);

  try {
    await db.insert(timeSlot).values(slots);
    console.log(`\n✅ Successfully created ${slots.length} slots!\n`);
    console.log("You can now test the booking flow at:");
    console.log("http://localhost:5179/drtestuser517/booking");
  } catch (error) {
    console.error("\n❌ Error creating slots:", error);
  }
}

generateTestSlots();
