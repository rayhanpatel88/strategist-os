import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { calendarPlansTable, type CalendarPlanData } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateDailyPlan } from "../lib/mock-ai.js";

const router: IRouter = Router();

const emptyPlan = (): CalendarPlanData => ({
  objective: "",
  priorities: ["", "", ""],
  notes: "",
  timeBlocks: [],
  tasks: [],
  review: {
    movedForward: "",
    delayed: "",
    friction: "",
    changes: "",
    score: null,
  },
});

router.get("/calendar/:date", async (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    return;
  }
  const [row] = await db.select().from(calendarPlansTable).where(eq(calendarPlansTable.date, date));
  if (!row) {
    res.json({ date, data: emptyPlan() });
    return;
  }
  res.json({ date: row.date, data: row.data });
});

const CalendarPlanBody = z.object({
  objective: z.string().default(""),
  priorities: z.array(z.string()).default(["", "", ""]),
  notes: z.string().default(""),
  timeBlocks: z.array(z.object({
    id: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    activity: z.string(),
    category: z.string(),
    priority: z.string(),
    status: z.string(),
  })).default([]),
  tasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    priority: z.string(),
    estimatedDuration: z.string(),
    dueTime: z.string(),
    linkedGoal: z.string(),
    status: z.string(),
  })).default([]),
  review: z.object({
    movedForward: z.string().default(""),
    delayed: z.string().default(""),
    friction: z.string().default(""),
    changes: z.string().default(""),
    score: z.number().nullable().default(null),
  }).default({}),
});

router.put("/calendar/:date", async (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    return;
  }
  const parsed = CalendarPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const data = parsed.data as CalendarPlanData;
  const [existing] = await db.select({ id: calendarPlansTable.id }).from(calendarPlansTable).where(eq(calendarPlansTable.date, date));
  if (existing) {
    await db.update(calendarPlansTable).set({ data, updatedAt: new Date() }).where(eq(calendarPlansTable.date, date));
  } else {
    await db.insert(calendarPlansTable).values({ date, data });
  }
  res.json({ date, data });
});

const AiPlanBody = z.object({
  goal: z.string().min(1),
  hoursAvailable: z.number().min(1).max(24).default(8),
  mustComplete: z.string().default(""),
  avoid: z.string().default(""),
});

router.post("/calendar/ai-plan", async (req, res) => {
  const parsed = AiPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const result = await generateDailyPlan(parsed.data);
  res.json(result);
});

export default router;
