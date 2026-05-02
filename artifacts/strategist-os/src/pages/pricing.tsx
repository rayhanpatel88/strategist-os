import { useState, useEffect, useRef } from "react";
import { usePlan, type PlanTier } from "@/lib/plan-context";
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
      className="material-symbols-outlined"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 16, height: 16, flexShrink: 0, marginTop: 1, fontSize: 13,
        color: included ? "var(--sos-emerald)" : "rgba(255,255,255,0.15)",
      }}
    >
      {included ? "check_circle" : "remove"}
    </span>
  );
}

type NotifState = { show: boolean; tier: PlanTier | null; msg: string; sub: string };

function PlanNotification({ notif, onClose }: { notif: NotifState; onClose: () => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!notif.show) return;
    setExiting(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, 4500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [notif.show, notif.tier]);

  if (!notif.show) return null;

  const tierColor = notif.tier === "pro"
    ? "#f59e0b"
    : notif.tier === "plus"
    ? "#60a5fa"
    : "var(--sos-emerald)";

  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      minWidth: 280, maxWidth: 360,
      background: "var(--sos-surface)",
      border: `1px solid ${tierColor}40`,
      boxShadow: `0 0 24px ${tierColor}18, 0 8px 32px rgba(0,0,0,0.4)`,
      padding: "16px 20px",
      opacity: exiting ? 0 : 1,
      transform: exiting ? "translateY(8px)" : "translateY(0)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    }}>
      {/* Accent top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: tierColor }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
            {notif.msg}
          </div>
          <div style={{ fontSize: 11, color: "var(--sos-text-dim)" }}>{notif.sub}</div>
        </div>
        <button
          onClick={() => { setExiting(true); setTimeout(onClose, 300); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sos-text-dim)", fontSize: 16, lineHeight: 1, padding: "2px 4px", flexShrink: 0, marginTop: -2 }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function Pricing() {
  const { plan, setPlan, loading } = usePlan();
  const [saving, setSaving] = useState<PlanTier | null>(null);
  const [notif, setNotif] = useState<NotifState>({ show: false, tier: null, msg: "", sub: "" });

  const currentTierIndex = TIER_ORDER.indexOf(plan);

  async function handleSelect(tier: PlanTier) {
    if (tier === plan) return;
    setSaving(tier);
    try {
      await setPlan(tier);
      const names: Record<PlanTier, string> = { free: "Free", plus: "Plus", pro: "Pro" };
      setNotif({
        show: true,
        tier,
        msg: `Switched to ${names[tier]} plan`,
        sub: tier === "free" ? "Your limits have been adjusted." : "Your expanded access is now active.",
      });
    } catch {
      setNotif({ show: true, tier: null, msg: "Failed to update plan", sub: "Please try again." });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--sos-bg)" }}>
      <PlanNotification notif={notif} onClose={() => setNotif((n) => ({ ...n, show: false }))} />

      {/* Header */}
      <div style={{ padding: "clamp(32px,5vw,56px) clamp(16px,4vw,40px) 0", maxWidth: 1100, margin: "0 auto" }}>
        <Link href="/dashboard">
          <button style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, letterSpacing: "0.06em", marginBottom: 32 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_back</span>
            Back
          </button>
        </Link>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 10 }}>
          Plans &amp; Pricing
        </div>
        <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 12, lineHeight: 1.1 }}>
          Upgrade your plan
        </h1>
        <p style={{ fontSize: 14, color: "var(--sos-text-body)", maxWidth: 460, lineHeight: 1.65, marginBottom: 36 }}>
          Start free and scale as your strategic operating system grows. Switch tiers at any time.
        </p>

        {!loading && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 18px", border: "1px solid var(--sos-border)", background: "var(--sos-surface)", marginBottom: 44 }}>
            <span style={{ fontSize: 10, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>Current plan</span>
            <PlanBadge plan={plan} size="md" />
          </div>
        )}
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,4vw,40px) 80px" }}>
        {/* Mobile: stacked with gaps. Desktop: side-by-side. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: 16,
          }}
        >
          {PLANS.map((p, i) => {
            const isCurrent = plan === p.tier;
            const isUpgrade = TIER_ORDER.indexOf(p.tier) > currentTierIndex;

            const tierAccent =
              p.tier === "pro"
                ? { border: "rgba(251,191,36,0.3)", glow: "rgba(251,191,36,0.06)", top: "#f59e0b", shadow: "0 0 32px rgba(251,191,36,0.08)" }
                : p.tier === "plus"
                ? { border: "rgba(96,165,250,0.3)", glow: "rgba(96,165,250,0.05)", top: "#60a5fa", shadow: "0 0 32px rgba(96,165,250,0.08)" }
                : { border: "var(--sos-border)", glow: "transparent", top: "var(--sos-border)", shadow: "none" };

            return (
              <div
                key={p.tier}
                style={{
                  background: p.highlight ? `rgba(96,165,250,0.04)` : "var(--sos-surface)",
                  border: `1px solid ${tierAccent.border}`,
                  boxShadow: tierAccent.shadow,
                  padding: "clamp(24px,3vw,36px) clamp(20px,3vw,28px)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Accent top line */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: p.tier === "pro"
                    ? "linear-gradient(90deg, #b45309, #f59e0b, #fbbf24, #b45309)"
                    : p.tier === "plus"
                    ? "linear-gradient(90deg, #1d4ed8, #60a5fa, #93c5fd, #1d4ed8)"
                    : "var(--sos-border-s)",
                }} />

                {/* Popular label / spacer */}
                <div style={{ height: 28, display: "flex", alignItems: "center", marginBottom: 16 }}>
                  {p.highlight && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "#60a5fa", fontFamily: "Space Grotesk, sans-serif",
                      background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)",
                      padding: "3px 10px",
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>star</span>
                      Most popular
                    </div>
                  )}
                  {p.tier === "pro" && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "#f59e0b", fontFamily: "Space Grotesk, sans-serif",
                      background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
                      padding: "3px 10px",
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>military_tech</span>
                      Maximum output
                    </div>
                  )}
                </div>

                {/* Name + badge row */}
                <div className="flex items-center gap-3 mb-1">
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
                    {p.name}
                  </div>
                  {isCurrent && (
                    <span style={{
                      fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      fontFamily: "Space Grotesk, sans-serif",
                      color: "var(--sos-text-dim)", background: "var(--sos-surface-low)",
                      border: "1px solid var(--sos-border)", padding: "2px 7px",
                    }}>Active</span>
                  )}
                </div>

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 44, fontWeight: 800, lineHeight: 1, fontFamily: "Space Grotesk, sans-serif",
                    color: p.tier === "pro" ? "#fbbf24" : p.tier === "plus" ? "#93c5fd" : "var(--sos-text)",
                  }}>
                    {p.price}
                  </span>
                  {p.period !== "forever" && (
                    <span style={{ fontSize: 12, color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>{p.period}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--sos-text-dim)", marginBottom: 20, lineHeight: 1.5 }}>
                  {p.tagline}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSelect(p.tier)}
                  disabled={isCurrent || saving !== null}
                  style={{
                    width: "100%", padding: "12px 0", marginBottom: 28,
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                    fontFamily: "Space Grotesk, sans-serif",
                    cursor: isCurrent ? "default" : "pointer",
                    border: "none",
                    background: isCurrent
                      ? "var(--sos-surface-low)"
                      : p.tier === "pro"
                      ? "linear-gradient(135deg, #b45309, #f59e0b)"
                      : p.tier === "plus"
                      ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
                      : "rgba(255,255,255,0.06)",
                    color: isCurrent
                      ? "var(--sos-text-dim)"
                      : p.tier === "free"
                      ? "var(--sos-text)"
                      : p.tier === "pro"
                      ? "#1a0a00"
                      : "#fff",
                    opacity: saving !== null && saving !== p.tier ? 0.45 : 1,
                    transition: "opacity 0.15s, transform 0.1s",
                    boxShadow: !isCurrent && p.tier === "pro"
                      ? "0 4px 20px rgba(245,158,11,0.3)"
                      : !isCurrent && p.tier === "plus"
                      ? "0 4px 20px rgba(59,130,246,0.3)"
                      : "none",
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

                {/* Divider */}
                <div style={{ borderTop: "1px solid var(--sos-border-s)", marginBottom: 20 }} />

                {/* Feature list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {i > 0 && (
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--sos-text-dim)", letterSpacing: "0.09em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
                      {i === 1 ? "Everything in Free, plus:" : "Everything in Plus, and:"}
                    </div>
                  )}
                  {p.features.map((f) => (
                    <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <CheckIcon included={f.included} />
                      <span style={{ fontSize: 12, color: f.included ? "var(--sos-text-body)" : "rgba(255,255,255,0.25)", lineHeight: 1.4 }}>
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
        <div style={{ marginTop: 32, fontSize: 11, color: "var(--sos-text-dim)", textAlign: "center", lineHeight: 1.7 }}>
          Plan changes take effect immediately. All plans include full access to the StrategistAI core system.
          <br />
          No credit card required for the Free plan.
        </div>
      </div>
    </div>
  );
}

export function PlanBadge({ plan, size = "sm" }: { plan: PlanTier; size?: "sm" | "md" }) {
  const isLg = size === "md";

  if (plan === "pro") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: isLg ? 5 : 3,
        padding: isLg ? "4px 12px" : "2px 8px",
        fontSize: isLg ? 10 : 8,
        fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
        fontFamily: "Space Grotesk, sans-serif",
        background: "linear-gradient(135deg, #92400e, #b45309, #d97706, #b45309)",
        color: "#fff8e1",
        boxShadow: "0 0 10px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
        border: "1px solid rgba(251,191,36,0.5)",
        position: "relative",
        overflow: "hidden",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: isLg ? 11 : 9, color: "#fbbf24" }}>military_tech</span>
        PRO
      </span>
    );
  }

  if (plan === "plus") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: isLg ? 5 : 3,
        padding: isLg ? "4px 12px" : "2px 8px",
        fontSize: isLg ? 10 : 8,
        fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
        fontFamily: "Space Grotesk, sans-serif",
        background: "linear-gradient(135deg, #1e3a8a, #1d4ed8, #3b82f6)",
        color: "#dbeafe",
        boxShadow: "0 0 10px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        border: "1px solid rgba(96,165,250,0.45)",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: isLg ? 11 : 9, color: "#93c5fd" }}>electric_bolt</span>
        PLUS
      </span>
    );
  }

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: isLg ? 4 : 3,
      padding: isLg ? "4px 12px" : "2px 8px",
      fontSize: isLg ? 10 : 8,
      fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      fontFamily: "Space Grotesk, sans-serif",
      background: "rgba(255,255,255,0.04)",
      color: "var(--sos-text-dim)",
      border: "1px solid var(--sos-border)",
    }}>
      FREE
    </span>
  );
}
