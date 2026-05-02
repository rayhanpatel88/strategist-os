import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { savedPlansTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { CreateExecutionPlanBody, SavePlanBody } from "@workspace/api-zod";
import { generateExecutionPlan } from "../lib/mock-ai.js";

const router: IRouter = Router();

router.post("/planner", async (req, res) => {
  const parsed = CreateExecutionPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const result = await generateExecutionPlan(parsed.data);
  res.json(result);
});

router.get("/planner/saved", async (_req, res) => {
  const plans = await db.select().from(savedPlansTable).orderBy(desc(savedPlansTable.createdAt));
  res.json(plans.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/planner/saved", async (req, res) => {
  const parsed = SavePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const [plan] = await db.insert(savedPlansTable).values({
    title: parsed.data.title,
    plan: parsed.data.plan as Record<string, unknown>,
  }).returning();
  res.status(201).json({
    ...plan,
    createdAt: plan.createdAt.toISOString(),
  });
});

export default router;
