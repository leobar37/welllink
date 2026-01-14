import { inngest } from "../../lib/inngest-client";

export * from "./types";
export * from "./request-expiration";
export * from "./reminders";
export * from "./doctor-notifications";
export * from "./slot-generation";
export * from "./follow-up";
export * from "./reservation-confirmation";

import { expirePendingRequests } from "./request-expiration";
import { send24HourReminder, send2HourReminder } from "./reminders";
import {
  notifyDoctorNewRequest,
  notifyDoctorRequestExpired,
} from "./doctor-notifications";
import {
  generateDailySlots,
  dailySlotGenerationForAll,
} from "./slot-generation";
import { sendFollowUpMessage } from "./follow-up";
import {
  handleReservationApproved,
  handleReservationCancelled,
} from "./reservation-confirmation";

export const functions = [
  expirePendingRequests,
  send24HourReminder,
  send2HourReminder,
  notifyDoctorNewRequest,
  notifyDoctorRequestExpired,
  generateDailySlots,
  dailySlotGenerationForAll,
  sendFollowUpMessage,
  handleReservationApproved,
  handleReservationCancelled,
];
