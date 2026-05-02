import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedPromptsTable = pgTable("saved_prompts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  prompt: text("prompt").notNull(),
  usage: text("usage").notNull(),
  variables: jsonb("variables").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSavedPromptSchema = createInsertSchema(savedPromptsTable).omit({ id: true, createdAt: true });
export type InsertSavedPrompt = z.infer<typeof insertSavedPromptSchema>;
export type SavedPrompt = typeof savedPromptsTable.$inferSelect;
