import { pgTable, serial, text, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const portfolioTable = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  positioningStatement: text("positioning_statement").notNull(),
  philosophy: text("philosophy").notNull(),
  contactEmail: text("contact_email").notNull(),
  bookingUrl: text("booking_url"),
  systems: jsonb("systems").$type<Array<{ title: string; description: string; outcome: string }>>().notNull().default([]),
  caseStudies: jsonb("case_studies").$type<Array<{ title: string; challenge: string; approach: string; result: string; industry: string }>>().notNull().default([]),
});

export const insertPortfolioSchema = createInsertSchema(portfolioTable).omit({ id: true });
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolioTable.$inferSelect;
