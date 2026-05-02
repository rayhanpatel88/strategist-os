import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const streakFreezesTable = pgTable("streak_freezes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("streak_freezes_user_date_unique").on(table.userId, table.date),
]);

export type StreakFreeze = typeof streakFreezesTable.$inferSelect;
