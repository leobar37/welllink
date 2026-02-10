// Enums
export * from "./enums";

// Better Auth tables
export * from "./auth";

// Application tables
export * from "./asset";
export * from "./profile";
export * from "./profile-customization";
export * from "./social-link";
// health-survey: REMOVED - legacy wellness feature
export * from "./analytics";
// ai-recommendation: REMOVED - legacy wellness feature
export * from "./whatsapp-config";
export * from "./whatsapp-message";
export * from "./whatsapp-template";
export * from "./whatsapp-context";

// MEDICAL RESERVATION TABLES
export * from "./medical-service";
// time-slot: REMOVED - availability simplified, no pre-generated slots
export * from "./reservation-request";
export * from "./reservation";
// availability-rule: REMOVED - availability now in profile table (workDays, workStartTime, workEndTime)

// NEW TABLES
export * from "./client";
export * from "./client-note";
export * from "./campaign-template";
export * from "./campaign";
export * from "./campaign-audience";

// Relations
export * from "./relations";

// Payment Methods
export * from "./payment-method";

// Agent Configuration
export * from "./agent-config";
