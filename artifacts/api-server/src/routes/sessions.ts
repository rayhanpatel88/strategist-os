import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sessionsTable } from "@workspace/db";
import { desc, eq, and, avg, count } from "drizzle-orm";
import {
  CreateSessionBody,
  GetSessionParams,
  DeleteSessionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sessions", async (req, res) => {
  const userId = (req as any).userId as string;
  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, userId))
    .orderBy(desc(sessionsTable.createdAt))
    .limit(50);
  res.json(sessions.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  })));
});

router.post("/sessions", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const [session] = await db.insert(sessionsTable).values({ ...parsed.data, userId }).returning();
  res.status(201).json({
    ...session,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  });
});

router.get("/sessions/summary", async (req, res) => {
  const userId = (req as any).userId as string;
  const userFilter = eq(sessionsTable.userId, userId);

  const [totals] = await db
    .select({
      totalSessions: count(),
      averageLeverageScore: avg(sessionsTable.leverageScore),
    })
    .from(sessionsTable)
    .where(userFilter);

  const recentSessions = await db
    .select()
    .from(sessionsTable)
    .where(userFilter)
    .orderBy(desc(sessionsTable.createdAt))
    .limit(5);

  const topIndustries = await db
    .select({
      industry: sessionsTable.industry,
      count: count(),
    })
    .from(sessionsTable)
    .where(userFilter)
    .groupBy(sessionsTable.industry)
    .orderBy(desc(count()))
    .limit(5);

  res.json({
    totalSessions: Number(totals.totalSessions),
    averageLeverageScore: totals.averageLeverageScore ? Number(totals.averageLeverageScore) : 0,
    recentSessions: recentSessions.map(s => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    topIndustries: topIndustries.map(t => ({
      industry: t.industry,
      count: Number(t.count),
    })),
  });
});

router.get("/sessions/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = GetSessionParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.id, parsed.data.id), eq(sessionsTable.userId, userId)));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({
    ...session,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  });
});

router.delete("/sessions/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = DeleteSessionParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db.delete(sessionsTable).where(
    and(eq(sessionsTable.id, parsed.data.id), eq(sessionsTable.userId, userId))
  );
  res.status(204).send();
});

export default router;
