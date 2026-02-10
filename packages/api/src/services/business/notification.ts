import { es } from "date-fns/locale";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export interface ReservationRequestNotificationData {
  requestId: string;
  profileId: string;
  serviceId: string;
  patientName: string;
  patientPhone: string;
  preferredAtUtc: Date;
  requestedTimezone: string;
  urgencyLevel: string;
  chiefComplaint: string;
}

export interface ApprovalNotificationData {
  requestId: string;
  profileId: string;
  serviceId: string;
  patientPhone: string;
  patientName: string;
  scheduledAtUtc: Date;
  scheduledTimezone: string;
  notes?: string;
}

export interface RejectionNotificationData {
  requestId: string;
  profileId: string;
  patientPhone: string;
  patientName: string;
  rejectionReason: string;
}

export interface RescheduleProposalNotificationData {
  requestId: string;
  profileId: string;
  patientPhone: string;
  patientName: string;
  proposedAtUtc: Date;
  proposedTimezone: string;
  reason?: string;
  proposalExpiresAt?: Date;
}

export interface RescheduleAcceptedNotificationData {
  requestId: string;
  profileId: string;
  patientPhone: string;
  patientName: string;
  scheduledAtUtc: Date;
  scheduledTimezone: string;
}

export class NotificationService {
  constructor(
    private whatsappConfigRepository: any,
    private profileRepository: any,
    private medicalServiceRepository: any,
    private evolutionService: any,
  ) {}

  private formatInTimezone(
    utcDate: Date,
    timezone: string,
  ): { date: string; time: string } {
    const zonedDate = toZonedTime(utcDate, timezone);
    return {
      date: format(zonedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(zonedDate, "HH:mm"),
    };
  }

  async notifyDoctorNewRequest(data: ReservationRequestNotificationData) {
    const { date: formattedDate, time: formattedTime } = this.formatInTimezone(
      data.preferredAtUtc,
      data.requestedTimezone,
    );

    console.log(`[NOTIFICATION] Nueva solicitud de cita:
- Paciente: ${data.patientName} (${data.patientPhone})
- Fecha: ${formattedDate}
- Hora: ${formattedTime}
- Urgencia: ${data.urgencyLevel}
- Motivo: ${data.chiefComplaint || "No especificado"}`);

    return { success: true, message: "Notification logged" };
  }

  async notifyPatientApproval(data: ApprovalNotificationData) {
    const { date: formattedDate, time: formattedTime } = this.formatInTimezone(
      data.scheduledAtUtc,
      data.scheduledTimezone,
    );

    console.log(`[NOTIFICATION] Solicitud aprobada:
- Paciente: ${data.patientName} (${data.patientPhone})
- Fecha: ${formattedDate}
- Hora: ${formattedTime}
- Notas: ${data.notes || "Ninguna"}`);

    return { success: true, message: "Notification logged" };
  }

  async notifyPatientRejection(data: RejectionNotificationData) {
    console.log(`[NOTIFICATION] Solicitud rechazada:
- Paciente: ${data.patientName} (${data.patientPhone})
- Motivo: ${data.rejectionReason}`);

    return { success: true, message: "Notification logged" };
  }

  async notifyRescheduleProposal(data: RescheduleProposalNotificationData) {
    const { date: formattedDate, time: formattedTime } = this.formatInTimezone(
      data.proposedAtUtc,
      data.proposedTimezone,
    );

    console.log(`[NOTIFICATION] Propuesta de reprogramación:
- Paciente: ${data.patientName} (${data.patientPhone})
- Nueva fecha: ${formattedDate}
- Nueva hora: ${formattedTime}
- Motivo: ${data.reason || "No especificado"}`);

    return { success: true, message: "Notification logged" };
  }

  async notifyRescheduleAccepted(data: RescheduleAcceptedNotificationData) {
    const { date: formattedDate, time: formattedTime } = this.formatInTimezone(
      data.scheduledAtUtc,
      data.scheduledTimezone,
    );

    console.log(`[NOTIFICATION] Reprogramación aceptada:
- Paciente: ${data.patientName} (${data.patientPhone})
- Fecha: ${formattedDate}
- Hora: ${formattedTime}`);

    return { success: true, message: "Notification logged" };
  }

  async notifyRescheduleRejected(data: RejectionNotificationData) {
    console.log(`[NOTIFICATION] Reprogramación rechazada:
- Paciente: ${data.patientName} (${data.patientPhone})`);

    return { success: true, message: "Notification logged" };
  }

  async notifyPatientExpiration(
    profileId: string,
    patientPhone: string,
    patientName: string,
    serviceName: string,
  ) {
    console.log(`[NOTIFICATION] Solicitud expirada:
- Paciente: ${patientName} (${patientPhone})
- Servicio: ${serviceName}`);

    return { success: true, message: "Notification logged" };
  }

  async notifyDoctorExpiration(
    profileId: string,
    doctorPhone: string,
    patientName: string,
    preferredAtUtc: Date,
    requestedTimezone: string,
  ) {
    const { date: formattedDate, time: formattedTime } = this.formatInTimezone(
      preferredAtUtc,
      requestedTimezone,
    );

    console.log(`[NOTIFICATION] Solicitud expirada (doctor):
- Paciente: ${patientName}
- Fecha solicitada: ${formattedDate}
- Hora: ${formattedTime}`);

    return { success: true, message: "Notification logged" };
  }

  async sendAppointmentReminder(
    profileId: string,
    patientPhone: string,
    patientName: string,
    serviceName: string,
    scheduledAtUtc: Date,
    scheduledTimezone: string,
    hoursBefore: number,
  ) {
    const { date: formattedDate, time: formattedTime } = this.formatInTimezone(
      scheduledAtUtc,
      scheduledTimezone,
    );

    console.log(`[NOTIFICATION] Recordatorio de cita:
- Paciente: ${patientName} (${patientPhone})
- Servicio: ${serviceName}
- Fecha: ${formattedDate}
- Hora: ${formattedTime}
- Horas antes: ${hoursBefore}`);

    return { success: true, message: "Notification logged" };
  }
}
