import {
  createOrReplaceTestUser,
  createClinicUser,
  getTestUserId,
  getClinicUserId,
} from "./utils";

export const SEED_USERS = [
  {
    id: "user_test_wellness",
    name: "María Test",
    email: "test@wellness.com",
    emailVerified: true,
    image:
      "https://ui-avatars.com/api/?name=Maria+Test&background=4F46E5&color=fff",
  },
  {
    id: "user_test_clinic",
    name: "Clínica Bienestar",
    email: "clinic@wellness.com",
    emailVerified: true,
    image:
      "https://ui-avatars.com/api/?name=Clinica+Bienestar&background=10B981&color=fff",
  },
];

export async function seedUsers() {
  console.log("📝 Seeding users...");

  // Create/update test user (individual professional)
  await createOrReplaceTestUser();

  // Create/update clinic user
  await createClinicUser();

  console.log("✅ Users seeded successfully\n");
}

export { getTestUserId, getClinicUserId };
