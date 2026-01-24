// ============================================
// AI UI STANDARD TYPES
// ============================================
// Standardized types for AI message parts and UI components
// Following AI SDK patterns with extensibility for medical domain

import type { UIMessage } from "ai";

// ============================================
// Base Types
// ============================================

/**
 * Base interface for all UI parts in the AI message system.
 * All custom parts should extend this interface.
 */
export interface BaseAIPart {
  /** Unique identifier for tracking and React keys */
  id?: string;
  /** Discriminator for union type matching */
  readonly type: string;
}

// ============================================
// Standard AI SDK Parts
// ============================================

/**
 * Text part - standard text content from the AI
 */
export interface TextAIPart extends BaseAIPart {
  readonly type: "text";
  /** The actual text content */
  text: string;
}

/**
 * Tool call part - AI is calling a tool (before execution)
 */
export interface ToolCallAIPart extends BaseAIPart {
  readonly type: "tool-call";
  /** ID linking to the tool result */
  toolCallId: string;
  /** Name of the tool being called */
  toolName: string;
  /** Input parameters for the tool */
  input: unknown;
}

/**
 * Tool result part - result from tool execution
 */
export interface ToolResultAIPart extends BaseAIPart {
  readonly type: "tool-result";
  /** ID linking to the original tool call */
  toolCallId: string;
  /** Name of the tool that was called */
  toolName: string;
  /** Result output from the tool */
  output: unknown;
  /** Error if the tool failed */
  errorText?: string;
}

// ============================================
// Medical Domain Custom Parts
// ============================================

/**
 * Service data structure for medical services
 */
export interface ServiceData {
  /** Unique service identifier */
  id: string;
  /** Service name */
  name: string;
  /** Service description */
  description: string;
  /** Formatted price string (e.g., "$500") */
  price: string;
  /** Formatted duration string (e.g., "45 min") */
  duration: string;
  /** Service category (e.g., "consulta", "procedimiento") */
  category?: string;
}

/**
 * Services list part - displays available medical services
 */
export interface ServicesAIPart extends BaseAIPart {
  readonly type: "services-list";
  /** Array of services to display */
  services: ServiceData[];
  /** Optional title/description for the list */
  title?: string;
}

/**
 * Slot data structure for appointment availability
 */
export interface SlotData {
  /** Unique slot identifier */
  id: string;
  /** ISO datetime string for start time */
  startTime: string;
  /** ISO datetime string for end time */
  endTime: string;
  /** Number of available appointments */
  available: number;
  /** Maximum capacity for this slot */
  maxReservations: number;
}

/**
 * Availability part - displays available time slots for booking
 */
export interface AvailabilityAIPart extends BaseAIPart {
  readonly type: "availability";
  /** Date being queried (YYYY-MM-DD format) */
  date: string;
  /** Array of available time slots */
  slots: SlotData[];
  /** Service ID these slots are for */
  serviceId?: string;
}

/**
 * Reservation data structure for appointment confirmation
 */
export interface ReservationData {
  /** Unique reservation identifier */
  id: string;
  /** Reservation status */
  status: "pending" | "confirmed" | "rejected";
  /** Service name */
  serviceName: string;
  /** Formatted date string */
  date: string;
  /** Formatted time string */
  time: string;
  /** Patient name if provided */
  patientName?: string;
  /** Additional notes or message */
  message?: string;
}

/**
 * Reservation part - displays reservation confirmation and status
 */
export interface ReservationAIPart extends BaseAIPart {
  readonly type: "reservation";
  /** Reservation details */
  reservation: ReservationData;
}

/**
 * FAQ item structure
 */
export interface FAQItem {
  /** Question text */
  question: string;
  /** Answer text */
  answer: string;
}

/**
 * FAQ part - displays frequently asked questions
 */
export interface FAQAIPart extends BaseAIPart {
  readonly type: "faq";
  /** Array of FAQ items */
  faqs: FAQItem[];
  /** Optional category filter */
  category?: string;
}

/**
 * Calendar/date picker part - allows user to select a date
 */
export interface CalendarAIPart extends BaseAIPart {
  readonly type: "calendar";
  /** Currently selected date */
  selectedDate?: string;
  /** Available date range start */
  minDate?: string;
  /** Available date range end */
  maxDate?: string;
  /** Service ID to check availability for */
  serviceId?: string;
}

/**
 * Patient form data structure for appointment booking
 */
