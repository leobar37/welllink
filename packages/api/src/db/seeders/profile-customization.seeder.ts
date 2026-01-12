import { db } from "../index";
import { profileCustomization } from "../schema/profile-customization";
import { eq } from "drizzle-orm";
import { createdProfileIds } from "./profiles.seeder";

export async function seedProfileCustomizations() {
  console.log("🎨 Seeding profile customizations...");

  const customizations = [
    {
      profileId: createdProfileIds.maria,
      themeId: "wellness",
      primaryColor: "#10B981", // Green
      backgroundColor: "#F0FDF4",
      textColor: "#064E3B",
      fontFamily: "Inter",
      buttonStyle: "rounded",
    },
  ];

  for (const customData of customizations) {
    if (!customData.profileId) {
      console.log(`  ⚠️  Profile ID not found, skipping customization`);
      continue;
    }

    // Check if customization already exists (idempotent)
    const existingCustom = await db.query.profileCustomization.findFirst({
      where: eq(profileCustomization.profileId, customData.profileId),
    });

    if (existingCustom) {
      console.log(`  ✓ Customization for profile already exists, skipping`);
      continue;
    }

    await db.insert(profileCustomization).values(customData);
    console.log(`  ✓ Created customization: ${customData.themeId} theme`);
  }

  console.log("✅ Profile customizations seeded successfully\n");
}
