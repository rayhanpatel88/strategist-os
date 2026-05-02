import { useState } from "react";
import { usePlan, PLAN_LIMITS, type PlanTier } from "@/lib/plan-context";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const PLANS: {
  tier: PlanTier;
  name: string;
  price: string;
  period: string;
  tagline: string;
  highlight: boolean;
  features: { text: string; included: boolean }[];
}[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Get started with the essentials",
    highlight: false,
    features: [
      { text: "7 days of calendar history", included: true },
      { text: "3 active goals", included: true },
      { text: "3 recurring templates", included: true },
      { text: "20 notes", included: true },
      { text: "Daily planning & review", included: true },
      { text: "Streak tracking", included: true },
      { text: "AI plan generation", included: false },
      { text: "Streak freezes", included: false },
      { text: "Weekly score trend", included: false },
      { text: "Goals calendar integration", included: false },
    ],
  },
  {
    tier: "plus",
    name: "Plus",
    price: "$9",
    period: "/ month",
    tagline: "For strategists building consistency",
    highlight: true,
    features: [
      { text: "90 days of calendar history", included: true },
      { text: "10 active goals", included: true },
      { text: "10 recurring templates", included: true },
      { text: "200 notes", included: true },
      { text: "Daily planning & review", included: true },
      { text: "Streak tracking", included: true },
      { text: "10 AI plan generations/month", included: true },
      { text: "Streak freezes (2/month)", included: true },
      { text: "4-week score trend", included: true },
      { text: "Goals calendar integration", included: true },
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$19",
    period: "/ month",
    tagline: "Maximize your strategic output",
    highlight: false,
    features: [
      { text: "Unlimited calendar history", included: true },
      { text: "Unlimited active goals", included: true },
      { text: "Unlimited recurring templates", included: true },
      { text: "Unlimited notes", included: true },
      { text: "Daily planning & review", included: true },
      { text: "Streak tracking", included: true },
      { text: "Unlimited AI plan generations", included: true },
      { text: "Streak freezes (5/month)", included: true },
      { text: "8-week score trend", included: true },
      { text: "Goals calendar integration", included: true },
    ],
  },
];

const TIER_ORDER: PlanTier[] = ["free", "plus", "pro"];

function CheckIcon({ included }: { included: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 16, height: 16, flexShrink: 0, marginTop: 1,
        color: included ? "var(--sos-emerald)" : "var(--sos-text-dim)",
        fontSize: 13,
      }}
      className="material-symbols-outlined"
    >
      {included ? "check_circle" : "cancel"}
    </span>
  );
}

