import { createSeederContext } from "./helpers";
import { ReservationRepository } from "../../services/repository/reservation";
import { createdProfileIds } from "./profiles.seeder";
import { createdMedicalServiceIds } from "./medical-services.seeder";
import { createdTimeSlotIds } from "./time-slots.seeder";
import { createdClientIds } from "./clients.seeder";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
import { reservation } from "../schema/reservation";
import { db } from "../index";

export const createdReservationIds: Record<string, string> = {};

function getSlotKey(day: number, hour: number): string {
  const period = hour < 12 ? "morning" : "afternoon";
  return `slot_${period}_${day}_${hour}`;
}

const RESERVATION_DATA = [
  {
    key: "reservation_confirmed",
    profileKey: "maria",
    serviceKey: "consultation",
    slotKey: getSlotKey(0, 10),
    patientName: "Laura Gómez",
    patientPhone: "+51912345678",
    patientEmail: "laura.gomez@example.com",
    status: "confirmed" as const,
    source: "whatsapp",
    notes: "Primera consulta. Interesada en plan de bienestar.",
    priceAtBooking: "80.00",
    paymentStatus: "pending" as const,
  },
  {
    key: "reservation_completed",
    profileKey: "maria",
    serviceKey: "followUp",
    slotKey: getSlotKey(1, 9),
    patientName: "Roberto Pérez",
    patientPhone: "+51923456789",
    patientEmail: "roberto.p@example.com",
    status: "completed" as const,
    source: "whatsapp",
    notes: "Seguimiento mensual. Ha perdido 3kg desde la última visita.",
    priceAtBooking: "45.00",
    paymentStatus: "paid" as const,
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    key: "reservation_cancelled",
    profileKey: "maria",
    serviceKey: "consultation",
    slotKey: getSlotKey(1, 16),
    patientName: "Sofía Ramírez",
    patientPhone: "+51934567890",
    patientEmail: null,
    status: "cancelled" as const,
    source: "instagram",
    notes: "Canceló por conflicto de horario. Reagendada.",
    priceAtBooking: "80.00",
    paymentStatus: "cancelled" as const,
    cancelledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    key: "reservation_no_show",
    profileKey: "maria",
    serviceKey: "consultation",
    slotKey: getSlotKey(2, 11),
    patientName: "Diego Torres",
    patientPhone: "+51945678901",
    patientEmail: "diego.t@example.com",
    status: "no_show" as const,
    source: "referral",
    notes: "No se presentó a la cita. Sin aviso previo.",
    priceAtBooking: "80.00",
    paymentStatus: "pending" as const,
    noShow: true,
  },
];

export async function seedReservations() {
  console.log("📅 Seeding reservations...");

  const reservationRepository = new ReservationRepository();
  const userId = await getTestUserId();

  // CLEANUP: Remove existing reservations for this user's profiles
  console.log(`  🧹 Cleaning up existing reservations...`);
  const userProfileIds = Object.values(createdProfileIds);
  let deletedCount = 0;
  for (const profileId of userProfileIds) {
    const result = await db
      .delete(reservation)
      .where(eq(reservation.profileId, profileId));
    deletedCount += result.count || 0;
  }
  console.log(`  ✓ Removed ${deletedCount} reservation(s)`);

  for (const reservationData of RESERVATION_DATA) {
    const { key, profileKey, serviceKey, slotKey, ...data } = reservationData;
    const profileId = createdProfileIds[profileKey];
    const serviceId = createdMedicalServiceIds[serviceKey];
    const slotId = createdTimeSlotIds[slotKey];
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping reservation`,
      );
      continue;
    }

    if (!serviceId) {
      console.log(
        `  ⚠️  Service ${serviceKey} not found, skipping reservation`,
      );
      continue;
    }

    if (!slotId) {
      console.log(`  ⚠️  Slot ${slotKey} not found, skipping reservation`);
      continue;
    }

    const created = await reservationRepository.create({
      ...data,
      profileId,
      serviceId,
      slotId,
    });

    createdReservationIds[key] = created.id;
    console.log(
      `  ✓ Created reservation: ${data.patientName} (${data.status}) - ID: ${created.id}`,
    );
  }

  console.log("✅ Reservations seeded successfully\n");
}
