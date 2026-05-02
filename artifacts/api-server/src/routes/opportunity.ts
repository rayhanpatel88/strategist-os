import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { savedOpportunitiesTable } from "@workspace/db";
import { BuildOpportunityStackBody } from "@workspace/api-zod";
import { generateOpportunityStack } from "../lib/mock-ai.js";
import { desc, eq, and } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

router.post("/opportunity", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = BuildOpportunityStackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const result = await generateOpportunityStack(parsed.data);

  const inputSummary = [parsed.data.skills, parsed.data.targetAudience]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 200);
  const positioningAngle = (result as any).positioningAngle || "";

  try {
    await db.insert(savedOpportunitiesTable).values({
      userId,
      inputSummary,
      positioningAngle,
      result: result as any,
    });
  } catch {
  }

  res.json(result);
});

router.get("/opportunity/history", async (req, res) => {
  const userId = (req as any).userId as string;
  const rows = await db
    .select()
    .from(savedOpportunitiesTable)
    .where(eq(savedOpportunitiesTable.userId, userId))
    .orderBy(desc(savedOpportunitiesTable.createdAt))
    .limit(50);
  res.json(rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

const DeleteHistoryParams = z.object({ id: z.number().int().positive() });

router.delete("/opportunity/history/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = DeleteHistoryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db
    .delete(savedOpportunitiesTable)
    .where(and(
      eq(savedOpportunitiesTable.id, parsed.data.id),
      eq(savedOpportunitiesTable.userId, userId)
    ));
  res.status(204).send();
});

export default router;
