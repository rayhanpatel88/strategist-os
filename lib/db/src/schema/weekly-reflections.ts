import { pgTable, serial, text, timestamp, jsonb, unique } from "drizzle-orm/pg-core";

export type WeeklyReflectionData = {
  movedForward: string;
  heldBack: string;
  keyLesson: string;
  nextWeekFocus: string;
  weekScore: number | null;
};

export const weeklyReflectionsTable = pgTable("weekly_reflections", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  weekStart: text("week_start").notNull(),
  data: jsonb("data").$type<WeeklyReflectionData>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("weekly_reflections_user_week_unique").on(table.userId, table.weekStart),
]);

export type WeeklyReflection = typeof weeklyReflectionsTable.$inferSelect;
