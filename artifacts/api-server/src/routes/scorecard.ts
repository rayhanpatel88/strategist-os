import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { savedScorecardsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { RunScorecardBody } from "@workspace/api-zod";
import { generateScorecard } from "../lib/mock-ai.js";
import { z } from "zod";

const router: IRouter = Router();

router.post("/scorecard", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = RunScorecardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const result = await generateScorecard(parsed.data);

  try {
    await db.insert(savedScorecardsTable).values({
      userId,
      goal: (parsed.data.goal || "").slice(0, 200),
      industry: (parsed.data.industry || "").slice(0, 100),
      overallScore: (result as any).overallScore || 0,
      result: result as any,
    });
  } catch {
  }

  res.json(result);
});

router.get("/scorecard/history", async (req, res) => {
  const userId = (req as any).userId as string;
  const rows = await db
    .select()
    .from(savedScorecardsTable)
    .where(eq(savedScorecardsTable.userId, userId))
    .orderBy(desc(savedScorecardsTable.createdAt))
    .limit(50);
  res.json(rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

const DeleteParams = z.object({ id: z.number().int().positive() });

router.delete("/scorecard/history/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = DeleteParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db
    .delete(savedScorecardsTable)
    .where(and(
      eq(savedScorecardsTable.id, parsed.data.id),
      eq(savedScorecardsTable.userId, userId)
    ));
  res.status(204).send();
});

export default router;
