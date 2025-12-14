import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { campaignTemplate } from "./campaign-template";

export enum CampaignStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  SENDING = "sending",
  SENT = "sent",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export const campaign = pgTable(
  "campaign",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(() => campaignTemplate.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    objective: varchar("objective", { length: 100 }).notNull(),
    messageContent: text("message_content").notNull(),
    totalRecipients: integer("total_recipients").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    deliveredCount: integer("delivered_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    status: text("status", {
      enum: [
        CampaignStatus.DRAFT,
        CampaignStatus.SCHEDULED,
        CampaignStatus.SENDING,
        CampaignStatus.SENT,
        CampaignStatus.FAILED,
        CampaignStatus.CANCELLED,
      ],
    })
      .notNull()
      .default(CampaignStatus.DRAFT),
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("campaign_profile_id_idx").on(table.profileId),
    index("campaign_status_idx").on(table.status),
    index("campaign_scheduled_at_idx").on(table.scheduledAt),
    index("campaign_template_id_idx").on(table.templateId),
  ],
);

export type Campaign = typeof campaign.$inferSelect;
export type NewCampaign = typeof campaign.$inferInsert;
