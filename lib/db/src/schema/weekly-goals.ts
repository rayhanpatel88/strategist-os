import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const weeklyGoalsTable = pgTable("weekly_goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  weekStart: text("week_start").notNull(),
  goal: text("goal").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("weekly_goals_user_week_unique").on(table.userId, table.weekStart),
]);

export type WeeklyGoal = typeof weeklyGoalsTable.$inferSelect;
