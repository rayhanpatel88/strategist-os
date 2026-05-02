import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { savedPromptsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  GeneratePromptBody,
  SavePromptBody,
  DeleteSavedPromptParams,
} from "@workspace/api-zod";
import { generatePrompt } from "../lib/mock-ai.js";

const router: IRouter = Router();

router.post("/prompts/generate", async (req, res) => {
  const parsed = GeneratePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const result = await generatePrompt(parsed.data);
  res.json(result);
});

router.get("/prompts/saved", async (req, res) => {
  const userId = (req as any).userId as string;
  const prompts = await db
    .select()
    .from(savedPromptsTable)
    .where(eq(savedPromptsTable.userId, userId))
    .orderBy(desc(savedPromptsTable.createdAt));
  res.json(prompts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/prompts/saved", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = SavePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const [prompt] = await db.insert(savedPromptsTable).values({ ...parsed.data, userId }).returning();
  res.status(201).json({
    ...prompt,
    createdAt: prompt.createdAt.toISOString(),
  });
});

router.delete("/prompts/saved/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = DeleteSavedPromptParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db.delete(savedPromptsTable).where(
    and(eq(savedPromptsTable.id, parsed.data.id), eq(savedPromptsTable.userId, userId))
  );
  res.status(204).send();
});

export default router;
