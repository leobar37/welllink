import { SupplierRepository } from "../../services/repository/supplier";
import { createdProfileIds } from "./profiles.seeder";
import type { NewSupplier } from "../../db/schema/supplier";

export const createdSupplierIds: Record<string, string> = {};

const DEFAULT_SUPPLIERS: Array<Omit<NewSupplier, "profileId">> = [
  {
    name: "Distribuidora Médica del Norte",
    contactPerson: "Carlos Rodríguez",
    phone: "+51 999 111 222",
    email: "carlos@distrimednorte.com",
    address: "Av. Industrial 1234, Lima",
    city: "Lima",
    country: "Perú",
    taxId: "20123456789",
    paymentTerms: "Net 30",
    notes: "Proveedor principal de insumos médicos",
    isActive: true,
  },
  {
    name: "Farmacéutica Latina S.A.C.",
    contactPerson: "María González",
    phone: "+51 999 333 444",
    email: "ventas@farmaclatina.com",
    address: "Calle Los Álamos 567, Lima",
    city: "Lima",
    country: "Perú",
    taxId: "20456789012",
    paymentTerms: "Net 45",
    notes: "Especializado en medicamentos y vacunas",
    isActive: true,
  },
  {
    name: "Dental Supply Perú",
    contactPerson: "Pedro Sánchez",
    phone: "+51 999 555 666",
    email: "pedro@dentalsupply.pe",
    address: "Av. Principal 890, Callao",
    city: "Callao",
    country: "Perú",
    taxId: "20678901234",
    paymentTerms: "Contado",
    notes: "Suministros dentales y de laboratorio",
    isActive: true,
  },
];

export async function seedSuppliers() {
  console.log("🏭 Seeding suppliers...");

  const supplierRepository = new SupplierRepository();
  const profileKeys = ["maria", "clinic"];

  for (const profileKey of profileKeys) {
    const profileId = createdProfileIds[profileKey];

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping suppliers`);
      continue;
    }

    // Check if suppliers already exist for this profile
    const existing = await supplierRepository.findByProfileIdDirect(profileId);

    if (existing.length > 0) {
      console.log(`  ✓ Suppliers already exist for profile ${profileKey}, skipping`);
      // Store existing supplier IDs
      if (!createdSupplierIds[profileKey] && existing[0]) {
        createdSupplierIds[profileKey] = existing[0].id;
      }
      continue;
    }

    for (const supplierData of DEFAULT_SUPPLIERS) {
      const created = await supplierRepository.create({
        ...supplierData,
        profileId,
      });

      // Store first supplier ID for each profile as primary
      if (!createdSupplierIds[profileKey]) {
        createdSupplierIds[profileKey] = created.id;
      }
    }

    console.log(`  ✓ Created ${DEFAULT_SUPPLIERS.length} suppliers for profile ${profileKey}`);
  }

  console.log("✅ Suppliers seeded successfully\n");
}
