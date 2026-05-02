import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export type ScorecardDimension = {
  name: string;
  score: number;
  reasoning: string;
  howToImprove: string;
  eliteRecommendation: string;
};

export type ScorecardResultData = {
  overallScore: number;
  dimensions: ScorecardDimension[];
  topPriority: string;
  strategicSummary: string;
};

export const savedScorecardsTable = pgTable("saved_scorecards", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  goal: text("goal").notNull().default(""),
  industry: text("industry").notNull().default(""),
  overallScore: integer("overall_score").notNull().default(0),
  result: jsonb("result").$type<ScorecardResultData>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SavedScorecard = typeof savedScorecardsTable.$inferSelect;
