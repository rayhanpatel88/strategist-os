import { useState } from "react";
import { useRunScorecard } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

type Dimension = { name: string; score: number; reasoning: string; howToImprove: string; eliteRecommendation: string };
type ScorecardResult = { overallScore: number; dimensions: Dimension[]; topPriority: string; strategicSummary: string };

const scoreColor = (s: number) => s >= 75 ? "var(--sos-emerald)" : s >= 50 ? "var(--sos-blue)" : "var(--sos-error)";

function HudBtn({ onClick, disabled, children, variant = "primary", "data-testid": dt }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: "primary" | "ghost"; "data-testid"?: string }) {
  if (variant === "ghost") {
    return (
      <button onClick={onClick} disabled={disabled} data-testid={dt}
        style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", opacity: disabled ? 0.4 : 1 }}>
        {children}
      </button>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} data-testid={dt}
      style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: disabled ? "var(--sos-btn-disabled-bg)" : "var(--sos-btn-bg)", border: "none", padding: "11px 24px", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif", width: "100%" }}>
      {children}
    </button>
  );
}

export default function Scorecard() {
  const [step, setStep] = useState<"form" | "result">("form");
  const [result, setResult] = useState<ScorecardResult | null>(null);
  const [form, setForm] = useState({ goal: "", industry: "", currentStatus: "" });
  const [expanded, setExpanded] = useState<number | null>(null);

  const runScorecard = useRunScorecard();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleSubmit = () => {
    if (!form.goal || !form.industry || !form.currentStatus) {
      toast({ title: "All three fields are required", variant: "destructive" });
      return;
    }
    runScorecard.mutate({ data: form }, {
      onSuccess: (data) => { setResult(data as ScorecardResult); setStep("result"); },
      onError: () => toast({ title: "Scoring failed. Please try again.", variant: "destructive" }),
    });
  };

  if (step === "result" && result) {
    const radarData = result.dimensions.map((d) => ({
      subject: d.name.split(" ")[0],
      score: d.score,
    }));

    const radarGridStroke = isDark ? "rgba(255,255,255,0.07)" : "rgba(13,14,18,0.08)";
    const radarTickFill = isDark ? "rgba(255,255,255,0.35)" : "rgba(13,14,18,0.42)";
    const radarStroke = isDark ? "#4b8eff" : "#2b6ce6";
    const tooltipBg = isDark ? "#1e1f23" : "#ffffff";
    const tooltipBorder = isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(13,14,18,0.1)";
    const svgTrack = isDark ? "rgba(255,255,255,0.06)" : "rgba(13,14,18,0.06)";

    return (
      <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
        <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
              Optimisation Scorecard
            </span>
            <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2 }}>Assessment complete</div>
          </div>
          <HudBtn variant="ghost" onClick={() => { setStep("form"); setResult(null); }} data-testid="button-new-scorecard">
            New Assessment
          </HudBtn>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Score */}
            <div className="p-6 flex flex-col items-center justify-center" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 20 }}>Overall Score</div>
              <div style={{ position: "relative", width: 120, height: 120 }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke={svgTrack} strokeWidth="6" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={scoreColor(result.overallScore)} strokeWidth="6"
                    strokeLinecap="square"
                    strokeDasharray={`${(result.overallScore / 100) * 314} 314`}
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>{result.overallScore}</span>
                  <span style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2 }}>/ 100</span>
                </div>
              </div>
            </div>

            {/* Radar */}
            <div className="p-4" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={radarGridStroke} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: radarTickFill, fontFamily: "Space Grotesk, sans-serif" }} />
                  <Radar name="Score" dataKey="score" stroke={radarStroke} fill={radarStroke} fillOpacity={0.1} />
                  <Tooltip
                    contentStyle={{ background: tooltipBg, border: tooltipBorder, borderRadius: 0, fontSize: 12 }}
                    labelStyle={{ color: "var(--sos-text)", fontSize: 11 }}
                    itemStyle={{ color: radarStroke }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 12 }}>Summary</div>
              <p style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.7 }}>{result.strategicSummary}</p>
            </div>
            <div className="p-6" style={{ background: "var(--sos-emerald-tint)", border: "1px solid var(--sos-emerald-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-emerald)", textTransform: "uppercase", marginBottom: 12 }}>Top Priority</div>
              <p style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.7 }}>{result.topPriority}</p>
            </div>
          </div>

          {/* Dimension breakdown */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 14 }}>8-Dimension Breakdown</div>
            <div className="space-y-2">
              {result.dimensions.map((dim, i) => (
                <div key={dim.name} style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", overflow: "hidden" }} data-testid={`card-dimension-${i}`}>
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full"
                    data-testid={`button-expand-dimension-${i}`}
                    style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--sos-row-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                  >
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sos-text)" }}>{dim.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div style={{ width: 120, height: 2, background: "var(--sos-track-bg)" }}>
                        <div style={{ height: 2, width: `${dim.score}%`, background: scoreColor(dim.score), transition: "width 0.8s ease" }} />
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor(dim.score), fontFamily: "Space Grotesk, sans-serif", width: 40, textAlign: "right" }}>{dim.score}</span>
                      <span style={{ fontSize: 10, color: "var(--sos-text-subtle)" }}>{expanded === i ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {expanded === i && (
                    <div style={{ padding: "16px 20px 20px", borderTop: "1px solid var(--sos-border)" }} className="space-y-4">
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Why this score</div>
                        <p style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.7 }}>{dim.reasoning}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>How to improve</div>
                        <p style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.7 }}>{dim.howToImprove}</p>
                      </div>
                      <div style={{ background: "var(--sos-blue-tint)", border: "1px solid var(--sos-blue-border)", padding: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-blue)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Recommended action</div>
                        <p style={{ fontSize: 12, color: "var(--sos-text-body)", lineHeight: 1.7 }}>{dim.eliteRecommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
      <div className="px-8 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
          Optimisation Scorecard
        </span>
        <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2 }}>Score your position across 8 dimensions. Get a ranked improvement roadmap with timelines.</div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7 max-w-2xl space-y-6">
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Goal *</div>
          <input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="State the specific goal being assessed" data-testid="input-scorecard-goal" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Industry / Domain *</div>
          <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. AI Consulting, SaaS, Academic Research" data-testid="input-scorecard-industry" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Current Position *</div>
          <textarea value={form.currentStatus} onChange={(e) => setForm({ ...form, currentStatus: e.target.value })} placeholder="Describe where you are now. What you have built, what is working, what is not, and what you have already tried." rows={5} data-testid="input-scorecard-status" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }} />
        </div>
        <div className="pt-2">
          <HudBtn onClick={handleSubmit} disabled={runScorecard.isPending} data-testid="button-run-scorecard">
            {runScorecard.isPending ? "Scoring..." : "Score Position"}
          </HudBtn>
        </div>
      </div>
    </div>
  );
}
