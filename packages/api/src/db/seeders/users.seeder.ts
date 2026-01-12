import { db } from "../index";
import { user, account } from "../schema/auth";
import { eq } from "drizzle-orm";

// Password: test123456
// Hash generado con Better Auth (scrypt format)
const HASHED_PASSWORD =
  "scrypt:82280affd25d56eccc3cd54908eca8b2:349e4435f4886221699a7f03f386eeee744e33bce3a932ad3182facfd31f32a4fd10b65f08141209c6758ccb5eba0fe9da1b4d3d23a61fb1a56e2fe7bcbbddf6";

export const SEED_USERS = [
  {
    id: "user_test_wellness",
    name: "María Test",
    email: "test@wellness.com",
    emailVerified: true,
    image:
      "https://ui-avatars.com/api/?name=Maria+Test&background=4F46E5&color=fff",
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
