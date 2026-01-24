import { auth } from "../../lib/auth";
import { db } from "../index";
import { user, account, session } from "../schema/auth";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "test@wellness.com";
const TEST_PASSWORD = "test123456";
const TEST_NAME = "María Test";

const CLINIC_EMAIL = "clinic@wellness.com";
const CLINIC_PASSWORD = "test123456";
const CLINIC_NAME = "Clínica Bienestar";

export async function createOrReplaceTestUser() {
  console.log("👤 Creating/replacing test user via Better Auth...");

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, TEST_EMAIL),
  });

  if (existingUser) {
    console.log(
      `  ℹ️  User ${TEST_EMAIL} already exists, deleting and recreating...`,
    );
    await db.delete(session).where(eq(session.userId, existingUser.id));
    await db.delete(account).where(eq(account.userId, existingUser.id));
    await db.delete(user).where(eq(user.id, existingUser.id));
    console.log("  ✓ Deleted existing user");
  }

  const result = await auth.api.signUpEmail({
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME,
    },
  });

  if (result.user) {
    console.log("  ✓ User created via Better Auth");
    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.email, TEST_EMAIL));
    console.log("  ✓ Email verified");

    const createdUser = await db.query.user.findFirst({
      where: eq(user.email, TEST_EMAIL),
    });

    return createdUser;
  }

  throw new Error("Failed to create test user");
}

export async function getTestUserId(): Promise<string> {
  const testUser = await db.query.user.findFirst({
    where: eq(user.email, TEST_EMAIL),
  });

  if (!testUser) {
    throw new Error("Test user not found");
  }

  return testUser.id;
}

export async function createClinicUser() {
  console.log("🏥 Creating/replacing clinic user via Better Auth...");

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, CLINIC_EMAIL),
  });

  if (existingUser) {
    console.log(
      `  ℹ️  User ${CLINIC_EMAIL} already exists, deleting and recreating...`,
    );
    await db.delete(session).where(eq(session.userId, existingUser.id));
    await db.delete(account).where(eq(account.userId, existingUser.id));
    await db.delete(user).where(eq(user.id, existingUser.id));
    console.log("  ✓ Deleted existing clinic user");
  }

  const result = await auth.api.signUpEmail({
    body: {
      email: CLINIC_EMAIL,
      password: CLINIC_PASSWORD,
      name: CLINIC_NAME,
    },
  });

  if (result.user) {
    console.log("  ✓ Clinic user created via Better Auth");
    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.email, CLINIC_EMAIL));
    console.log("  ✓ Email verified");

    const createdUser = await db.query.user.findFirst({
      where: eq(user.email, CLINIC_EMAIL),
    });

    return createdUser;
  }

  throw new Error("Failed to create clinic user");
}

export async function getClinicUserId(): Promise<string> {
  const clinicUser = await db.query.user.findFirst({
    where: eq(user.email, CLINIC_EMAIL),
  });

  if (!clinicUser) {
    throw new Error("Clinic user not found");
  }

  return clinicUser.id;
}
