import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const NoteBody = z.object({
  title: z.string().max(300).default(""),
  body: z.string().max(50000).default(""),
  tags: z.array(z.string().max(50)).max(20).default([]),
  pinned: z.boolean().default(false),
  linkedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  linkedGoalId: z.number().int().positive().nullable().optional(),
  color: z.string().max(30).nullable().optional(),
});

// GET /api/notes
router.get("/notes", async (req, res) => {
  const userId = (req as any).userId as string;
  const rows = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, userId))
    .orderBy(desc(notesTable.pinned), desc(notesTable.updatedAt));
  res.json(rows);
});

// POST /api/notes
router.post("/notes", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = NoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const now = new Date();
  const [row] = await db
    .insert(notesTable)
    .values({
      userId,
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags,
      pinned: parsed.data.pinned,
      linkedDate: parsed.data.linkedDate ?? null,
      linkedGoalId: parsed.data.linkedGoalId ?? null,
      color: parsed.data.color ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  res.status(201).json(row);
});

// PUT /api/notes/:id
router.put("/notes/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = NoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const [row] = await db
    .update(notesTable)
    .set({
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags,
      pinned: parsed.data.pinned,
      linkedDate: parsed.data.linkedDate ?? null,
      linkedGoalId: parsed.data.linkedGoalId ?? null,
      color: parsed.data.color ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// DELETE /api/notes/:id
router.delete("/notes/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(notesTable).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)));
  res.json({ ok: true });
});

export default router;
