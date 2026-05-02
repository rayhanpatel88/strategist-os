import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedPlansTable = pgTable("saved_plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  title: text("title").notNull(),
  plan: jsonb("plan").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSavedPlanSchema = createInsertSchema(savedPlansTable).omit({ id: true, createdAt: true });
export type InsertSavedPlan = z.infer<typeof insertSavedPlanSchema>;
export type SavedPlan = typeof savedPlansTable.$inferSelect;
