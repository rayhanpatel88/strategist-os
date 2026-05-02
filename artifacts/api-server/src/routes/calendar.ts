import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { calendarPlansTable, recurringTemplatesTable, weeklyReflectionsTable, streakFreezesTable, streakMilestonesTable, type CalendarPlanData } from "@workspace/db";
import { asc, eq, and, inArray, gte } from "drizzle-orm";
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

router.get("/calendar/activity", async (req, res) => {
  const userId = (req as any).userId as string;
  const rows = await db
    .select({ date: calendarPlansTable.date, data: calendarPlansTable.data })
    .from(calendarPlansTable)
    .where(eq(calendarPlansTable.userId, userId))
    .orderBy(asc(calendarPlansTable.date));
  const activity = rows.map((row) => {
    const d = row.data as CalendarPlanData;
    return {
      date: row.date,
      score: d.review?.score ?? null,
      hasContent:
        !!(d.objective?.trim()) ||
        (d.timeBlocks?.length ?? 0) > 0 ||
        (d.tasks?.length ?? 0) > 0,
    };
  });
  res.json(activity);
});

router.get("/calendar/momentum", async (req, res) => {
  const userId = (req as any).userId as string;
  const rows = await db
    .select({ date: calendarPlansTable.date, data: calendarPlansTable.data })
    .from(calendarPlansTable)
    .where(eq(calendarPlansTable.userId, userId))
    .orderBy(asc(calendarPlansTable.date));
  const result = rows.map((row) => {
    const d = row.data as CalendarPlanData;
    const blocks = d.timeBlocks ?? [];
    const total = blocks.length;
    const completed = blocks.filter((b) => b.status === "Complete").length;
    const score = total > 0 ? Math.round((completed / total) * 100) : null;
    return { date: row.date, score, completed, total };
  });
  res.json(result);
});

router.get("/calendar/week-review", async (req, res) => {
  const userId = (req as any).userId as string;
  const { start } = req.query;
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start as string)) {
    res.status(400).json({ error: "Invalid start date. Use YYYY-MM-DD" });
    return;
  }
  const dates: string[] = [];
  const startDate = new Date(`${start as string}T00:00:00Z`);
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setUTCDate(startDate.getUTCDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  const rows = await db
    .select()
    .from(calendarPlansTable)
    .where(and(eq(calendarPlansTable.userId, userId), inArray(calendarPlansTable.date, dates)));
  const daysPlanned = rows.filter((r) => {
    const d = r.data as CalendarPlanData;
    return !!(d.objective?.trim()) || (d.timeBlocks?.length ?? 0) > 0 || (d.tasks?.length ?? 0) > 0;
  }).length;
  const scores = rows
    .map((r) => (r.data as CalendarPlanData).review?.score)
    .filter((s): s is number => s !== null && s !== undefined);
  const avgScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;
  const completedTasks = rows
    .flatMap((r) => ((r.data as CalendarPlanData).tasks ?? []).filter((t: any) => t.done).map((t: any) => t.text))
    .filter(Boolean)
    .slice(0, 5);
  res.json({ daysPlanned, avgScore, completedTasks, totalDays: 7 });
});

const FREEZES_PER_MONTH = 2;
const MILESTONE_THRESHOLDS = [3, 7, 14, 21, 30, 60, 90, 100, 365];

