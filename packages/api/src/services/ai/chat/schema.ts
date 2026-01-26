import { z } from "zod";

/**
 * Schema for structured AI chat responses
 * Matches the frontend AIMessagePart types defined in packages/web/src/components/ai-ui/types.ts
 */

// Text part - plain text content
export const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

// Service item within a services list
export const serviceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.string().nullable(),
  duration: z.string().nullable(),
  category: z.string().nullable(),
});

// Services list part - displays interactive service cards
export const servicesPartSchema = z.object({
  type: z.literal("services-list"),
  title: z.string().optional().default("Nuestros Servicios"),
  intro: z.string().optional(),
  services: z.array(serviceItemSchema),
  category: z.string().optional(),
});

// Availability slot item
export const availabilitySlotSchema = z.object({
  id: z.string(),
  startTime: z.string(), // ISO 8601 format
  endTime: z.string(), // ISO 8601 format
  available: z.number(),
});

// Availability part - displays available time slots
export const availabilityPartSchema = z.object({
  type: z.literal("availability"),
  date: z.string(), // YYYY-MM-DD format
  slots: z.array(availabilitySlotSchema),
  serviceId: z.string(),
  serviceName: z.string().optional(),
});

// Reservation item - individual reservation detail
export const reservationItemSchema = z.object({
  id: z.string(),
  serviceName: z.string(),
  date: z.string(),
  time: z.string(),
  patientName: z.string(),
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

// Reservation part - displays reservation confirmation
export const reservationPartSchema = z.object({
  type: z.literal("reservation"),
  reservation: reservationItemSchema,
  message: z.string().optional(),
});

// FAQ item
export const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

// FAQ part - displays frequently asked questions
export const faqPartSchema = z.object({
  type: z.literal("faq"),
  title: z.string().optional().default("Preguntas Frecuentes"),
  faqs: z.array(faqItemSchema),
});

// Calendar part - date selection interface
export const calendarPartSchema = z.object({
  type: z.literal("calendar"),
  title: z.string().optional().default("Seleccionar Fecha"),
  serviceId: z.string(),
  serviceName: z.string().optional(),
  minDate: z.string().optional(), // YYYY-MM-DD format
  maxDate: z.string().optional(), // YYYY-MM-DD format
  availableDates: z.array(z.string()).optional(), // Array of YYYY-MM-DD dates
});

// Patient form part - collects patient information
export const patientFormPartSchema = z.object({
  type: z.literal("patient-form"),
  title: z.string().optional().default("Datos del Paciente"),
  serviceId: z.string(),
  slotId: z.string(),
  serviceName: z.string().optional(),
  date: z.string(), // YYYY-MM-DD format
  time: z.string(), // HH:mm format
});

// Confirmation action button
export const confirmationActionSchema = z.object({
  label: z.string(),
  value: z.string(),
  variant: z
    .enum(["default", "destructive", "outline", "secondary"])
    .optional(),
});

// Confirmation part - action confirmation dialog
export const confirmationPartSchema = z.object({
  type: z.literal("confirmation"),
  title: z.string(),
  message: z.string(),
  confirmLabel: z.string().optional().default("Confirmar"),
  cancelLabel: z.string().optional().default("Cancelar"),
  action: z.string(), // Action identifier for callbacks
  data: z.record(z.string(), z.unknown()).optional(), // Additional data for the action
});

// Union of all part types
export const aiMessagePartSchema = z.union([
  textPartSchema,
  servicesPartSchema,
  availabilityPartSchema,
  reservationPartSchema,
  faqPartSchema,
  calendarPartSchema,
  patientFormPartSchema,
  confirmationPartSchema,
]);

// Complete chat response schema
export const chatResponseSchema = z.object({
  parts: z.array(aiMessagePartSchema),
});

export type TextPart = z.infer<typeof textPartSchema>;
export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type ServicesPart = z.infer<typeof servicesPartSchema>;
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
export type AvailabilityPart = z.infer<typeof availabilityPartSchema>;
export type ReservationItem = z.infer<typeof reservationItemSchema>;
export type ReservationPart = z.infer<typeof reservationPartSchema>;
export type FAQItem = z.infer<typeof faqItemSchema>;
export type FAQPart = z.infer<typeof faqPartSchema>;
export type CalendarPart = z.infer<typeof calendarPartSchema>;
export type PatientFormPart = z.infer<typeof patientFormPartSchema>;
export type ConfirmationAction = z.infer<typeof confirmationActionSchema>;
export type ConfirmationPart = z.infer<typeof confirmationPartSchema>;
export type AIMessagePart = z.infer<typeof aiMessagePartSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
