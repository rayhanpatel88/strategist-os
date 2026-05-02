import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type PlanTier = "free" | "plus" | "pro";

export type PlanLimits = {
  goals: number;
  recurringTemplates: number;
  calendarHistoryDays: number;
  notesMax: number;
  aiPlansPerMonth: number | null;
  streakFreezes: boolean;
  weeklyScoreTrend: boolean;
  weeklyScoreWeeks: number;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    goals: 3,
    recurringTemplates: 3,
    calendarHistoryDays: 7,
    notesMax: 20,
    aiPlansPerMonth: 0,
    streakFreezes: false,
    weeklyScoreTrend: false,
    weeklyScoreWeeks: 0,
  },
  plus: {
    goals: 10,
    recurringTemplates: 10,
    calendarHistoryDays: 90,
    notesMax: 200,
    aiPlansPerMonth: 10,
    streakFreezes: true,
    weeklyScoreTrend: true,
    weeklyScoreWeeks: 4,
  },
  pro: {
    goals: Infinity,
    recurringTemplates: Infinity,
    calendarHistoryDays: Infinity,
    notesMax: Infinity,
    aiPlansPerMonth: null,
    streakFreezes: true,
    weeklyScoreTrend: true,
    weeklyScoreWeeks: 8,
  },
};

export const PLAN_NAMES: Record<PlanTier, string> = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
};

export const PLAN_PRICES: Record<PlanTier, string> = {
  free: "$0",
  plus: "$9",
  pro: "$19",
};

type PlanContextValue = {
  plan: PlanTier;
  limits: PlanLimits;
  loading: boolean;
  setPlan: (p: PlanTier) => Promise<void>;
  can: (feature: keyof PlanLimits) => boolean;
};

const PlanContext = createContext<PlanContextValue | null>(null);

const basePath = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<PlanTier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${basePath}/api/plan`)
      .then((r) => r.json())
      .then((d: { plan: PlanTier }) => { if (d.plan) setPlanState(d.plan); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setPlan = useCallback(async (p: PlanTier) => {
    setPlanState(p);
    await fetch(`${basePath}/api/plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: p }),
    });
  }, []);

  const limits = PLAN_LIMITS[plan];

  const can = useCallback((feature: keyof PlanLimits) => {
    const val = limits[feature];
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val > 0;
    return val !== null;
  }, [limits]);

  return (
    <PlanContext.Provider value={{ plan, limits, loading, setPlan, can }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
