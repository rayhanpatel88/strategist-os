import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const PlanBody = z.object({
  plan: z.enum(["free", "plus", "pro"]),
});

router.get("/plan", async (req, res) => {
  const userId = (req as any).userId as string;
  const [profile] = await db
    .select({ plan: userProfilesTable.plan })
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));
  res.json({ plan: profile?.plan ?? "free" });
});

router.put("/plan", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = PlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }
  const { plan } = parsed.data;
  const [existing] = await db
    .select({ id: userProfilesTable.id })
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));
  if (existing) {
    await db
      .update(userProfilesTable)
      .set({ plan, updatedAt: new Date() })
      .where(eq(userProfilesTable.userId, userId));
  } else {
    await db.insert(userProfilesTable).values({ userId, plan });
  }
  res.json({ plan });
});

export default router;
