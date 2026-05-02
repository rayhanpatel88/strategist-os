import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RunDiagnosisBody } from "@workspace/api-zod";
import { generateDiagnosis } from "../lib/mock-ai.js";

const router: IRouter = Router();

router.post("/diagnosis", async (req, res) => {
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

  res.json(result);
});

export default router;
