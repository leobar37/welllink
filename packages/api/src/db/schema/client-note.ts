import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { client } from "./client";
import { profile } from "./profile";

export const clientNote = pgTable(
  "client_note",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("client_note_client_id_idx").on(table.clientId),
    index("client_note_profile_id_idx").on(table.profileId),
  ],
);

export type ClientNote = typeof clientNote.$inferSelect;
export type NewClientNote = typeof clientNote.$inferInsert;
