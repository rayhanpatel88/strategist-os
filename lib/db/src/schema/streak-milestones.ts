import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const streakMilestonesTable = pgTable("streak_milestones", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  milestone: integer("milestone").notNull(),
  achievedAt: timestamp("achieved_at").defaultNow().notNull(),
}, (table) => [
  unique("streak_milestones_user_milestone_unique").on(table.userId, table.milestone),
]);

export type StreakMilestone = typeof streakMilestonesTable.$inferSelect;
