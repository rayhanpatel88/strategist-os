import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import type { CalendarPlanData } from "./calendar";

export type RecurringTemplateData = Omit<CalendarPlanData, "review">;

export const recurringTemplatesTable = pgTable("recurring_templates", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  days: jsonb("days").$type<number[]>().notNull(),
  data: jsonb("data").$type<RecurringTemplateData>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type RecurringTemplate = typeof recurringTemplatesTable.$inferSelect;
