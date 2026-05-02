import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export type OpportunityResultData = {
  positioningAngle: string;
  bestNiche: string;
  offerIdea: string;
  contentAngle: string;
  proofAsset: string;
  roadmap30Day: { week: number; focus: string; actions: string[] }[];
};

export const savedOpportunitiesTable = pgTable("saved_opportunities", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  inputSummary: text("input_summary").notNull().default(""),
  positioningAngle: text("positioning_angle").notNull().default(""),
  result: jsonb("result").$type<OpportunityResultData>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SavedOpportunity = typeof savedOpportunitiesTable.$inferSelect;