export interface PatientFormData {
  /** Patient full name */
  name: string;
  /** Patient phone number */
  phone: string;
  /** Patient email (optional) */
  email?: string;
  /** Main complaint or reason for visit */
  chiefComplaint?: string;
  /** Service ID being booked */
  serviceId: string;
  /** Slot ID being booked */
  slotId: string;
  /** Service name */
  serviceName?: string;
  /** Date of appointment */
  date: string;
  /** Time of appointment */
  time: string;
}

/**
 * Patient form part - collects patient information for appointment
 */
export interface PatientFormAIPart extends BaseAIPart {
  readonly type: "patient-form";
  /** Form title */
  title?: string;
  /** Service ID */
  serviceId: string;
  /** Slot ID */
  slotId: string;
  /** Service name for display */
  serviceName?: string;
  /** Appointment date */
  date: string;
  /** Appointment time */
  time: string;
}

/**
 * Confirmation dialog part - requires user confirmation
 */
export interface ConfirmationAIPart extends BaseAIPart {
  readonly type: "confirmation";
  /** Confirmation title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Data being confirmed */
  data?: unknown;
}

// ============================================
// Complete Union Type
// ============================================

/**
 * Union of all supported AI message part types.
 * Add new types here when extending the system.
 */
export type AIMessagePart =
  | TextAIPart
  | ToolCallAIPart
  | ToolResultAIPart
  | ServicesAIPart
  | AvailabilityAIPart
  | ReservationAIPart
  | FAQAIPart
  | CalendarAIPart
  | PatientFormAIPart
  | ConfirmationAIPart;

/**
 * Extended message with standardized parts
 */
export interface AIMessage extends Omit<UIMessage, "parts"> {
  /** Standardized message parts for UI rendering */
  parts: AIMessagePart[];
}

// ============================================
// Handler Interfaces
// ============================================

/**
 * Handler callbacks for interactive AI UI components.
 * Implement these handlers in the parent component to handle user interactions.
 */
export interface AIUIHandlers {
  /** Called when user selects a service */
  onSelectService?: (service: ServiceData) => void;
  /** Called when user selects a time slot */
  onSelectSlot?: (slot: SlotData, date: string, serviceId?: string) => void;
  /** Called when user confirms a reservation */
  onConfirmReservation?: (reservation: ReservationData) => void;
  /** Called when user cancels a reservation */
  onCancelReservation?: (reservationId: string) => void;
  /** Called when user selects a date from calendar */
  onSelectDate?: (date: string, serviceId?: string) => void;
  /** Called when user selects a FAQ item */
  onSelectFAQ?: (item: FAQItem) => void;
  /** Called when user submits patient form data */
  onSubmitPatientData?: (data: PatientFormData) => void;
  /** Called when user confirms a confirmation dialog */
  onConfirm?: (data?: unknown) => void;
  /** Called when user cancels a confirmation dialog */
  onCancel?: () => void;
  /** Called when user wants to escalate to human agent */
  onEscalate?: (reason?: string) => void;
  /** Called when user wants to retry an action */
  onRetry?: () => void;
}

// ============================================
// Utility Types
// ============================================

/**
 * Type guard to check if a part is a specific type
 */
export function isTextPart(part: AIMessagePart): part is TextAIPart {
  return part.type === "text";
}

/**
 * Type guard to check if a part is a services list
 */
export function isServicesPart(part: AIMessagePart): part is ServicesAIPart {
  return part.type === "services-list";
}

/**
 * Type guard to check if a part is availability
 */
export function isAvailabilityPart(
  part: AIMessagePart,
): part is AvailabilityAIPart {
  return part.type === "availability";
}

/**
 * Type guard to check if a part is a reservation
 */
export function isReservationPart(
  part: AIMessagePart,
): part is ReservationAIPart {
  return part.type === "reservation";
}

/**
 * Type guard to check if a part is a FAQ
 */
export function isFAQPart(part: AIMessagePart): part is FAQAIPart {
  return part.type === "faq";
}

/**
 * Extract the handler type for a specific part type
 */
export type HandlerForPart<T extends AIMessagePart> = T extends ServicesAIPart
  ? Required<Pick<AIUIHandlers, "onSelectService">>
  : T extends AvailabilityAIPart
    ? Required<Pick<AIUIHandlers, "onSelectSlot">>
    : T extends ReservationAIPart
      ? Required<
          Pick<AIUIHandlers, "onConfirmReservation" | "onCancelReservation">
        >
      : T extends FAQAIPart
        ? Required<Pick<AIUIHandlers, "onSelectFAQ">>
        : T extends CalendarAIPart
          ? Required<Pick<AIUIHandlers, "onSelectDate">>
          : T extends ConfirmationAIPart
            ? Required<Pick<AIUIHandlers, "onConfirm" | "onCancel">>
            : AIUIHandlers;
