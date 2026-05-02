import { Link } from "wouter";
import { useTheme } from "@/components/theme-provider";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const features = [
  { icon: "biotech", label: "Diagnosis", desc: "Find your real bottlenecks" },
  { icon: "analytics", label: "Scorecard", desc: "8-dimension positioning map" },
  { icon: "bolt", label: "Arsenal", desc: "Reusable AI prompt library" },
  { icon: "trending_up", label: "Opportunities", desc: "Demand-skill gap analysis" },
  { icon: "calendar_month", label: "Planner", desc: "7-day sprint engine" },
  { icon: "account_tree", label: "Workflows", desc: "Systemise repeatable work" },
];

export default function Landing() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--sos-bg)", color: "var(--sos-text)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: "1px solid var(--sos-border)" }}
      >
        <div className="flex items-center gap-3">
          <img
            src={isDark ? `${basePath}/logos/logo-s-light.png` : `${basePath}/logos/logo-s-dark.svg`}
            alt=""
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          <span
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--sos-text)",
              letterSpacing: "0.01em",
            }}
          >
            StrategistAI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 34, height: 34,
              background: "none",
              border: "1px solid var(--sos-border)",
              cursor: "pointer",
              color: "var(--sos-text-dim)",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-text-dim)";
              (e.currentTarget as HTMLElement).style.color = "var(--sos-text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-border)";
              (e.currentTarget as HTMLElement).style.color = "var(--sos-text-dim)";
            }}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>
          <Link href="/sign-in">
            <button
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: "Space Grotesk, sans-serif",
                color: "var(--sos-text-dim)",
                background: "none",
                border: "1px solid var(--sos-border)",
                padding: "7px 16px",
                cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-text-dim)";
                (e.currentTarget as HTMLElement).style.color = "var(--sos-text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-border)";
                (e.currentTarget as HTMLElement).style.color = "var(--sos-text-dim)";
              }}
            >
              Sign in
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:py-20">
        <div className="flex flex-col items-center text-center" style={{ maxWidth: 560 }}>
          <div
            className="flex items-center gap-2 mb-8"
            style={{
              border: "1px solid var(--sos-emerald-border)",
              background: "var(--sos-emerald-tint)",
              padding: "4px 12px",
              borderRadius: 2,
            }}
          >
            <span
              className="status-pip"
              style={{ background: "var(--sos-emerald)", width: 6, height: 6, borderRadius: "50%", display: "inline-block" }}
            />
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--sos-emerald)",
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 600,
              }}
            >
              AI Leverage Command Centre
            </span>
          </div>

          <h1
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 42,
              fontWeight: 700,
              color: "var(--sos-text)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}
          >
            Think like a strategist.
            <br />
            <span style={{ color: "var(--sos-emerald)" }}>Execute like a system.</span>
          </h1>

          <p
            style={{
              fontSize: 15,
              color: "var(--sos-text-secondary)",
              lineHeight: 1.7,
              marginBottom: 36,
              maxWidth: 480,
            }}
          >
            StrategistAI brings together diagnosis, positioning scorecards, opportunity
            mapping, and execution planning in one workspace.
          </p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link href="/sign-up">
              <button
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "var(--sos-emerald)",
                  color: "var(--sos-bg)",
                  border: "none",
                  padding: "12px 28px",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                Get started
              </button>
            </Link>
            <Link href="/sign-in">
              <button
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "none",
                  color: "var(--sos-text-dim)",
                  border: "1px solid var(--sos-border)",
                  padding: "11px 28px",
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-text-dim)";
                  (e.currentTarget as HTMLElement).style.color = "var(--sos-text)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--sos-text-dim)";
                }}
              >
                Sign in
              </button>
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-16 sm:mt-20"
          style={{ maxWidth: 640, width: "100%" }}
        >
          {features.map((f) => (
            <div
              key={f.label}
              style={{
                background: "var(--sos-surface)",
                border: "1px solid var(--sos-border)",
                padding: "16px 18px",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: "var(--sos-emerald)", marginBottom: 8, display: "block" }}
              >
                {f.icon}
              </span>
              <div
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--sos-text)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {f.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--sos-text-dim)", lineHeight: 1.5 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-8 py-4 flex items-center justify-center"
        style={{ borderTop: "1px solid var(--sos-border)" }}
      >
        <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          StrategistAI · Strategy System
        </span>
      </footer>
    </div>
  );
}
