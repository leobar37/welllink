import { createdProfileIds } from "./profiles.seeder";
import { createdMedicalServiceIds } from "./medical-services.seeder";
import { createdTimeSlotIds } from "./time-slots.seeder";
import { getTestUserId } from "./users.seeder";
import { sql, eq } from "drizzle-orm";
import { db } from "../index";
import { reservationRequest } from "../schema/reservation-request";

export const createdReservationRequestIds: Record<string, string> = {};

function getSlotKey(day: number, hour: number): string {
  const period = hour < 12 ? "morning" : "afternoon";
  return `slot_${period}_${day}_${hour}`;
}

const RESERVATION_REQUEST_DATA = [
  {
    key: "request_pending_1",
    profileKey: "maria",
    serviceKey: "consultation",
    slotKey: getSlotKey(3, 10),
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
    requestedTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    key: "request_pending_2",
    profileKey: "maria",
    serviceKey: "followUp",
    slotKey: getSlotKey(3, 14),
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
    requestedTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    key: "request_approved_1",
    profileKey: "maria",
    serviceKey: "consultation",
    slotKey: getSlotKey(4, 9),
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
    requestedTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  },
  {
    key: "request_rejected_1",
    profileKey: "maria",
    serviceKey: "wellnessPlan",
    slotKey: getSlotKey(5, 15),
    patientName: "Miguel Torres",
    patientPhone: "+51989012345",
    patientEmail: null,
    patientAge: 55,
    patientGender: "masculino",
    chiefComplaint: "Plan de 3 meses intensivo",
    symptoms: "Presión alta",
    medicalHistory: "Hipertensión, cholesterol alto",
    currentMedications: "Losartán, Atorvastatina",
    allergies: "Ninguna",
    urgencyLevel: "urgent",
    preferredContactMethod: "phone",
    status: "rejected",
    requestedTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    key: "request_pending_3",
    profileKey: "maria",
    serviceKey: "consultation",
    slotKey: getSlotKey(4, 11),
    patientName: "Sandra Ruiz",
    patientPhone: "+51990123456",
    patientEmail: "sandra.ruiz@example.com",
    patientAge: 30,
    patientGender: "femenino",
    chiefComplaint: "Alimentación para atletas",
    symptoms: "Ninguno",
    medicalHistory: "Ninguna",
    currentMedications: "Ninguno",
    allergies: "Lacteos",
    urgencyLevel: "normal",
    preferredContactMethod: "whatsapp",
    status: "pending",
    requestedTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
  },
];

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
    const { key, profileKey, serviceKey, slotKey, ...data } = requestData;

    const profileId = createdProfileIds[profileKey];
    const serviceId = createdMedicalServiceIds[serviceKey];
    const slotId = createdTimeSlotIds[slotKey];

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping request`);
      continue;
    }

    if (!serviceId) {
      console.log(`  ⚠️  Service ${serviceKey} not found, skipping request`);
      continue;
    }

    if (!slotId) {
      console.log(`  ⚠️  Slot ${slotKey} not found, skipping request`);
      continue;
    }

    // Insert using SQL directly
    const result = await db.execute(sql`
      INSERT INTO reservation_request (
        profile_id, slot_id, service_id, patient_name, patient_phone, patient_email,
        patient_age, patient_gender, chief_complaint, symptoms, medical_history,
        current_medications, allergies, urgency_level, preferred_contact_method,
        status, requested_time, expires_at
      ) VALUES (
        ${profileId}, ${slotId}, ${serviceId}, ${data.patientName}, ${data.patientPhone}, ${data.patientEmail},
        ${data.patientAge}, ${data.patientGender}, ${data.chiefComplaint}, ${data.symptoms}, ${data.medicalHistory},
        ${data.currentMedications}, ${data.allergies}, ${data.urgencyLevel}, ${data.preferredContactMethod},
        ${data.status}, ${data.requestedTime}, ${data.expiresAt}
      ) RETURNING id
    `);

    const createdId = result[0]?.id || result[0]?.insertedId;
    if (createdId) {
      createdReservationRequestIds[key] = String(createdId);
      console.log(
        `  ✓ Created request: ${data.patientName} (${data.status}) - ID: ${createdId}`,
      );
    }
  }

  console.log("✅ Reservation requests seeded successfully\n");
}
