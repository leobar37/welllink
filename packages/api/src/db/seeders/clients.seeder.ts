import { createSeederContext } from "./helpers";
import { ClientRepository } from "../../services/repository/client";
import { createdProfileIds } from "./profiles.seeder";
import { SEED_USERS } from "./users.seeder";
import { eq } from "drizzle-orm";
import { client } from "../schema/client";
import { ClientLabel } from "../schema/client";
import { db } from "../index";

export const createdClientIds: Record<string, string> = {};

const CLIENT_DATA = [
  {
    key: "client_laura",
    profileKey: "maria",
    userIndex: 0,
    name: "Laura Gómez",
    phone: "+51912345678",
    email: "laura.gomez@example.com",
    label: ClientLabel.PROSPECTO,
    notes: "Interesada en plan de bienestar. Completó encuesta de salud.",
    lastContactAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    key: "client_roberto",
    profileKey: "maria",
    userIndex: 0,
    name: "Roberto Pérez",
    phone: "+51923456789",
    email: "roberto.p@example.com",
    label: ClientLabel.AFILIADO,
    notes: "Cliente activo desde hace 3 meses. Ha perdido 8kg. Muy comprometido.",
    lastContactAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    key: "client_sofia",
    profileKey: "maria",
    userIndex: 0,
    name: "Sofía Ramírez",
    phone: "+51934567890",
    email: null,
    label: ClientLabel.CONSUMIDOR,
    notes: "Viene de Instagram. Ha mostrado interés en talleres grupales.",
    lastContactAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    key: "client_diego",
    profileKey: "maria",
    userIndex: 0,
    name: "Diego Torres",
    phone: "+51945678901",
    email: "diego.t@example.com",
    label: ClientLabel.PROSPECTO,
    notes: "Recomendado por amigo actual. No se presentó a primera cita. Requiere seguimiento.",
    lastContactAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    key: "client_patricia",
    profileKey: "maria",
    userIndex: 0,
    name: "Patricia Vega",
    phone: "+51956789012",
    email: "patricia.vega@example.com",
    label: ClientLabel.AFILIADO,
    notes: "Cliente desde 2 meses. En programa de bienestar integral. Excelentes resultados.",
    lastContactAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
];

export async function seedClients() {
  console.log("👥 Seeding clients...");

  const clientRepository = new ClientRepository();

  for (const clientData of CLIENT_DATA) {
    const { key, profileKey, userIndex, ...data } = clientData;
    const profileId = createdProfileIds[profileKey];
    const userId = SEED_USERS[userIndex].id;
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping client`,
      );
      continue;
    }

    // Check if client already exists (idempotent)
    const existingClient = await db.query.client.findFirst({
      where: eq(client.phone, data.phone),
    });

    if (existingClient) {
      console.log(
        `  ✓ Client ${data.name} already exists, skipping`,
      );
      createdClientIds[key] = existingClient.id;
      continue;
    }

    // Use repository to create client (preserves business logic)
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
