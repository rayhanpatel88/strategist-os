import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export type DiagnosisResultData = {
  strategicDiagnosis: string;
  leverageScore: number;
  bottleneckAnalysis: string;
  opportunityMap: string[];
  riskMap: string[];
  roiActions: { action: string; impact: string; timeframe: string }[];
  eliteOperatorNextStep: string;
};

export const savedDiagnosesTable = pgTable("saved_diagnoses", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  goal: text("goal").notNull().default(""),
  industry: text("industry").notNull().default(""),
  leverageScore: integer("leverage_score").notNull().default(0),
  result: jsonb("result").$type<DiagnosisResultData>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SavedDiagnosis = typeof savedDiagnosesTable.$inferSelect;
