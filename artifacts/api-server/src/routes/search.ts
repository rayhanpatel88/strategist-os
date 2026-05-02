import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { savedDiagnosesTable, savedScorecardsTable, savedOpportunitiesTable } from "@workspace/db";
import { eq, and, or, ilike } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const SearchQuery = z.object({ q: z.string().min(1).max(200) });

router.get("/search", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = SearchQuery.safeParse(req.query);
  if (!parsed.success) {
    res.json({ diagnoses: [], scorecards: [], opportunities: [] });
    return;
  }
  const q = `%${parsed.data.q}%`;

  const [diagnoses, scorecards, opportunities] = await Promise.all([
    db
      .select({
        id: savedDiagnosesTable.id,
        goal: savedDiagnosesTable.goal,
        industry: savedDiagnosesTable.industry,
        leverageScore: savedDiagnosesTable.leverageScore,
        createdAt: savedDiagnosesTable.createdAt,
      })
      .from(savedDiagnosesTable)
      .where(
        and(
          eq(savedDiagnosesTable.userId, userId),
          or(ilike(savedDiagnosesTable.goal, q), ilike(savedDiagnosesTable.industry, q))
        )
      )
      .limit(5),
    db
      .select({
        id: savedScorecardsTable.id,
        goal: savedScorecardsTable.goal,
        industry: savedScorecardsTable.industry,
        overallScore: savedScorecardsTable.overallScore,
        createdAt: savedScorecardsTable.createdAt,
      })
      .from(savedScorecardsTable)
      .where(
        and(
          eq(savedScorecardsTable.userId, userId),
          or(ilike(savedScorecardsTable.goal, q), ilike(savedScorecardsTable.industry, q))
        )
      )
      .limit(5),
    db
      .select({
        id: savedOpportunitiesTable.id,
        inputSummary: savedOpportunitiesTable.inputSummary,
        positioningAngle: savedOpportunitiesTable.positioningAngle,
        createdAt: savedOpportunitiesTable.createdAt,
      })
      .from(savedOpportunitiesTable)
      .where(
        and(
          eq(savedOpportunitiesTable.userId, userId),
          or(
            ilike(savedOpportunitiesTable.inputSummary, q),
            ilike(savedOpportunitiesTable.positioningAngle, q)
          )
        )
      )
      .limit(5),
  ]);

  res.json({
    diagnoses: diagnoses.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    scorecards: scorecards.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    opportunities: opportunities.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
});

export default router;
