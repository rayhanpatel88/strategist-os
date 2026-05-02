import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  userProfilesTable,
  savedDiagnosesTable,
  savedScorecardsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/public/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId || userId.length > 200) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [profile, diagnoses, scorecards] = await Promise.all([
    db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId))
      .then((rows) => rows[0] ?? null),
    db
      .select({
        leverageScore: savedDiagnosesTable.leverageScore,
        createdAt: savedDiagnosesTable.createdAt,
      })
      .from(savedDiagnosesTable)
      .where(eq(savedDiagnosesTable.userId, userId))
      .orderBy(desc(savedDiagnosesTable.createdAt))
      .limit(20),
    db
      .select({
        overallScore: savedScorecardsTable.overallScore,
        result: savedScorecardsTable.result,
        createdAt: savedScorecardsTable.createdAt,
      })
      .from(savedScorecardsTable)
      .where(eq(savedScorecardsTable.userId, userId))
      .orderBy(desc(savedScorecardsTable.createdAt))
      .limit(1),
  ]);

  if (!profile && diagnoses.length === 0 && scorecards.length === 0) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const avgLeverageScore =
    diagnoses.length > 0
      ? Math.round(diagnoses.reduce((s, d) => s + d.leverageScore, 0) / diagnoses.length)
      : null;

  const latestScorecard = scorecards[0] ?? null;
  const topStrengths =
    latestScorecard?.result?.dimensions
      ?.slice()
      ?.sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      ?.slice(0, 3)
      ?.map((d: { name: string; score: number }) => ({ name: d.name, score: d.score })) ?? [];

  res.json({
    displayName: profile?.displayName || "",
    strategicFocus: profile?.strategicFocus || "",
    preferredIndustry: profile?.preferredIndustry || "",
    avgLeverageScore,
    totalDiagnoses: diagnoses.length,
    overallScore: latestScorecard?.overallScore ?? null,
    topStrengths,
  });
});

export default router;
