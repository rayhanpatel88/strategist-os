import { Router, type IRouter } from "express";
import { BuildOpportunityStackBody } from "@workspace/api-zod";
import { generateOpportunityStack } from "../lib/mock-ai.js";

const router: IRouter = Router();

router.post("/opportunity", async (req, res) => {
  const parsed = BuildOpportunityStackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const result = await generateOpportunityStack(parsed.data);
  res.json(result);
});

export default router;
