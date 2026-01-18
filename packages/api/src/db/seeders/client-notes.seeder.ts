import { createSeederContext } from "./helpers";
import { ClientNoteRepository } from "../../services/repository/client-note";
import { createdProfileIds } from "./profiles.seeder";
import { createdClientIds } from "./clients.seeder";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
import { clientNote } from "../schema/client-note";
import { db } from "../index";

export const createdClientNoteIds: Record<string, string> = {};

const CLIENT_NOTE_DATA = [
  // Notas para Laura Gómez
  {
    key: "note_laura_1",
    profileKey: "maria",
    clientKey: "client_laura",
    content:
      "Primera consulta completada. Laura mostró mucho interés en el plan de bienestar. Motivación alta. Appointments con Laura el próximo lunes para revisión de análisis de sangre. Ella prometió llevar registro de consumo de agua durante la semana.",
    noteType: "consulta" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    key: "note_laura_2",
    profileKey: "maria",
    clientKey: "client_laura",
    content:
      "Seguimiento telefónico de 15 minutos. Laura ha estado siguiendo las recomendaciones de hidratación (1.5L/día). Reporta menoshinchazón. Se siente con más energía. Se discutieron estrategias para manejar ansiedad laboral mediante respiración profunda.",
    noteType: "seguimiento" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    key: "note_laura_3",
    profileKey: "maria",
    clientKey: "client_laura",
    content:
      "Laura trajo su registro de alimentos. Buenas mejoras en el consumo de vegetales. Sugerí aumentar proteína en el desayuno para controlar apetito. Próxima cita en 2 semanas.",
    noteType: "consulta" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  // Notas para Roberto Pérez
  {
    key: "note_roberto_1",
    profileKey: "maria",
    clientKey: "client_roberto",
    content:
      "Roberto completó su primera consulta. Paciente receptivo pero escéptico sobre cambios en dieta. Coordinar con su médico para manejo de presión arterial. Recomendar ejercicio suave (caminata) hasta tener luz verde médico.",
    noteType: "consulta" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    key: "note_roberto_2",
    profileKey: "maria",
    clientKey: "client_roberto",
    content:
      "Roberto trajó resultados de análisis. Colesterol elevado (LDL 160). Hierro normal. Discutimosplan DASH. Él está motivado después de ver resultados. Comenzó a caminar 20 min/día.",
    noteType: "seguimiento" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    key: "note_roberto_3",
    profileKey: "maria",
    clientKey: "client_roberto",
    content:
      "Excelente progreso. Roberto ha perdido 2.5 kg en 3 semanas. Presión arterial estabilizada (138/88 vs 150/95 inicial). Redujo consumo de sal significativamente. Aumentar frecuencia de ejercicio a 4 veces por semana.",
    noteType: "consulta" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  // Notas para Sofía Ramírez
  {
    key: "note_sofia_1",
    profileKey: "maria",
    clientKey: "client_sofia",
    content:
      "SofíaCanceló su cita programada por segunda vez. Contactar para reagendar. Dejar mensaje amigable preguntando si necesita ajustar el horario o si hay algo que pueda hacer para facilitar su asistencia.",
    noteType: "recordatorio" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    key: "note_sofia_2",
    profileKey: "maria",
    clientKey: "client_sofia",
    content:
      "Sofía respondió al mensaje. Tiene conflictos de horario con su trabajo. Ofrecer horarios alternativos (sábados o tarde/noche). Ella prefiere mantener el mismo día pero más temprano (9 AM). Agendar para próxima semana.",
    noteType: "seguimiento" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  // Notas para Diego Torres
  {
    key: "note_diego_1",
    profileKey: "maria",
    clientKey: "client_diego",
    content:
      "Diego no se presentó a su cita (no-show). Contactar para reagendar. Verificar si necesita recordatorio 24h antes. Puede estar intimidado por el proceso. Ser empático en el primer contacto.",
    noteType: "recordatorio" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    key: "note_diego_2",
    profileKey: "maria",
    clientKey: "client_diego",
    content:
      "Diego reagendó para próximo martes. Ofrecí enviarle información por WhatsApp sobre qué esperar de la consulta inicial. Esto puede ayudar a reducir su ansiedad. También sugerí que traiga a alguien de apoyo si lo desea.",
    noteType: "seguimiento" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  // Notas para Patricia Vega (nueva clienta)
  {
    key: "note_patricia_1",
    profileKey: "maria",
    clientKey: "client_patricia",
    content:
      "Patricia completó formulario de solicitud de cita. Interesada en pérdida de peso y mejor energía. Reporta problemas de sueño. PRIORIDAD: Programar llamada de screening antes de primera consulta para evaluar si hay condiciones que requieran atención médica primero.",
    noteType: "consulta" as const,
    isPrivate: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

export async function seedClientNotes() {
  console.log("📝 Seeding client notes...");

  const clientNoteRepository = new ClientNoteRepository();
  const userId = await getTestUserId();
  const mariaId = createdProfileIds.maria;

  for (const noteData of CLIENT_NOTE_DATA) {
    const { key, profileKey, clientKey, content, ...data } = noteData;
    const profileId = createdProfileIds[profileKey];
    const clientId = createdClientIds[clientKey];
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping note`);
      continue;
    }

    if (!clientId) {
      console.log(`  ⚠️  Client ${clientKey} not found, skipping note`);
      continue;
    }

    // Check if note already exists (by content)
    const existingNote = await db.query.clientNote.findFirst({
      where: eq(clientNote.note, content.slice(0, 50)),
    });

    if (existingNote) {
      console.log(`  ✓ Note for client ${clientKey} already exists, skipping`);
      createdClientNoteIds[key] = existingNote.id;
      continue;
    }

    const created = await clientNoteRepository.create({
      note: content,
      profileId,
      clientId,
    });

    createdClientNoteIds[key] = created.id;
    console.log(
      `  ✓ Created note for client: ${clientKey} (${data.noteType}) - ID: ${created.id}`,
    );
  }

  console.log("✅ Client notes seeded successfully\n");
}
