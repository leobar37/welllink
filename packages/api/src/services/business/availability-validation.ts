import { ProfileRepository } from "../repository/profile";
import { format, getDay, parse } from "date-fns";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface ValidateAvailabilityParams {
  profileId: string;
  date: string; // ISO date string "YYYY-MM-DD"
  time: string; // Time string "HH:MM"
  timezone: string;
}

export class AvailabilityValidationService {
  constructor(private profileRepository: ProfileRepository) {}

  async validateAgainstRules(
    profileId: string,
    localDate: string,
    localTime: string,
    _requestedTimezone: string,
  ): Promise<ValidationResult> {
    try {
      // Get the profile with availability settings
      const profile = await this.profileRepository.findById(profileId);
      if (!profile) {
        return {
          valid: false,
          reason: "Perfil no encontrado",
        };
      }

      // Check if accepting appointments
      if (!profile.isAcceptingAppointments) {
        return {
          valid: false,
          reason: "El profesional no está aceptando citas en este momento",
        };
      }

      // Parse the local date and time
      const localDateTime = parse(
        `${localDate}T${localTime}:00`,
        "yyyy-MM-dd'T'HH:mm:ss",
        new Date(),
      );

      if (isNaN(localDateTime.getTime())) {
        return {
          valid: false,
          reason: "Formato de fecha u hora inválido",
        };
      }

      // Get day of week (0 = Sunday, 6 = Saturday) and convert to ISO 1-7 (Mon=1, Sun=7)
      const dayOfWeek = getDay(localDateTime);
      const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      // Check if the day is a working day
      const workDays = profile.workDays || [1, 2, 3, 4, 5]; // Default Mon-Fri
      if (!workDays.includes(isoDay)) {
        return {
          valid: false,
          reason: `El profesional no atiende los ${this.getDayName(dayOfWeek)}`,
        };
      }

      // Parse the requested time
      const [hours, minutes] = localTime.split(":").map(Number);
      const requestedMinutes = hours * 60 + minutes;

      // Get work hours from profile
      const workStartTime = profile.workStartTime || "09:00";
      const workEndTime = profile.workEndTime || "18:00";

      // Parse work hours
      const [startHours, startMinutes] = workStartTime.split(":").map(Number);
      const [endHours, endMinutes] = workEndTime.split(":").map(Number);

      const startMinutesTotal = startHours * 60 + startMinutes;
      const endMinutesTotal = endHours * 60 + endMinutes;

      // Check if requested time is within work hours
      if (
        requestedMinutes >= startMinutesTotal &&
        requestedMinutes < endMinutesTotal
      ) {
        return {
          valid: true,
        };
      }

      return {
        valid: false,
        reason: `Hora fuera del horario de atención. Horario disponible: ${workStartTime} - ${workEndTime}`,
      };
    } catch (error) {
      console.error("Error validating availability:", error);
      return {
        valid: false,
        reason: "Error al validar disponibilidad",
      };
    }
  }

  async validateRescheduleTime(
    profileId: string,
    newDate: string,
    newTime: string,
    timezone: string,
  ): Promise<ValidationResult> {
    return this.validateAgainstRules(profileId, newDate, newTime, timezone);
  }

  private getDayName(dayOfWeek: number): string {
    const days = [
      "domingo",
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
    ];
    return days[dayOfWeek] || "";
  }
}
