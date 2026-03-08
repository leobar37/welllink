import { pgEnum } from "drizzle-orm/pg-core";

// Social platform enum
export const socialPlatformEnum = pgEnum("social_platform", [
  "whatsapp",
  "instagram",
  "tiktok",
  "facebook",
  "youtube",
]);

// View source enum for analytics
export const viewSourceEnum = pgEnum("view_source", ["qr", "direct_link", "referral"]);

// Payment method type enum
export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "cash",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "digital_wallet",
  "insurance",
  "payment_plan",
]);

// Product unit enum
export const productUnitEnum = pgEnum("product_unit", [
  "piece",
  "kilogram",
  "gram",
  "liter",
  "milliliter",
  "box",
  "pack",
  "tube",
  "bottle",
  "can",
]);

// Stock movement reason enum
export const stockMovementReasonEnum = pgEnum("stock_movement_reason", [
  "purchase",
  "sale",
  "damage",
  "return",
  "adjustment",
  "initial",
  "transfer",
  "expired",
]);

// Purchase order status enum
export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
  "draft",
  "sent",
  "partial",
  "received",
  "cancelled",
]);

// Payment method type
export type PaymentMethodType =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "digital_wallet"
  | "insurance"
  | "payment_plan";

// Product unit type
export type ProductUnit =
  | "piece"
  | "kilogram"
  | "gram"
  | "liter"
  | "milliliter"
  | "box"
  | "pack"
  | "tube"
  | "bottle"
  | "can";

// Stock movement reason type
export type StockMovementReason =
  | "purchase"
  | "sale"
  | "damage"
  | "return"
  | "adjustment"
  | "initial"
  | "transfer"
  | "expired";

// Purchase order status type
export type PurchaseOrderStatus =
  | "draft"
  | "sent"
  | "partial"
  | "received"
  | "cancelled";
