import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export type GoalStatus = "Not Started" | "In Progress" | "On Track" | "At Risk" | "Complete";
export type GoalType = "monthly" | "quarterly";
export type GoalKeyResult = { id: string; text: string; done: boolean };

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").notNull().$type<GoalType>(),
  status: text("status").notNull().default("Not Started").$type<GoalStatus>(),
  progress: integer("progress").notNull().default(0),
  targetDate: text("target_date").notNull(),
  category: text("category").notNull().default(""),
  keyResults: jsonb("key_results").$type<GoalKeyResult[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Goal = typeof goalsTable.$inferSelect;
