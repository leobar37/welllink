/**
 * Test data for reservation E2E tests.
 * Contains reservation requests, slots, services, and patient data.
 */

/**
 * Generate a unique phone number for each test to avoid conflicts.
 */
function generateUniquePhone(): string {
  const timestamp = Date.now().toString().slice(-8);
  return `+54911${timestamp}`;
}

/**
 * Generate a unique email for each test.
 */
function generateUniqueEmail(): string {
  const timestamp = Date.now().toString().slice(-8);
  return `paciente${timestamp}@test.com`;
}

/**
 * Test medical services data.
 */
export const TEST_MEDICAL_SERVICES = [
  {
    id: "svc-consulta-general",
    name: "Consulta General",
    duration: 30,
    price: 1500,
    description: "Consulta médica general",
  },
  {
    id: "svc-consulta-seguimiento",
    name: "Consulta de Seguimiento",
    duration: 20,
    price: 1200,
    description: "Seguimiento de tratamiento",
  },
  {
    id: "svc-urgencia",
    name: "Atención de Urgencia",
    duration: 45,
    price: 2500,
    description: "Atención médica urgente",
  },
] as const;

/**
 * Test time slots data.
 */
export const TEST_TIME_SLOTS = [
  {
    id: "slot-available-1",
    profileId: "profile-test-doctor",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    status: "available" as const,
    currentReservations: 0,
    maxReservations: 1,
  },
  {
    id: "slot-available-2",
    profileId: "profile-test-doctor",
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
    status: "available" as const,
    currentReservations: 0,
    maxReservations: 2,
  },
  {
    id: "slot-pending-approval",
    profileId: "profile-test-doctor",
    startTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 72 * 60 * 60 * 1000 + 30 * 60 * 1000),
    status: "pending_approval" as const,
    currentReservations: 0,
    maxReservations: 1,
  },
  {
    id: "slot-reserved",
    profileId: "profile-test-doctor",
    startTime: new Date(Date.now() + 96 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 96 * 60 * 60 * 1000 + 30 * 60 * 1000),
    status: "reserved" as const,
    currentReservations: 1,
    maxReservations: 1,
  },
  {
    id: "slot-full",
    profileId: "profile-test-doctor",
    startTime: new Date(Date.now() + 120 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 120 * 60 * 60 * 1000 + 30 * 60 * 1000),
    status: "available" as const,
    currentReservations: 2,
    maxReservations: 2,
  },
] as const;

/**
 * Patient data for reservation requests.
 */
export const TEST_PATIENT_DATA = {
  name: "Juan Pérez",
  phone: generateUniquePhone(),
  email: generateUniqueEmail(),
  age: 35,
  gender: "male",
  chiefComplaint: "Dolor de cabeza persistente",
  symptoms: "Dolor en la frente, sensibilidad a la luz",
  medicalHistory: "Sin antecedentes relevantes",
  currentMedications: "Ninguno",
  allergies: "Penicilina",
  urgencyLevel: "normal" as const,
};

/**
 * Urgent patient data.
 */
export const TEST_URGENT_PATIENT = {
  name: "María García",
  phone: generateUniquePhone(),
  email: generateUniqueEmail(),
  age: 45,
  gender: "female",
  chiefComplaint: "Dolor torácico intenso",
  symptoms: "Dolor en el pecho, dificultad para respirar",
  medicalHistory: "Hipertensión",
  currentMedications: "Losartán 50mg",
  allergies: "Ninguna",
  urgencyLevel: "urgent" as const,
};

/**
 * High urgency patient data.
 */
export const TEST_HIGH_URGENCY_PATIENT = {
  name: "Carlos Rodríguez",
  phone: generateUniquePhone(),
  email: generateUniqueEmail(),
  age: 28,
  gender: "male",
  chiefComplaint: "Fiebre alta",
  symptoms: "39°C de temperatura, escalofríos",
  medicalHistory: "Ninguno",
  currentMedications: "Paracetamol",
  allergies: "Aspirina",
  urgencyLevel: "high" as const,
};

/**
 * Invalid data for validation tests.
 */
export const INVALID_PATIENT_DATA = {
  emptyName: {
    name: "",
    phone: generateUniquePhone(),
    email: generateUniqueEmail(),
    age: 35,
    gender: "male",
    chiefComplaint: "Dolor de cabeza",
  },
  shortPhone: {
    name: "Pedro López",
    phone: "+549",
    email: generateUniqueEmail(),
    age: 35,
    gender: "male",
    chiefComplaint: "Dolor de cabeza",
  },
  missingRequired: {
    // Missing required fields
  } as Partial<typeof TEST_PATIENT_DATA>,
};

/**
 * Reservation status for verification.
 */
export const RESERVATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
} as const;

/**
 * Slot status for verification.
 */
export const SLOT_STATUS = {
  AVAILABLE: "available",
  PENDING_APPROVAL: "pending_approval",
  RESERVED: "reserved",
  BLOCKED: "blocked",
  EXPIRED: "expired",
} as const;

/**
 * Expected API responses for verification.
 */
export const EXPECTED_API_RESPONSES = {
  SUCCESS: {
    status: 201,
    message: "Reservation request created successfully",
  },
  SLOT_NOT_FOUND: {
    status: 404,
    error: "Time slot not found",
  },
  SLOT_UNAVAILABLE: {
    status: 400,
    error: "This time slot is not available for booking",
  },
  SLOT_FULL: {
    status: 400,
    error: "This time slot is fully booked",
  },
  SERVICE_NOT_FOUND: {
    status: 404,
    error: "Medical service not found",
  },
  DUPLICATE_REQUEST: {
    status: 400,
    error: "You already have a pending request for this time slot",
  },
  APPROVAL_SUCCESS: {
    status: 200,
    message: "Reservation request approved",
  },
  REJECTION_SUCCESS: {
    status: 200,
    message: "Reservation request rejected",
  },
  INVALID_REQUEST_ID: {
    status: 404,
    error: "Reservation request not found",
  },
  ALREADY_PROCESSED: {
    status: 400,
    error: "Request is already processed",
  },
  REQUEST_EXPIRED: {
    status: 400,
    error: "Request has expired",
  },
};

/**
 * Generate random test patient data.
 */
export function generateRandomPatient(): typeof TEST_PATIENT_DATA {
  const timestamp = Date.now().toString().slice(-6);
  return {
    name: `Paciente Test ${timestamp}`,
    phone: generateUniquePhone(),
    email: generateUniqueEmail(),
    age: 25 + (parseInt(timestamp) % 50),
    gender: parseInt(timestamp) % 2 === 0 ? "male" : "female",
    chiefComplaint: "Dolor de cabeza",
    symptoms: "Síntomas leves",
    medicalHistory: "Sin antecedentes",
    currentMedications: "Ninguno",
    allergies: "Ninguna",
    urgencyLevel: "normal",
  };
}
