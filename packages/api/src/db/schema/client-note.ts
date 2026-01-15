import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const clientNote = pgTable(
  "client_note",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull(),
    profileId: uuid("profile_id").notNull(),
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
