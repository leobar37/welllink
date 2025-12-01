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
    {
      profileId: createdProfileIds.carlos,
      themeId: "fitness",
      primaryColor: "#F59E0B", // Orange/Amber
      backgroundColor: "#FEF3C7",
      textColor: "#78350F",
      fontFamily: "Poppins",
      buttonStyle: "rounded",
    },
    // Ana no tiene customization aún (onboarding incompleto)
  ];

  for (const customData of customizations) {
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
