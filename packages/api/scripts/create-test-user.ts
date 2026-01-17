import { createOrReplaceTestUser } from "../src/db/seeders/utils";

async function signUpTestUser() {
  console.log("🔐 Creating test user with Better Auth...\n");

  try {
    const user = await createOrReplaceTestUser();

    console.log("✅ User created successfully!");
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
  } catch (error: any) {
    console.error("❌ Error:", error);
  }
}

signUpTestUser();
