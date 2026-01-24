import { createSeederContext } from "./helpers";
import { ClientRepository } from "../../services/repository/client";
import { createdProfileIds } from "./profiles.seeder";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
import { client } from "../schema/client";
import { ClientLabel } from "../schema/client";
import { db } from "../index";

export const createdClientIds: Record<string, string> = {};

const CLIENT_DATA = [
  // María García - Perfil Individual
  {
    key: "client_laura",
    profileKey: "maria",
    name: "Laura Gómez",
    phone: "+51912345678",
    email: "laura.gomez@example.com",
    label: ClientLabel.PROSPECTO,
    notes: "Interesada en plan de bienestar. Completó encuesta de salud.",
    lastContactAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    key: "client_roberto",
    profileKey: "maria",
    name: "Roberto Pérez",
    phone: "+51923456789",
    email: "roberto.p@example.com",
    label: ClientLabel.AFILIADO,
    notes:
      "Cliente activo desde hace 3 meses. Ha perdido 8kg. Muy comprometido.",
    lastContactAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    key: "client_sofia",
    profileKey: "maria",
    name: "Sofía Ramírez",
    phone: "+51934567890",
    email: null,
    label: ClientLabel.CONSUMIDOR,
    notes: "Viene de Instagram. Ha mostrado interés en talleres grupales.",
    lastContactAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    key: "client_diego",
    profileKey: "maria",
    name: "Diego Torres",
    phone: "+51945678901",
    email: "diego.t@example.com",
    label: ClientLabel.PROSPECTO,
    notes:
      "Recomendado por amigo actual. No se presentó a primera cita. Requiere seguimiento.",
    lastContactAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    key: "client_patricia",
    profileKey: "maria",
    name: "Patricia Vega",
    phone: "+51956789012",
    email: "patricia.vega@example.com",
    label: ClientLabel.AFILIADO,
    notes:
      "Cliente desde 2 meses. En programa de bienestar integral. Excelentes resultados.",
    lastContactAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  // Clínica Bienestar - Perfil Organizacional
  {
    key: "clinic_client_1",
    profileKey: "clinic",
    name: "Carlos Mendoza",
    phone: "+51911112222",
    email: "carlos.m@email.com",
    label: ClientLabel.AFILIADO,
    notes: "Paciente crónico. Control mensual de diabetes.",
    lastContactAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    key: "clinic_client_2",
    profileKey: "clinic",
    name: "Ana Lucía Torres",
    phone: "+51922223333",
    email: "ana.torres@email.com",
    label: ClientLabel.PROSPECTO,
    notes:
      "Interesada en programa de pérdida de peso. Primera consulta programada.",
    lastContactAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    key: "clinic_client_3",
    profileKey: "clinic",
    name: "Miguel Rodríguez",
    phone: "+51933334444",
    email: null,
    label: ClientLabel.CONSUMIDOR,
    notes: "Llegó por referencia de Facebook. Solo quiere consulta inicial.",
    lastContactAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    key: "clinic_client_4",
    profileKey: "clinic",
    name: "Fernanda López",
    phone: "+51944445555",
    email: "fernanda.l@email.com",
    label: ClientLabel.AFILIADO,
    notes: "Paciente pediatrico. Trae a su hijo cada 3 meses.",
    lastContactAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    key: "clinic_client_5",
    profileKey: "clinic",
    name: "Pedro Salinas",
    phone: "+51955556666",
    email: "pedro.s@email.com",
    label: ClientLabel.PROSPECTO,
    notes: "Empresa aliado. Quiere paquetes para sus empleados.",
    lastContactAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
];

export async function seedClients() {
  console.log("👥 Seeding clients...");

  const clientRepository = new ClientRepository();
  const userId = await getTestUserId();

  // CLEANUP: Remove existing clients for this user's profiles to avoid duplicates
  console.log(`  🧹 Cleaning up existing clients...`);
  const userProfileIds = Object.values(createdProfileIds);
  let deletedCount = 0;
  for (const profileId of userProfileIds) {
    const result = await db
      .delete(client)
      .where(eq(client.profileId, profileId));
    deletedCount += result.count || 0;
  }
  console.log(`  ✓ Removed ${deletedCount} client(s)`);

  for (const clientData of CLIENT_DATA) {
    const { key, profileKey, ...data } = clientData;
    const profileId = createdProfileIds[profileKey];
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping client`);
      continue;
    }

    const created = await clientRepository.create({
      ...data,
      profileId,
    });

    createdClientIds[key] = created.id;
    console.log(
      `  ✓ Created client: ${data.name} (${data.label}) - ID: ${created.id}`,
    );
  }

  console.log("✅ Clients seeded successfully\n");
}
