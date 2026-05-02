import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { weeklyGoalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

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

export default router;
