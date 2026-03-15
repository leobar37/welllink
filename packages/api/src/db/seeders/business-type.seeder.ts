import { db } from "../index";
import { businessType } from "../schema/business-type";

/**
 * Seed business types - global configuration for industries
 */
export async function seedBusinessTypes() {
  console.log("🌱 Seeding business types...\n");

  const businessTypes = [
    {
      name: "Belleza",
      key: "beauty",
      description: "Salones de belleza, peluquerías, barberías, spas, salones de uñas",
      icon: "sparkles",
    },
    {
      name: "Salud",
      key: "health",
      description: "Clínicas, consultorios médicos, odontología, fisioterapia",
      icon: "heart-pulse",
    },
    {
      name: "Fitness",
      key: "fitness",
      description: "Gimnasios, estudios de yoga, crossfit, entrenamiento personal",
      icon: "dumbbell",
    },
    {
      name: "Profesional",
      key: "professional",
      description: "Consultorios legales, contables, asesoría, coaching",
      icon: "briefcase",
    },
    {
      name: "Técnico",
      key: "technical",
      description: "Talleres mecánicos, servicios técnicos, reparaciones",
      icon: "wrench",
    },
  ];

  for (const type of businessTypes) {
    // Check if already exists
    const existing = await db.query.businessType.findFirst({
      where: (bt, { eq }) => eq(bt.key, type.key),
    });

    if (existing) {
      console.log(`  ℹ️  Business type "${type.key}" already exists, skipping`);
      continue;
    }

    await db.insert(businessType).values({
      ...type,
      isActive: true,
    });

    console.log(`  ✅ Created business type: ${type.name} (${type.key})`);
  }

  console.log("\n✅ Business types seeded successfully\n");
}
