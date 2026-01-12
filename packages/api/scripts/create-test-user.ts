import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index";
import * as schema from "../db/schema";

const auth = betterAuth({
  baseURL: "http://localhost:5300",
  secret: "development-secret-change-in-production",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      account: schema.account,
      session: schema.session,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});

async function signUpTestUser() {
  console.log("🔐 Creating test user with Better Auth...\n");

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: "test@wellness.com",
        password: "test123456",
        name: "María Test",
      },
    });

    if (result.user) {
      console.log("✅ User created successfully!");
      console.log(`   Email: ${result.user.email}`);
      console.log(`   ID: ${result.user.id}`);

      // Update emailVerified to true
      await db
        .update(schema.user)
        .set({ emailVerified: true })
        .where(eq(schema.user.email, "test@wellness.com"));
      console.log("\n✅ Email verified");
    }
  } catch (error: any) {
    if (error.message?.includes("User already exists")) {
      console.log("ℹ️  User already exists, updating password hash...");

      // Better Auth doesn't provide a simple way to update password hash
      // So we'll just delete and recreate
      console.log("⚠️  Please manually delete the user and re-run seed");
    } else {
      console.error("❌ Error:", error);
    }
  }
}

import { eq } from "drizzle-orm";
signUpTestUser();
