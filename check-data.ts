import { db } from "./packages/api/src/db";
import { profile, medicalService } from "./packages/api/src/db/schema";

async function main() {
  const p = await db.select().from(profile).limit(1);
  const s = await db.select().from(medicalService).limit(1);

  if (p[0] && s[0]) {
    console.log(JSON.stringify({ profileId: p[0].id, serviceId: s[0].id }));
  } else {
    console.log("No data found");
  }
  process.exit(0);
}

main();
