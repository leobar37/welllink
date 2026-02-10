import { createSeederContext } from "./helpers";
import { ReservationRepository } from "../../services/repository/reservation";
import { createdProfileIds } from "./profiles.seeder";
import { createdMedicalServiceIds } from "./medical-services.seeder";
import { createdClientIds } from "./clients.seeder";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
import { reservation } from "../schema/reservation";
import { db } from "../index";

export const createdReservationIds: Record<string, string> = {};

const RESERVATION_DATA = [
  {
    key: "reservation_confirmed",
    profileKey: "maria",
    serviceKey: "consultation",
    scheduledDate: "2026-02-15",
    scheduledTime: "10:00",
    timezone: "America/Lima",
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
    scheduledDate: "2026-02-10",
    scheduledTime: "14:00",
    timezone: "America/Lima",
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
    scheduledDate: "2026-02-08",
    scheduledTime: "09:00",
    timezone: "America/Lima",
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
    scheduledDate: "2026-02-05",
    scheduledTime: "11:00",
    timezone: "America/Lima",
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

function getScheduledAtUtc(
  dateStr: string,
  timeStr: string,
  timezone: string,
): Date {
  const dateTimeStr = `${dateStr}T${timeStr}:00`;
  return new Date(dateTimeStr);
}

export async function seedReservations() {
  console.log("📅 Seeding reservations...");

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
    const {
      key,
      profileKey,
      serviceKey,
      scheduledDate,
      scheduledTime,
      timezone,
      ...data
    } = reservationData;

    const profileId = createdProfileIds[profileKey];
    const serviceId = createdMedicalServiceIds[serviceKey];

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

    const scheduledAtUtc = getScheduledAtUtc(
      scheduledDate,
      scheduledTime,
      timezone,
    );

    const insertData: any = {
      profileId,
      serviceId,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      patientEmail: data.patientEmail || null,
      status: data.status,
      source: data.source || "web",
      notes: data.notes || null,
      scheduledAtUtc,
      scheduledTimezone: timezone,
      reminder24hSent: false,
      reminder2hSent: false,
      reminder24hScheduled: false,
      reminder2hScheduled: false,
      noShow: data.noShow || false,
      paymentStatus: data.paymentStatus || "pending",
      priceAtBooking: data.priceAtBooking
        ? parseFloat(data.priceAtBooking)
        : null,
    };

    if (data.completedAt) {
      insertData.completedAt = data.completedAt;
    }

    if (data.cancelledAt) {
      insertData.cancelledAt = data.cancelledAt;
    }

    const [created] = await db
      .insert(reservation)
      .values(insertData)
      .returning({ id: reservation.id });

    if (created) {
      createdReservationIds[key] = created.id;
      console.log(
        `  ✓ Created reservation: ${data.patientName} (${data.status}) - ID: ${created.id}`,
      );
    }
  }

  console.log("✅ Reservations seeded successfully\n");
}
