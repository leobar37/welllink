import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profile } from "./profile";
import { campaign } from "./campaign";
import { client } from "./client";
import { whatsappMessage } from "./whatsapp-message";

export enum CampaignAudienceStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
}

export const campaignAudience = pgTable(
  "campaign_audience",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaign.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    whatsappMessageId: uuid("whatsapp_message_id").references(
      () => whatsappMessage.id,
      { onDelete: "set null" },
    ),
    status: text("status", {
      enum: [
        CampaignAudienceStatus.PENDING,
        CampaignAudienceStatus.SENT,
        CampaignAudienceStatus.DELIVERED,
        CampaignAudienceStatus.FAILED,
      ],
    })
      .notNull()
      .default(CampaignAudienceStatus.PENDING),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("campaign_audience_profile_id_idx").on(table.profileId),
    index("campaign_audience_campaign_id_idx").on(table.campaignId),
    index("campaign_audience_client_id_idx").on(table.clientId),
    index("campaign_audience_status_idx").on(table.status),
    index("campaign_audience_whatsapp_message_id_idx").on(
      table.whatsappMessageId,
    ),
    uniqueIndex("campaign_audience_campaign_client_idx").on(
      table.campaignId,
      table.clientId,
    ),
  ],
);

export type CampaignAudience = typeof campaignAudience.$inferSelect;
export type NewCampaignAudience = typeof campaignAudience.$inferInsert;
