import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type PlanTier = "free" | "plus" | "pro";

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name").notNull().default(""),
  preferredIndustry: text("preferred_industry").notNull().default(""),
  strategicFocus: text("strategic_focus").notNull().default(""),
  defaultAssets: text("default_assets").notNull().default(""),
  defaultConstraints: text("default_constraints").notNull().default(""),
  plan: text("plan").notNull().default("free").$type<PlanTier>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserProfile = typeof userProfilesTable.$inferSelect;
export type UpsertUserProfile = Omit<UserProfile, "id">;
