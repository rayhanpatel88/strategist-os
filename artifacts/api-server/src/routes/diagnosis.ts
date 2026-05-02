import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sessionsTable, savedDiagnosesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { RunDiagnosisBody } from "@workspace/api-zod";
import { generateDiagnosis } from "../lib/mock-ai.js";
import { z } from "zod";

const router: IRouter = Router();

router.post("/diagnosis", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = RunDiagnosisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const result = await generateDiagnosis(parsed.data);

  if (parsed.data.sessionId) {
    await db
      .update(sessionsTable)
      .set({
        diagnosisResult: result as Record<string, unknown>,
        leverageScore: (result as { leverageScore: number }).leverageScore,
        updatedAt: new Date(),
      })
      .where(eq(sessionsTable.id, parsed.data.sessionId));
  }

  try {
    await db.insert(savedDiagnosesTable).values({
      userId,
      goal: (parsed.data.goal || "").slice(0, 200),
      industry: (parsed.data.industry || "").slice(0, 100),
      leverageScore: (result as any).leverageScore || 0,
      result: result as any,
    });
  } catch {
  }

  res.json(result);
});

router.get("/diagnosis/history", async (req, res) => {
  const userId = (req as any).userId as string;
  const rows = await db
    .select()
    .from(savedDiagnosesTable)
    .where(eq(savedDiagnosesTable.userId, userId))
    .orderBy(desc(savedDiagnosesTable.createdAt))
    .limit(50);
  res.json(rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

const DeleteParams = z.object({ id: z.number().int().positive() });

router.delete("/diagnosis/history/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = DeleteParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db
    .delete(savedDiagnosesTable)
    .where(and(
      eq(savedDiagnosesTable.id, parsed.data.id),
      eq(savedDiagnosesTable.userId, userId)
    ));
  res.status(204).send();
});

export default router;
