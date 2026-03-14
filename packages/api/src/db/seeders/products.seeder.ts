import { db } from "../../db/index";
import { product } from "../../db/schema/product";
import { createdProfileIds } from "./profiles.seeder";
import { createdSupplierIds } from "./suppliers.seeder";
import { createdCategoryIds } from "./product-categories.seeder";

export const createdProductIds: Record<string, string> = {};

const DEFAULT_PRODUCTS = [
  {
    sku: "GLOV-001",
    name: "Guantes de látex descartables (caja x100)",
    description: "Guantes de látex sin polvo, talla M",
    price: "25.00",
    cost: "15.00",
    unit: "box" as const,
    minStock: 10,
    barcode: "7891234567890",
    hasExpiration: false,
    brand: "MedicalPro",
    notes: "Presentacion: caja con 100 unidades",
    isActive: true,
  },
  {
    sku: "JAB-001",
    name: "Jabón líquido antibacterial 500ml",
    description: "Jabón líquido para manos con acción antibacterial",
    price: "12.00",
    cost: "7.50",
    unit: "bottle" as const,
    minStock: 20,
    barcode: "7891234567891",
    hasExpiration: true,
    expirationDays: 365,
    brand: "CleanHands",
    notes: "Para dispensador de pared",
    isActive: true,
  },
  {
    sku: "MASK-001",
    name: "Mascarillas quirúrgicas (caja x50)",
    description: "Mascarillas de 3 capas con elástico",
    price: "18.00",
    cost: "10.00",
    unit: "box" as const,
    minStock: 15,
    barcode: "7891234567892",
    hasExpiration: true,
    expirationDays: 730,
    brand: "SafeMask",
    isActive: true,
  },
  {
    sku: "GEL-001",
    name: "Gel antibacterial 500ml",
    description: "Gel antibacterial para manos con aloe vera",
    price: "15.00",
    cost: "9.00",
    unit: "bottle" as const,
    minStock: 25,
    barcode: "7891234567893",
    hasExpiration: true,
    expirationDays: 365,
    brand: "CleanHands",
    isActive: true,
  },
  {
    sku: "ALG-001",
    name: "Algodón absorbente (500g)",
    description: "Algodón absorbeente de alta calidad",
    price: "8.00",
    cost: "5.00",
    unit: "piece" as const,
    minStock: 30,
    barcode: "7891234567894",
    hasExpiration: false,
    brand: "MediCot",
    isActive: true,
  },
  {
    sku: "GAST-001",
    name: "Gasas estériles (paquete x10)",
    description: "Gasas de gasa estéril 10x10cm",
    price: "6.00",
    cost: "3.50",
    unit: "pack" as const,
    minStock: 50,
    barcode: "7891234567895",
    hasExpiration: true,
    expirationDays: 1095,
    brand: "SterilePack",
    isActive: true,
  },
  {
    sku: "VEND-001",
    name: "Venda elástica (10cm x 4m)",
    description: "Venda elástica de color beige",
    price: "4.00",
    cost: "2.50",
    unit: "piece" as const,
    minStock: 40,
    barcode: "7891234567896",
    hasExpiration: false,
    brand: "FlexWrap",
    isActive: true,
  },
  {
    sku: "TERM-001",
    name: "Termómetro digital",
    description: "Termómetro digital rápido con display LCD",
    price: "25.00",
    cost: "15.00",
    unit: "piece" as const,
    minStock: 5,
    barcode: "7891234567897",
    hasExpiration: false,
    brand: "ThermoMed",
    isActive: true,
  },
];

export async function seedProducts() {
  console.log("📦 Seeding products...");

  const profileKeys = ["maria", "clinic"];

  for (const profileKey of profileKeys) {
    const profileId = createdProfileIds[profileKey];
    const supplierId = createdSupplierIds[profileKey];
    const categoryId = createdCategoryIds[profileKey];

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping products`);
      continue;
    }

    // Check if products already exist using direct query
    const { eq } = await import("drizzle-orm");
    const existing = await db.select().from(product).where((p) => eq(p.profileId, profileId)).limit(1);

    if (existing.length > 0) {
      console.log(`  ✓ Products already exist for profile ${profileKey}, skipping`);
      createdProductIds[profileKey] = existing[0].id;
      continue;
    }

    // Insert products directly
    for (const productData of DEFAULT_PRODUCTS) {
      const [created] = await db.insert(product).values({
        ...productData,
        profileId,
        supplierId: supplierId || undefined,
        categoryId: categoryId || undefined,
      }).returning();

      if (!createdProductIds[profileKey]) {
        createdProductIds[profileKey] = created.id;
      }
    }

    console.log(`  ✓ Created ${DEFAULT_PRODUCTS.length} products for profile ${profileKey}`);
  }

  console.log("✅ Products seeded successfully\n");
}