function monthStart(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

router.get("/calendar/streak", async (req, res) => {
  const userId = (req as any).userId as string;

  const [planRows, freezeRows, existingMilestones] = await Promise.all([
    db.select({ date: calendarPlansTable.date, data: calendarPlansTable.data })
      .from(calendarPlansTable)
      .where(eq(calendarPlansTable.userId, userId))
      .orderBy(asc(calendarPlansTable.date)),
    db.select({ date: streakFreezesTable.date, createdAt: streakFreezesTable.createdAt })
      .from(streakFreezesTable)
      .where(eq(streakFreezesTable.userId, userId)),
    db.select({ milestone: streakMilestonesTable.milestone, achievedAt: streakMilestonesTable.achievedAt })
      .from(streakMilestonesTable)
      .where(eq(streakMilestonesTable.userId, userId))
      .orderBy(asc(streakMilestonesTable.milestone)),
  ]);

  const hasContent = (d: CalendarPlanData) =>
    !!(d.objective?.trim()) || (d.timeBlocks?.length ?? 0) > 0 || (d.tasks?.length ?? 0) > 0;

  const plannedDates = new Set(
    planRows.filter((row) => hasContent(row.data as CalendarPlanData)).map((row) => row.date)
  );
  const frozenDates = new Set(freezeRows.map((r) => r.date));
  const effectiveDates = new Set([...plannedDates, ...frozenDates]);

  // Current streak: walk backwards from today (skip today if not yet planned)
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split("T")[0];
  let currentStreak = 0;
  let check = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), todayDate.getUTCDate()));
  let skippedToday = false;
  while (true) {
    const ds = check.toISOString().split("T")[0];
    if (!effectiveDates.has(ds)) {
      if (!skippedToday && ds === todayStr) {
        skippedToday = true;
        check.setUTCDate(check.getUTCDate() - 1);
        continue;
      }
      break;
    }
    currentStreak++;
    check.setUTCDate(check.getUTCDate() - 1);
  }

  // Longest streak ever
  const sorted = [...effectiveDates].sort();
  let longestStreak = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = new Date(`${sorted[i - 1]}T00:00:00Z`);
      const curr = new Date(`${sorted[i]}T00:00:00Z`);
      const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
      run = diff === 1 ? run + 1 : 1;
    }
    if (run > longestStreak) longestStreak = run;
  }

  // Freeze stats for current month
  const nowMonthStart = monthStart(todayDate);
  const freezesThisMonth = freezeRows.filter((r) => {
    const m = monthStart(new Date(r.createdAt));
    return m === nowMonthStart;
  }).length;

  // Milestone detection: find thresholds crossed that aren't yet recorded
  const existingSet = new Set(existingMilestones.map((m) => m.milestone));
  const newThresholds = MILESTONE_THRESHOLDS.filter(
    (t) => currentStreak >= t && !existingSet.has(t)
  );
  if (newThresholds.length > 0) {
    await db.insert(streakMilestonesTable)
      .values(newThresholds.map((t) => ({ userId, milestone: t })))
      .onConflictDoNothing();
  }

  // Return full milestone list (existing + newly added)
  const allMilestones = [
    ...existingMilestones,
    ...newThresholds.map((t) => ({ milestone: t, achievedAt: new Date() })),
  ].sort((a, b) => a.milestone - b.milestone);

  res.json({
    currentStreak,
    longestStreak,
    frozenDates: [...frozenDates],
    freezesUsedThisMonth: freezesThisMonth,
    freezesAllowed: FREEZES_PER_MONTH,
    newMilestones: newThresholds,
    milestones: allMilestones.map((m) => ({
      milestone: m.milestone,
      achievedAt: m.achievedAt instanceof Date ? m.achievedAt.toISOString() : m.achievedAt,
    })),
  });
});

// ── Streak Freeze ─────────────────────────────────────────────────────────────

const FreezeDateBody = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

router.post("/calendar/streak/freeze", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = FreezeDateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid date. Use YYYY-MM-DD" });
    return;
  }
  const { date } = parsed.data;
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split("T")[0];

  if (date >= todayStr) {
    res.status(400).json({ error: "Can only freeze past dates" });
    return;
  }

  // Must be within this calendar month or last (allow up to 35 days back)
  const cutoff = new Date(todayDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - 35);
  if (date < cutoff.toISOString().split("T")[0]) {
    res.status(400).json({ error: "Can only freeze dates within the last 35 days" });
    return;
  }

  // Check monthly freeze limit
  const nowMonthStart = monthStart(todayDate);
  const allFreezes = await db.select().from(streakFreezesTable).where(eq(streakFreezesTable.userId, userId));
  const usedThisMonth = allFreezes.filter((r) => monthStart(new Date(r.createdAt)) === nowMonthStart).length;
  if (usedThisMonth >= FREEZES_PER_MONTH) {
    res.status(400).json({ error: `Monthly freeze limit of ${FREEZES_PER_MONTH} reached` });
    return;
  }

  // Check already frozen
  const alreadyFrozen = allFreezes.find((r) => r.date === date);
  if (alreadyFrozen) {
    res.status(400).json({ error: "Date is already frozen" });
    return;
  }

  // Check if the day already has content (no need to freeze)
  const [existing] = await db
    .select({ data: calendarPlansTable.data })
    .from(calendarPlansTable)
    .where(and(eq(calendarPlansTable.userId, userId), eq(calendarPlansTable.date, date)));
  if (existing) {
    const d = existing.data as CalendarPlanData;
    const hasContent = !!(d.objective?.trim()) || (d.timeBlocks?.length ?? 0) > 0 || (d.tasks?.length ?? 0) > 0;
    if (hasContent) {
      res.status(400).json({ error: "Date already has a plan — no freeze needed" });
      return;
    }
  }

  await db.insert(streakFreezesTable).values({ userId, date });
  res.json({ ok: true, date, freezesUsedThisMonth: usedThisMonth + 1, freezesAllowed: FREEZES_PER_MONTH });
});

router.delete("/calendar/streak/freeze/:date", async (req, res) => {
  const userId = (req as any).userId as string;
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }
  await db.delete(streakFreezesTable).where(and(eq(streakFreezesTable.userId, userId), eq(streakFreezesTable.date, date)));
  res.json({ ok: true });
});

// ── Weekly Review ────────────────────────────────────────────────────────────