export default function Pricing() {
  const { plan, setPlan, loading } = usePlan();
  const { toast } = useToast();
  const [saving, setSaving] = useState<PlanTier | null>(null);
  const basePath = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

  async function handleSelect(tier: PlanTier) {
    if (tier === plan) return;
    setSaving(tier);
    try {
      await setPlan(tier);
      toast({
        title: `Switched to ${tier === "free" ? "Free" : tier === "plus" ? "Plus" : "Pro"} plan`,
        description: tier === "free" ? "Your limits have been adjusted." : "Enjoy your expanded access.",
      });
    } catch {
      toast({ title: "Failed to update plan", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  const currentTierIndex = TIER_ORDER.indexOf(plan);

  return (
    <div style={{ minHeight: "100vh", background: "var(--sos-bg)", padding: "0" }}>
      {/* Header */}
      <div style={{ padding: "48px 32px 0", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ marginBottom: 8 }}>
          <Link href="/dashboard">
            <button style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, letterSpacing: "0.06em" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_back</span>
              Back
            </button>
          </Link>
        </div>
        <div style={{ marginTop: 32, marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>
          Plans &amp; Pricing
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 10, lineHeight: 1.15 }}>
          Upgrade your plan
        </h1>
        <p style={{ fontSize: 14, color: "var(--sos-text-body)", maxWidth: 480, lineHeight: 1.6, marginBottom: 40 }}>
          Start free and scale as your strategic operating system grows. Upgrade or downgrade at any time.
        </p>

        {/* Current plan notice */}
        {!loading && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "1px solid var(--sos-border)", background: "var(--sos-surface)", marginBottom: 40 }}>
            <span style={{ fontSize: 10, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>Current plan:</span>
            <PlanBadge plan={plan} />
          </div>
        )}
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px 80px" }}>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 1, background: "var(--sos-border)" }}>
          {PLANS.map((p, i) => {
            const isCurrent = plan === p.tier;
            const isUpgrade = TIER_ORDER.indexOf(p.tier) > currentTierIndex;
            const isDowngrade = TIER_ORDER.indexOf(p.tier) < currentTierIndex;
            const _ = isDowngrade;
            void _;

            return (
              <div
                key={p.tier}
                style={{
                  background: p.highlight ? "rgba(114,254,136,0.04)" : "var(--sos-surface)",
                  padding: "36px 28px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  outline: p.highlight ? "1px solid rgba(114,254,136,0.2)" : "none",
                  outlineOffset: -1,
                }}
              >
                {p.highlight && (
                  <div style={{
                    position: "absolute", top: -1, left: 28, right: 28,
                    height: 2, background: "linear-gradient(90deg, transparent, var(--sos-emerald), transparent)",
                  }} />
                )}

                {/* Tier label */}
                {p.highlight && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "var(--sos-emerald)", fontFamily: "Space Grotesk, sans-serif",
                    marginBottom: 12,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 11 }}>star</span>
                    Most popular
                  </div>
                )}
                {!p.highlight && <div style={{ marginBottom: 12, height: 21 }} />}

                {/* Name */}
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
                  {p.name}
                </div>

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
                    {p.price}
                  </span>
                  {p.period !== "forever" && (
                    <span style={{ fontSize: 12, color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>{p.period}</span>
                  )}
                </div>
                {p.period === "forever" && (
                  <div style={{ fontSize: 11, color: "var(--sos-text-dim)", marginBottom: 8 }}>Free forever</div>
                )}

                <div style={{ fontSize: 12, color: "var(--sos-text-body)", marginBottom: 28, lineHeight: 1.5 }}>
                  {p.tagline}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSelect(p.tier)}
                  disabled={isCurrent || saving !== null}
                  style={{
                    width: "100%", padding: "11px 0", marginBottom: 28,
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    fontFamily: "Space Grotesk, sans-serif", cursor: isCurrent ? "default" : "pointer",
                    border: isCurrent ? "1px solid var(--sos-border)" : p.highlight ? "none" : "1px solid var(--sos-text-dim)",
                    background: isCurrent
                      ? "var(--sos-surface-low)"
                      : p.highlight
                      ? "var(--sos-emerald)"
                      : "transparent",
                    color: isCurrent
                      ? "var(--sos-text-dim)"
                      : p.highlight
                      ? "#0a0b0e"
                      : "var(--sos-text)",
                    opacity: saving !== null && saving !== p.tier ? 0.5 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {saving === p.tier
                    ? "Updating..."
                    : isCurrent
                    ? "Your current plan"
                    : isUpgrade
                    ? `Upgrade to ${p.name}`
                    : `Switch to ${p.name}`}
                </button>

                {/* Feature list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {i > 0 && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
                      {i === 1 ? "Everything in Free, plus:" : "Everything in Plus, and:"}
                    </div>
                  )}
                  {p.features.map((f) => (
                    <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckIcon included={f.included} />
                      <span style={{ fontSize: 12, color: f.included ? "var(--sos-text-body)" : "var(--sos-text-dim)", lineHeight: 1.4 }}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 24, fontSize: 11, color: "var(--sos-text-dim)", textAlign: "center", lineHeight: 1.6 }}>
          Plan changes take effect immediately. All plans include full access to the StrategistAI core system.
          <br />
          No credit card required for the Free plan.
        </div>
      </div>
    </div>
  );
}

export function PlanBadge({ plan }: { plan: PlanTier }) {
  const colors: Record<PlanTier, { bg: string; border: string; color: string }> = {
    free: { bg: "transparent", border: "var(--sos-border)", color: "var(--sos-text-dim)" },
    plus: { bg: "rgba(147,197,253,0.1)", border: "rgba(147,197,253,0.3)", color: "#93c5fd" },
    pro: { bg: "rgba(114,254,136,0.08)", border: "rgba(114,254,136,0.3)", color: "var(--sos-emerald)" },
  };
  const c = colors[plan];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 8px",
      fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      fontFamily: "Space Grotesk, sans-serif",
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
    }}>
      {plan === "pro" && <span className="material-symbols-outlined" style={{ fontSize: 9 }}>star</span>}
      {plan.toUpperCase()}
    </span>
  );
}
