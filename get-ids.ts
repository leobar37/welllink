import { db } from "./packages/api/src/db";
import { profile, medicalService } from "./packages/api/src/db/schema";

async function main() {
  const p = await db.select().from(profile).limit(1);
  const s = await db.select().from(medicalService).limit(1);

  console.log("Profile ID:", p[0]?.id);
  console.log("Service ID:", s[0]?.id);
  process.exit(0);
}

main();
