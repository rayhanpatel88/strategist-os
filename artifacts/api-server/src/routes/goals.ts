import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { weeklyGoalsTable, goalsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// ── Weekly Goal ──────────────────────────────────────────────────────────────

router.get("/goals/weekly", async (req, res) => {
  const userId = (req as any).userId as string;
  const { weekStart } = req.query;
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart as string)) {
    res.status(400).json({ error: "Invalid weekStart. Use YYYY-MM-DD" });
    return;
  }
  const [row] = await db
    .select()
    .from(weeklyGoalsTable)
    .where(and(eq(weeklyGoalsTable.userId, userId), eq(weeklyGoalsTable.weekStart, weekStart as string)));
  res.json({ weekStart, goal: row?.goal ?? "" });
});

const WeeklyGoalBody = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  goal: z.string().max(500),
});

router.put("/goals/weekly", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = WeeklyGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const { weekStart, goal } = parsed.data;
  const [existing] = await db
    .select({ id: weeklyGoalsTable.id })
    .from(weeklyGoalsTable)
    .where(and(eq(weeklyGoalsTable.userId, userId), eq(weeklyGoalsTable.weekStart, weekStart)));
  if (existing) {
    await db
      .update(weeklyGoalsTable)
      .set({ goal, updatedAt: new Date() })
      .where(and(eq(weeklyGoalsTable.userId, userId), eq(weeklyGoalsTable.weekStart, weekStart)));
  } else {
    await db.insert(weeklyGoalsTable).values({ userId, weekStart, goal });
  }
  res.json({ weekStart, goal });
});

// ── Goals CRUD ───────────────────────────────────────────────────────────────

const GoalBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  type: z.enum(["monthly", "quarterly"]),
  status: z.enum(["Not Started", "In Progress", "On Track", "At Risk", "Complete"]).default("Not Started"),
  progress: z.number().int().min(0).max(100).default(0),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().max(50).default(""),
  keyResults: z.array(z.object({ id: z.string(), text: z.string(), done: z.boolean() })).default([]),
  notes: z.string().max(1000).default(""),
});

router.get("/goals", async (req, res) => {
  const userId = (req as any).userId as string;
  const { type } = req.query;
  let q = db.select().from(goalsTable).where(eq(goalsTable.userId, userId)).$dynamic();
  if (type === "monthly" || type === "quarterly") {
    q = db.select().from(goalsTable).where(and(eq(goalsTable.userId, userId), eq(goalsTable.type, type))).$dynamic();
  }
  const goals = await q.orderBy(desc(goalsTable.createdAt));
  res.json({ goals });
});

router.post("/goals", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = GoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
    return;
  }
  const [row] = await db.insert(goalsTable).values({ userId, ...parsed.data }).returning();
  res.json({ goal: row });
});

router.put("/goals/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = GoalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data" }); return; }
  const [row] = await db
    .update(goalsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Goal not found" }); return; }
  res.json({ goal: row });
});

router.delete("/goals/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(goalsTable).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)));
  res.json({ ok: true });
});

router.patch("/goals/:id/progress", async (req, res) => {
  const userId = (req as any).userId as string;
  const id = parseInt(req.params.id, 10);
  const { progress } = req.body;
  if (isNaN(id) || typeof progress !== "number" || progress < 0 || progress > 100) {
    res.status(400).json({ error: "Invalid" }); return;
  }
  await db.update(goalsTable).set({ progress, updatedAt: new Date() }).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)));
  res.json({ ok: true });
});

router.patch("/goals/:id/key-result", async (req, res) => {
  const userId = (req as any).userId as string;
  const id = parseInt(req.params.id, 10);
  const { keyResults } = req.body;
  if (isNaN(id) || !Array.isArray(keyResults)) { res.status(400).json({ error: "Invalid" }); return; }
  await db.update(goalsTable).set({ keyResults, updatedAt: new Date() }).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)));
  res.json({ ok: true });
});

export default router;
