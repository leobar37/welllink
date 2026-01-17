import { createOrReplaceTestUser, getTestUserId } from "./utils";

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

  const createdUser = await createOrReplaceTestUser();

  console.log("✅ Users seeded successfully\n");
}

export { getTestUserId };
