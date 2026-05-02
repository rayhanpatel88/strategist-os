import { pgTable, serial, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workflowsTable = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  trigger: text("trigger").notNull(),
  inputs: jsonb("inputs").$type<string[]>().notNull().default([]),
  aiTask: text("ai_task").notNull(),
  tools: jsonb("tools").$type<string[]>().notNull().default([]),
  output: text("output").notNull(),
  humanReviewStep: text("human_review_step").notNull(),
  monetisationUseCase: text("monetisation_use_case").notNull(),
  isTemplate: boolean("is_template").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkflowSchema = createInsertSchema(workflowsTable).omit({ id: true, createdAt: true });
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflowsTable.$inferSelect;
