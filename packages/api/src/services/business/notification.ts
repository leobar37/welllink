import { WhatsAppConfigRepository } from "../repository/whatsapp-config";
import { ProfileRepository } from "../repository/profile";
import { EvolutionService } from "./evolution-api";

export interface ReservationRequestNotificationData {
  requestId: string;
  profileId: string;
  doctorPhone: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  appointmentDate: Date;
  appointmentTime: Date;
  urgencyLevel: string;
  chiefComplaint: string;
}

export interface ApprovalNotificationData {
  requestId: string;
  profileId: string;
  patientPhone: string;
  patientName: string;
  serviceName: string;
  appointmentDate: Date;
  appointmentTime: string;
  changes?: {
    newDate?: Date;
    newTime?: string;
    newService?: string;
  };
}

export interface RejectionNotificationData {
  requestId: string;
  profileId: string;
  patientPhone: string;
  patientName: string;
  rejectionReason: string;
}

export class NotificationService {
  constructor(
    private whatsappConfigRepository: WhatsAppConfigRepository,
    private profileRepository: ProfileRepository,
    private evolutionService: EvolutionService,
  ) {}

  private async getWhatsAppConfig(profileId: string) {
    const configs =
      await this.whatsappConfigRepository.findByProfile(profileId);
    const activeConfig = configs.find((c) => c.isEnabled && c.isConnected);
    if (!activeConfig) {
      throw new Error(
        "No active WhatsApp configuration found for this profile",
      );
    }
    return activeConfig;
  }

  async notifyDoctorNewRequest(data: ReservationRequestNotificationData) {
    try {
      const config = await this.getWhatsAppConfig(data.profileId);

      const formattedDate = data.appointmentDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = data.appointmentTime.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = `🩺 *NUEVA SOLICITUD DE CITA*

👤 *Paciente:* ${data.patientName}
📞 *Teléfono:* ${data.patientPhone}
🏥 *Servicio:* ${data.serviceName}
📅 *Fecha:* ${formattedDate}
🕐 *Hora:* ${formattedTime}
⚡ *Urgencia:* ${data.urgencyLevel}

📝 *Motivo:*
${data.chiefComplaint || "No especificado"}

---
Responde en el dashboard para aprobar o rechazar esta solicitud.`;

      const formattedPhone = this.evolutionService.formatPhoneNumber(
        data.doctorPhone,
      );

      await this.evolutionService.sendText(config.instanceName, {
        number: formattedPhone,
        text: message,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending doctor notification:", error);
      return { success: false, error };
    }
  }

  async notifyPatientApproval(data: ApprovalNotificationData) {
    try {
      const config = await this.getWhatsAppConfig(data.profileId);

      const formattedDate = data.appointmentDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let message = `✅ *SOLICITUD APROBADA*

¡Hola ${data.patientName}!

Tu solicitud de cita ha sido *aprobada*.

🏥 *Servicio:* ${data.serviceName}
📅 *Fecha:* ${formattedDate}
🕐 *Hora:* ${data.appointmentTime}`;

      if (data.changes) {
        message += `\n\n📝 *Cambios realizados:*\n`;
        if (data.changes.newDate) {
          const newFormattedDate = data.changes.newDate.toLocaleDateString(
            "es-ES",
            {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            },
          );
          message += `• Fecha: ${newFormattedDate}\n`;
        }
        if (data.changes.newTime) {
          message += `• Hora: ${data.changes.newTime}\n`;
        }
        if (data.changes.newService) {
          message += `• Servicio: ${data.changes.newService}\n`;
        }
      }

      message += `\n\n📌 *Importante:* Si no puedes asistir, avisa con al menos 24 horas de antelación.`;

      const formattedPhone = this.evolutionService.formatPhoneNumber(
        data.patientPhone,
      );

      await this.evolutionService.sendText(config.instanceName, {
        number: formattedPhone,
        text: message,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending patient approval notification:", error);
      return { success: false, error };
    }
  }

  async notifyPatientRejection(data: RejectionNotificationData) {
    try {
      const config = await this.getWhatsAppConfig(data.profileId);

      const message = `❌ *SOLICITUD NO APROBADA*

Hola ${data.patientName},

Lamentamos informarte que tu solicitud de cita *no ha podido ser aprobada* en este momento.

📝 *Motivo:*
${data.rejectionReason}

Te invitamos a intentar con otra fecha u horario disponible.

Si tienes alguna pregunta, puedes contactar directamente al médico.`;

      const formattedPhone = this.evolutionService.formatPhoneNumber(
        data.patientPhone,
      );

      await this.evolutionService.sendText(config.instanceName, {
        number: formattedPhone,
        text: message,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending patient rejection notification:", error);
      return { success: false, error };
    }
  }

  async notifyPatientExpiration(
    profileId: string,
    patientPhone: string,
    patientName: string,
    serviceName: string,
  ) {
    try {
      const config = await this.getWhatsAppConfig(profileId);

      const message = `⏰ *SOLICITUD EXPIRADA*

Hola ${patientName},

Tu solicitud de cita para ${serviceName} ha *expirado* por falta de respuesta del médico.

Te invitamos a intentar con otra fecha u horario disponible.`;

      const formattedPhone =
        this.evolutionService.formatPhoneNumber(patientPhone);

      await this.evolutionService.sendText(config.instanceName, {
        number: formattedPhone,
        text: message,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending patient expiration notification:", error);
      return { success: false, error };
    }
  }

  async notifyDoctorExpiration(
    profileId: string,
    doctorPhone: string,
    patientName: string,
    requestedTime: Date,
  ) {
    try {
      const config = await this.getWhatsAppConfig(profileId);

      const formattedDate = requestedTime.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = requestedTime.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = `⏰ *SOLICITUD EXPIRADA*

La solicitud de cita del paciente ${patientName} ha expirado sin respuesta.

📅 *Fecha solicitada:* ${formattedDate}
🕐 *Hora:* ${formattedTime}

El horario ha sido liberado y está disponible para otros pacientes.`;

      const formattedPhone =
        this.evolutionService.formatPhoneNumber(doctorPhone);

      await this.evolutionService.sendText(config.instanceName, {
        number: formattedPhone,
        text: message,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending doctor expiration notification:", error);
      return { success: false, error };
    }
  }

  async sendAppointmentReminder(
    profileId: string,
    patientPhone: string,
    patientName: string,
    serviceName: string,
    appointmentDate: Date,
    appointmentTime: string,
    hoursBefore: number,
  ) {
    try {
      const config = await this.getWhatsAppConfig(profileId);

      const formattedDate = appointmentDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let message = `📅 *RECORDATORIO DE CITA*

Hola ${patientName},

`;

      if (hoursBefore >= 24) {
        message += `Te recordamos que tienes una cita programada para *mañana*:

🏥 *Servicio:* ${serviceName}
📅 *Fecha:* ${formattedDate}
🕐 *Hora:* ${appointmentTime}`;
      } else {
        message += `Tu cita es en *${hoursBefore} horas*:

🏥 *Servicio:* ${serviceName}
📅 *Fecha:* ${formattedDate}
🕐 *Hora:* ${appointmentTime}`;
      }

      message += `\n\n📌 Por favor, confirma tu asistencia respondiendo a este mensaje.`;

      const formattedPhone =
        this.evolutionService.formatPhoneNumber(patientPhone);

      await this.evolutionService.sendText(config.instanceName, {
        number: formattedPhone,
        text: message,
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending appointment reminder:", error);
      return { success: false, error };
    }
  }
}
