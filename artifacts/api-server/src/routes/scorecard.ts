import { Router, type IRouter } from "express";
import { RunScorecardBody } from "@workspace/api-zod";
import { generateScorecard } from "../lib/mock-ai.js";

const router: IRouter = Router();

router.post("/scorecard", async (req, res) => {
  const parsed = RunScorecardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const result = await generateScorecard(parsed.data);
  res.json(result);
});

export default router;
