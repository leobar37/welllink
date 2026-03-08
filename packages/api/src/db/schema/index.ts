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

// SERVICE & RESERVATION TABLES
export * from "./service";
export * from "./service-product";
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

// INVENTORY TABLES
export * from "./supplier";
export * from "./supplier-product";
export * from "./product-category";
export * from "./product";
export * from "./inventory-item";
export * from "./stock-movement";
export * from "./purchase-order";
export * from "./purchase-order-item";
export * from "./low-stock-alert-sent";

// AUTOMATION TABLES
export * from "./automation";
export * from "./automation-trigger";
export * from "./automation-action";
export * from "./automation-execution-log";
