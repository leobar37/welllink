import { inngest } from "../../lib/inngest-client";

export * from "./types";
export * from "./request-expiration";
export * from "./reminders";
export * from "./doctor-notifications";
// slot-generation: REMOVED - availability simplified, no pre-generated slots
export * from "./follow-up";
export * from "./reservation-confirmation";
export * from "./reservation-completed";
export * from "./low-stock-alert";
export * from "./execute-automation";
export * from "./advanced-triggers";

import { expirePendingRequests } from "./request-expiration";
import { send24HourReminder, send2HourReminder } from "./reminders";
import {
  notifyDoctorNewRequest,
  notifyDoctorRequestExpired,
} from "./doctor-notifications";
// slot-generation functions: REMOVED - availability simplified
import { sendFollowUpMessage } from "./follow-up";
import {
  handleReservationApproved,
  handleReservationCancelled,
} from "./reservation-confirmation";
import { handleReservationCompleted } from "./reservation-completed";
import { checkLowStock, testLowStockAlert } from "./low-stock-alert";
import { 
  executeAutomation, 
  runScheduledAutomations, 
  retryAutomationExecution 
} from "./execute-automation";
// Advanced triggers
import {
  checkBirthdayTriggers,
  checkInactivityTriggers,
  checkAnniversaryTriggers,
  checkLowStockTriggers,
  handleNoShowTrigger,
  testBirthdayTriggers,
  testInactivityTriggers,
  testAnniversaryTriggers,
  testLowStockTriggers,
} from "./advanced-triggers";

export const functions = [
  expirePendingRequests,
  send24HourReminder,
  send2HourReminder,
  notifyDoctorNewRequest,
  notifyDoctorRequestExpired,
  // slot-generation functions: REMOVED - availability simplified
  sendFollowUpMessage,
  handleReservationApproved,
  handleReservationCancelled,
  handleReservationCompleted,
  checkLowStock,
  testLowStockAlert,
  // Automation functions
  executeAutomation,
  runScheduledAutomations,
  retryAutomationExecution,
  // Advanced trigger functions
  checkBirthdayTriggers,
  checkInactivityTriggers,
  checkAnniversaryTriggers,
  checkLowStockTriggers,
  handleNoShowTrigger,
  testBirthdayTriggers,
  testInactivityTriggers,
  testAnniversaryTriggers,
  testLowStockTriggers,
];
