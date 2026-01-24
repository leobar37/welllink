import { pgEnum } from "drizzle-orm/pg-core";

export const socialPlatformEnum = pgEnum("social_platform", [
  "whatsapp",
  "instagram",
  "tiktok",
  "facebook",
  "youtube",
]);

export const viewSourceEnum = pgEnum("view_source", [
  "qr",
  "direct_link",
  "referral",
]);

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "cash",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "digital_wallet",
  "insurance",
  "payment_plan",
]);

export type PaymentMethodType =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "digital_wallet"
  | "insurance"
  | "payment_plan";
