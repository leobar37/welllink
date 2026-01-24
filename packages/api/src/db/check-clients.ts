import { db } from "./index";
import { sql } from "drizzle-orm";
import { client, profile } from "./schema";

async function main() {
  const clinicProfile = await db.query.profile.findFirst({
    where: sql`${profile.username} = 'clinic_bienestar'`,
  });

  if (clinicProfile) {
    const clients = await db.query.client.findMany({
      where: sql`${client.profileId} = ${clinicProfile.id}`,
      limit: 5,
    });

    console.log("Found", clients.length, "clients for clinic:");
    clients.forEach((c: any) =>
      console.log("  -", c.name, "(" + c.label + ")"),
    );
  }
}

main().catch(console.error);
