import { db } from "../index";
import { user, account } from "../schema/auth";
import { eq } from "drizzle-orm";

// Password: 182@Alfk3458
// Hash generado con Better Auth (salt:key format)
const HASHED_PASSWORD =
  "f3c50bd126595e577d994da357313316:566a38055e0e4298bc430c94f84b1b31f71e039db23c932a19e12ae8ada486528d3e0ee53f750937ca167c0c46eaa4f9f0f0ee1d6ad28d7a508dc623e4fea18a";

export const SEED_USERS = [
  {
    id: "user_maria_rodriguez",
    name: "María Rodríguez",
    email: "maria.rodriguez@example.com",
    emailVerified: true,
    image:
      "https://ui-avatars.com/api/?name=Maria+Rodriguez&background=4F46E5&color=fff",
  },
  {
    id: "user_carlos_mendoza",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@example.com",
    emailVerified: true,
    image:
      "https://ui-avatars.com/api/?name=Carlos+Mendoza&background=10B981&color=fff",
  },
  {
    id: "user_ana_silva",
    name: "Ana Silva",
    email: "ana.silva@example.com",
    emailVerified: true,
    image:
      "https://ui-avatars.com/api/?name=Ana+Silva&background=F59E0B&color=fff",
  },
];

export async function seedUsers() {
  console.log("📝 Seeding users...");

  for (const userData of SEED_USERS) {
    // Check if user already exists (idempotent)
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, userData.email),
    });

    if (existingUser) {
      console.log(`  ✓ User ${userData.email} already exists, skipping`);
      continue;
    }

    // Insert user
    await db.insert(user).values(userData);

    // Create account with password
    await db.insert(account).values({
      id: `account_${userData.id}`,
      accountId: userData.email,
      providerId: "credential",
      userId: userData.id,
      password: HASHED_PASSWORD,
    });

    console.log(`  ✓ Created user: ${userData.email}`);
  }

  console.log("✅ Users seeded successfully\n");
}
