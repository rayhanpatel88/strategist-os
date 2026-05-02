import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const UpsertProfileBody = z.object({
  displayName: z.string().max(120).default(""),
  preferredIndustry: z.string().max(120).default(""),
  strategicFocus: z.string().max(500).default(""),
  defaultAssets: z.string().max(1000).default(""),
  defaultConstraints: z.string().max(500).default(""),
});

router.get("/settings", async (req, res) => {
  const userId = (req as any).userId as string;
  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));
  if (!profile) {
    res.json({
      userId,
      displayName: "",
      preferredIndustry: "",
      strategicFocus: "",
      defaultAssets: "",
      defaultConstraints: "",
    });
    return;
  }
  res.json({
    ...profile,
    updatedAt: profile.updatedAt.toISOString(),
  });
});

router.put("/settings", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = UpsertProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const [existing] = await db
    .select({ id: userProfilesTable.id })
    .from(userProfilesTable)
    .where(eq(userProfilesTable.userId, userId));

  let profile;
  if (existing) {
    [profile] = await db
      .update(userProfilesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(userProfilesTable.userId, userId))
      .returning();
  } else {
    [profile] = await db
      .insert(userProfilesTable)
      .values({ userId, ...parsed.data })
      .returning();
  }
  res.json({
    ...profile,
    updatedAt: profile.updatedAt.toISOString(),
  });
});

export default router;
