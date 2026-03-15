import { ProductCategoryRepository } from "../../services/repository/product-category";
import { createdProfileIds } from "./profiles.seeder";
import type { NewProductCategory } from "../../db/schema/product-category";

export const createdCategoryIds: Record<string, string> = {};

const DEFAULT_CATEGORIES: Array<Omit<NewProductCategory, "profileId">> = [
  {
    name: "Insumos Médicos",
    description: "Materiales médicos desechables y de consumo",
    color: "#3B82F6",
    icon: "medical",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Medicamentos",
    description: "Fármacos y productos farmacéuticos",
    color: "#EF4444",
    icon: "pill",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Materiales Dentales",
    description: "Suministros para procedimientos dentales",
    color: "#10B981",
    icon: "tooth",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Limpieza e Higiene",
    description: "Productos de limpieza y desinfección",
    color: "#8B5CF6",
    icon: "clean",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Equipo de Protección",
    description: "EPP y equipos de seguridad",
    color: "#F59E0B",
    icon: "shield",
    sortOrder: 5,
    isActive: true,
  },
];

export async function seedProductCategories() {
  console.log("📂 Seeding product categories...");

  const categoryRepository = new ProductCategoryRepository();
  const profileKeys = ["maria", "clinic"];

  for (const profileKey of profileKeys) {
    const profileId = createdProfileIds[profileKey];

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping categories`);
      continue;
    }

    const existing = await categoryRepository.findByProfileIdDirect(profileId);

    if (existing.length > 0) {
      console.log(`  ✓ Categories already exist for profile ${profileKey}, skipping`);
      // Store first category ID for each profile
      if (!createdCategoryIds[profileKey] && existing[0]) {
        createdCategoryIds[profileKey] = existing[0].id;
      }
      continue;
    }

    for (const categoryData of DEFAULT_CATEGORIES) {
      const created = await categoryRepository.create({
        ...categoryData,
        profileId,
      });

      // Store first category ID for each profile
      if (!createdCategoryIds[profileKey]) {
        createdCategoryIds[profileKey] = created.id;
      }
    }

    console.log(`  ✓ Created ${DEFAULT_CATEGORIES.length} categories for profile ${profileKey}`);
  }

  console.log("✅ Product categories seeded successfully\n");
}
