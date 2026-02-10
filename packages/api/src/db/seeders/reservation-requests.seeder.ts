import { createdProfileIds } from "./profiles.seeder";
import { createdMedicalServiceIds } from "./medical-services.seeder";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
import { db } from "../index";
import { reservationRequest } from "../schema/reservation-request";

export const createdReservationRequestIds: Record<string, string> = {};

const RESERVATION_REQUEST_DATA = [
  {
    key: "request_pending_1",
    profileKey: "maria",
    serviceKey: "consultation",
    preferredDate: "2026-02-15",
    preferredTime: "10:00",
    timezone: "America/Lima",
    patientName: "Patricia Vega",
    patientPhone: "+51956789012",
    patientEmail: "patricia.vega@example.com",
    patientAge: 28,
    patientGender: "femenino",
    chiefComplaint:
      "Quiero mejorar mi alimentación y perder peso de forma saludable",
    symptoms: "Cansancio frecuente, dificultad para dormir",
    medicalHistory: "Ninguna",
    currentMedications: "Ninguno",
    allergies: "Ninguna",
    urgencyLevel: "normal",
    preferredContactMethod: "whatsapp",
    status: "pending",
    metadata: {
      symptoms: ["Cansancio", "Insomnio"],
      urgencyLevel: "normal",
      isNewPatient: true,
      notes: "Primera vez que visita un nutricionista",
    },
  },
  {
    key: "request_pending_2",
    profileKey: "maria",
    serviceKey: "followUp",
    preferredDate: "2026-02-16",
    preferredTime: "14:00",
    timezone: "America/Lima",
    patientName: "Carlos Mendoza",
    patientPhone: "+51967890123",
    patientEmail: "carlos.m@example.com",
    patientAge: 42,
    patientGender: "masculino",
    chiefComplaint: "Seguimiento de plan nutricional",
    symptoms: "Ninguno",
    medicalHistory: "Diabetes tipo 2",
    currentMedications: "Metformina",
    allergies: "Penicilina",
    urgencyLevel: "low",
    preferredContactMethod: "phone",
    status: "pending",
    metadata: {
      urgencyLevel: "low",
      isNewPatient: false,
      insuranceProvider: "Essalud",
    },
  },
  {
    key: "request_approved_1",
    profileKey: "maria",
    serviceKey: "consultation",
    preferredDate: "2026-02-10",
    preferredTime: "09:00",
    timezone: "America/Lima",
    patientName: "Ana López",
    patientPhone: "+51978901234",
    patientEmail: "ana.lopez@example.com",
    patientAge: 35,
    patientGender: "femenino",
    chiefComplaint: "Consulta inicial para planificar alimentación",
    symptoms: "Hinchazón después de comer",
    medicalHistory: "Gastritis",
    currentMedications: "Omeprazol",
    allergies: "Mariscos",
    urgencyLevel: "high",
    preferredContactMethod: "whatsapp",
    status: "approved",
    metadata: {
      symptoms: ["Hinchazón abdominal"],
      urgencyLevel: "high",
      isNewPatient: true,
    },
  },
  {
    key: "request_rejected_1",
    profileKey: "maria",
    serviceKey: "wellnessPlan",
    preferredDate: "2026-02-12",
    preferredTime: "15:00",
    timezone: "America/Lima",
    patientName: "Miguel Torres",
    patientPhone: "+51989012345",
    patientEmail: null,
    patientAge: 55,
    patientGender: "masculino",
    chiefComplaint: "Plan de 3 meses intensivo",
    symptoms: "Presión alta",
    medicalHistory: "Hipertensión, colesterol alto",
    currentMedications: "Losartán, Atorvastatina",
    allergies: "Ninguna",
    urgencyLevel: "urgent",
    preferredContactMethod: "phone",
    status: "rejected",
    rejectionReason:
      "El horario solicitado no está disponible. Por favor propone otra fecha.",
    metadata: {
      symptoms: ["Hipertensión"],
      urgencyLevel: "urgent",
      isNewPatient: false,
    },
  },
];

function getPreferredAtUtc(
  dateStr: string,
  timeStr: string,
  timezone: string,
): Date {
  // Simple conversion for seeder purposes
  // In production, use date-fns-tz
  const dateTimeStr = `${dateStr}T${timeStr}:00`;
  return new Date(dateTimeStr);
}

export async function seedReservationRequests() {
  console.log("📝 Seeding reservation requests...");

  // CLEANUP: Remove existing reservation requests for this user's profiles
  console.log(`  🧹 Cleaning up existing reservation requests...`);
  const userProfileIds = Object.values(createdProfileIds);
  let deletedCount = 0;
  for (const profileId of userProfileIds) {
    const result = await db
      .delete(reservationRequest)
      .where(eq(reservationRequest.profileId, profileId));
    deletedCount += result.count || 0;
  }
  console.log(`  ✓ Removed ${deletedCount} request(s)`);

  for (const requestData of RESERVATION_REQUEST_DATA) {
    const {
      key,
      profileKey,
      serviceKey,
      preferredDate,
      preferredTime,
      timezone,
      rejectionReason,
      ...data
    } = requestData;

    const profileId = createdProfileIds[profileKey];
    const serviceId = createdMedicalServiceIds[serviceKey];

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping request`);
      continue;
    }

    if (!serviceId) {
      console.log(`  ⚠️  Service ${serviceKey} not found, skipping request`);
      continue;
    }

    const preferredAtUtc = getPreferredAtUtc(
      preferredDate,
      preferredTime,
      timezone,
    );
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const insertData: any = {
      profileId,
      serviceId,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      patientEmail: data.patientEmail || null,
      patientAge: data.patientAge || null,
      patientGender: data.patientGender || null,
      chiefComplaint: data.chiefComplaint || null,
      symptoms: data.symptoms || null,
      medicalHistory: data.medicalHistory || null,
      currentMedications: data.currentMedications || null,
      allergies: data.allergies || null,
      urgencyLevel: data.urgencyLevel || "normal",
      preferredContactMethod: data.preferredContactMethod || "whatsapp",
      status: data.status,
      preferredAtUtc,
      requestedTimezone: timezone,
      metadata: data.metadata || {},
      expiresAt,
    };

    if (rejectionReason) {
      insertData.rejectionReason = rejectionReason;
    }

    const [created] = await db
      .insert(reservationRequest)
      .values(insertData)
      .returning({ id: reservationRequest.id });

    if (created) {
      createdReservationRequestIds[key] = created.id;
      console.log(
        `  ✓ Created request: ${data.patientName} (${data.status}) - ID: ${created.id}`,
      );
    }
  }

  console.log("✅ Reservation requests seeded successfully\n");
}
