import { pgTable, serial, text, timestamp, jsonb, unique } from "drizzle-orm/pg-core";

export type CalendarTimeBlock = {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  category: string;
  priority: string;
  status: string;
};

export type CalendarTask = {
  id: string;
  name: string;
  priority: string;
  estimatedDuration: string;
  dueTime: string;
  linkedGoal: string;
  status: string;
};

export type CalendarReview = {
  movedForward: string;
  delayed: string;
  friction: string;
  changes: string;
  score: number | null;
};

export type CalendarPlanData = {
  objective: string;
  priorities: string[];
  notes: string;
  timeBlocks: CalendarTimeBlock[];
  tasks: CalendarTask[];
  review: CalendarReview;
};

export const calendarPlansTable = pgTable("calendar_plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  date: text("date").notNull(),
  data: jsonb("data").$type<CalendarPlanData>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("calendar_plans_user_date_unique").on(table.userId, table.date),
]);

export type CalendarPlan = typeof calendarPlansTable.$inferSelect;