router.get("/calendar/weekly-review", async (req, res) => {
  const userId = (req as any).userId as string;
  const { start } = req.query;
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start as string)) {
    res.status(400).json({ error: "Invalid start date. Use YYYY-MM-DD" });
    return;
  }
  const dates: string[] = [];
  const startDate = new Date(`${start as string}T00:00:00Z`);
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setUTCDate(startDate.getUTCDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  const rows = await db
    .select()
    .from(calendarPlansTable)
    .where(and(eq(calendarPlansTable.userId, userId), inArray(calendarPlansTable.date, dates)));
  const plansByDate = new Map(rows.map((r) => [r.date, r.data as CalendarPlanData]));
  const days = dates.map((date) => {
    const d = plansByDate.get(date);
    if (!d) return { date, planned: false, blocksTotal: 0, blocksCompleted: 0, momentumScore: null, tasksTotal: 0, tasksDone: 0, dayScore: null };
    const blocks = d.timeBlocks ?? [];
    const tasks = d.tasks ?? [];
    const blocksTotal = blocks.length;
    const blocksCompleted = blocks.filter((b) => b.status === "Complete").length;
    const momentumScore = blocksTotal > 0 ? Math.round((blocksCompleted / blocksTotal) * 100) : null;
    const tasksTotal = tasks.length;
    const tasksDone = tasks.filter((t) => t.status === "Done").length;
    const dayScore = d.review?.score ?? null;
    const planned = !!(d.objective?.trim()) || blocksTotal > 0 || tasksTotal > 0;
    return { date, planned, blocksTotal, blocksCompleted, momentumScore, tasksTotal, tasksDone, dayScore };
  });
  const scores = days.map((d) => d.dayScore).filter((s): s is number => s !== null);
  const avgDayScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
  const momentums = days.map((d) => d.momentumScore).filter((m): m is number => m !== null);
  const avgMomentum = momentums.length > 0 ? Math.round(momentums.reduce((a, b) => a + b, 0) / momentums.length) : null;
  const [reflection] = await db
    .select()
    .from(weeklyReflectionsTable)
    .where(and(eq(weeklyReflectionsTable.userId, userId), eq(weeklyReflectionsTable.weekStart, start as string)));
  res.json({
    days,
    summary: {
      daysPlanned: days.filter((d) => d.planned).length,
      avgDayScore,
      avgMomentum,
      totalBlocks: days.reduce((a, d) => a + d.blocksTotal, 0),
      completedBlocks: days.reduce((a, d) => a + d.blocksCompleted, 0),
      totalTasks: days.reduce((a, d) => a + d.tasksTotal, 0),
      doneTasks: days.reduce((a, d) => a + d.tasksDone, 0),
    },
    reflection: reflection?.data ?? null,
  });
});

router.put("/calendar/weekly-reflection", async (req, res) => {
  const userId = (req as any).userId as string;
  const { weekStart, data } = req.body;
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    res.status(400).json({ error: "Invalid weekStart" });
    return;
  }
  const [existing] = await db
    .select({ id: weeklyReflectionsTable.id })
    .from(weeklyReflectionsTable)
    .where(and(eq(weeklyReflectionsTable.userId, userId), eq(weeklyReflectionsTable.weekStart, weekStart)));
  if (existing) {
    await db
      .update(weeklyReflectionsTable)
      .set({ data, updatedAt: new Date() })
      .where(and(eq(weeklyReflectionsTable.userId, userId), eq(weeklyReflectionsTable.weekStart, weekStart)));
  } else {
    await db.insert(weeklyReflectionsTable).values({ userId, weekStart, data });
  }
  res.json({ ok: true });
});

// ── Recurring Templates ─────────────────────────────────────────────────────

router.get("/calendar/recurring-templates", async (req, res) => {
  const userId = (req as any).userId as string;
  const rows = await db
    .select()
    .from(recurringTemplatesTable)
    .where(eq(recurringTemplatesTable.userId, userId));
  res.json(rows);
});

const RecurringTemplateBody = z.object({
  name: z.string().min(1),
  days: z.array(z.number().int().min(0).max(6)).min(1),
  data: z.record(z.any()),
});

router.post("/calendar/recurring-templates", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = RecurringTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const [row] = await db
    .insert(recurringTemplatesTable)
    .values({ userId, name: parsed.data.name, days: parsed.data.days, data: parsed.data.data as any })
    .returning();
  res.json(row);
});

router.delete("/calendar/recurring-templates/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db
    .delete(recurringTemplatesTable)
    .where(and(eq(recurringTemplatesTable.id, id), eq(recurringTemplatesTable.userId, userId)));
  res.json({ ok: true });
});

// ── AI Plan ──────────────────────────────────────────────────────────────────

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

// ── Calendar Day — MUST be last so specific paths above aren't swallowed ─────

router.get("/calendar/:date", async (req, res) => {
  const userId = (req as any).userId as string;
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    return;
  }
  const [row] = await db
    .select()
    .from(calendarPlansTable)
    .where(and(eq(calendarPlansTable.userId, userId), eq(calendarPlansTable.date, date)));
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
  const userId = (req as any).userId as string;
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
  const [existing] = await db
    .select({ id: calendarPlansTable.id })
    .from(calendarPlansTable)
    .where(and(eq(calendarPlansTable.userId, userId), eq(calendarPlansTable.date, date)));
  if (existing) {
    await db
      .update(calendarPlansTable)
      .set({ data, updatedAt: new Date() })
      .where(and(eq(calendarPlansTable.userId, userId), eq(calendarPlansTable.date, date)));
  } else {
    await db.insert(calendarPlansTable).values({ date, data, userId });
  }
  res.json({ date, data });
});

export default router;
