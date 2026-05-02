import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type PublicProfile = {
  displayName: string;
  strategicFocus: string;
  preferredIndustry: string;
  avgLeverageScore: number | null;
  totalDiagnoses: number;
  overallScore: number | null;
  topStrengths: { name: string; score: number }[];
};

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? "#72fe88" : pct >= 50 ? "#60a5fa" : "#ffb4ab";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="square"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

export default function StrategyCard() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`${basePath}/api/public/profile/${encodeURIComponent(userId)}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setProfile(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  const scoreColor = (s: number) => s >= 75 ? "#72fe88" : s >= 50 ? "#60a5fa" : "#ffb4ab";

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "#121317", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "Space Grotesk, sans-serif" }}>
          Loading…
        </span>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{ minHeight: "100dvh", background: "#121317", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <span style={{ fontSize: 28, marginBottom: 16 }}>—</span>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24, fontFamily: "Inter, sans-serif" }}>
          This strategy card doesn't exist yet.
        </div>
        <Link href="/">
          <button style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "#72fe88", color: "#0d0e12", border: "none", padding: "11px 28px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
            Get StrategistOS
          </button>
        </Link>
      </div>
    );
  }

  const displayName = profile.displayName || "StrategistOS User";

  return (
    <div style={{ minHeight: "100dvh", background: "#121317", color: "#e3e2e7", fontFamily: "Inter, sans-serif" }}>
      {/* Top bar */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <img src={`${basePath}/logos/logo-s-light.png`} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 13, fontWeight: 700, color: "#e3e2e7", letterSpacing: "0.01em" }}>
              StrategistOS
            </span>
          </div>
        </Link>
        <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", fontFamily: "Space Grotesk, sans-serif" }}>
          Strategy Card
        </span>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#72fe88", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, marginBottom: 12 }}>
            Strategy Profile
          </div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 32, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.1 }}>
            {displayName}
          </h1>
          {profile.preferredIndustry && (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>
              {profile.preferredIndustry}
            </div>
          )}
        </div>

        {/* Score cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
          {profile.avgLeverageScore !== null && (
            <div style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.08)", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ScoreRing score={profile.avgLeverageScore} size={88} />
                <span style={{ position: "absolute", fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: scoreColor(profile.avgLeverageScore) }}>
                  {profile.avgLeverageScore}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk, sans-serif", textAlign: "center", marginBottom: 2 }}>Avg Leverage</div>
                <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", fontFamily: "Space Grotesk, sans-serif", textAlign: "center" }}>
                  {profile.totalDiagnoses} session{profile.totalDiagnoses !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          )}
          {profile.overallScore !== null && (
            <div style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.08)", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ScoreRing score={profile.overallScore} size={88} />
                <span style={{ position: "absolute", fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: scoreColor(profile.overallScore) }}>
                  {profile.overallScore}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "Space Grotesk, sans-serif", textAlign: "center", marginBottom: 2 }}>Position Score</div>
                <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", fontFamily: "Space Grotesk, sans-serif", textAlign: "center" }}>
                  Latest scorecard
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Strategic focus */}
        {profile.strategicFocus && (
          <div style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.08)", padding: "20px 24px", marginBottom: 24, borderLeft: "2px solid #72fe88" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 8 }}>
              Strategic Focus
            </div>
            <div style={{ fontSize: 14, color: "#e3e2e7", lineHeight: 1.6 }}>
              {profile.strategicFocus}
            </div>
          </div>
        )}

        {/* Top strengths */}
        {profile.topStrengths.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 12 }}>
              Top Strengths
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {profile.topStrengths.map((s) => (
                <div key={s.name} style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.06)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#e3e2e7", fontWeight: 500 }}>{s.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 80, height: 2, background: "rgba(255,255,255,0.08)" }}>
                      <div style={{ height: 2, width: `${s.score}%`, background: scoreColor(s.score), transition: "width 0.8s ease" }} />
                    </div>
                    <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 14, fontWeight: 700, color: scoreColor(s.score), minWidth: 28, textAlign: "right" }}>
                      {s.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 20, letterSpacing: "0.04em" }}>
            Built with StrategistOS
          </div>
          <Link href={`${basePath}/sign-up`}>
            <button style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: "#72fe88", color: "#0d0e12", border: "none", padding: "12px 32px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
              Build your strategy
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
