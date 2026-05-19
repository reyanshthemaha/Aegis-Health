import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const healthHistoryTable = pgTable("health_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  query: text("query").notNull(),
  summary: text("summary"),
  resultJson: jsonb("result_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
