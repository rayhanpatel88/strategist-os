import { useState } from "react";
import { useRunScorecard } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

type Dimension = { name: string; score: number; reasoning: string; howToImprove: string; eliteRecommendation: string };
type ScorecardResult = { overallScore: number; dimensions: Dimension[]; topPriority: string; strategicSummary: string };

const scoreColor = (s: number) => (s >= 75 ? "#72fe88" : s >= 50 ? "#4b8eff" : "#ffb4ab");

function HudBtn({ onClick, disabled, children, variant = "primary", "data-testid": dt }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: "primary" | "ghost"; "data-testid"?: string }) {
  if (variant === "ghost") {
    return (
      <button onClick={onClick} disabled={disabled} data-testid={dt}
        style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", background: "none", border: "1px solid rgba(255,255,255,0.12)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", opacity: disabled ? 0.4 : 1 }}>
        {children}
      </button>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} data-testid={dt}
      style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#121317", background: disabled ? "rgba(255,255,255,0.5)" : "#ffffff", border: "none", padding: "11px 24px", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif", width: "100%" }}>
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

  const handleSubmit = () => {
    if (!form.goal || !form.industry || !form.currentStatus) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    runScorecard.mutate({ data: form }, {
      onSuccess: (data) => { setResult(data as ScorecardResult); setStep("result"); },
      onError: () => toast({ title: "Scorecard failed", variant: "destructive" }),
    });
  };

  if (step === "result" && result) {
    const radarData = result.dimensions.map((d) => ({
      subject: d.name.split(" ")[0],
      score: d.score,
    }));

    return (
      <div className="flex flex-col h-full" style={{ background: "#121317" }}>
        <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#ffffff", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
            Optimisation_Scorecard
          </span>
          <HudBtn variant="ghost" onClick={() => { setStep("form"); setResult(null); }} data-testid="button-new-scorecard">
            New Scorecard
          </HudBtn>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-4">
          {/* Overview row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Score */}
            <div className="p-6 flex flex-col items-center justify-center" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 20 }}>Overall Score</div>
              <div style={{ position: "relative", width: 120, height: 120 }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={scoreColor(result.overallScore)} strokeWidth="6"
                    strokeLinecap="square"
                    strokeDasharray={`${(result.overallScore / 100) * 314} 314`}
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: "#ffffff", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>{result.overallScore}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>/ 100</span>
                </div>
              </div>
            </div>

            {/* Radar */}
            <div className="p-4" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)" }}>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk, sans-serif" }} />
                  <Radar name="Score" dataKey="score" stroke="#4b8eff" fill="#4b8eff" fillOpacity={0.1} />
                  <Tooltip
                    contentStyle={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, fontSize: 12 }}
                    labelStyle={{ color: "#ffffff", fontSize: 11 }}
                    itemStyle={{ color: "#4b8eff" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 12 }}>Strategic Summary</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>{result.strategicSummary}</p>
            </div>
            <div className="p-6" style={{ background: "rgba(114,254,136,0.04)", border: "1px solid rgba(114,254,136,0.16)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#72fe88", textTransform: "uppercase", marginBottom: 12 }}>Top Priority</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>{result.topPriority}</p>
            </div>
          </div>

          {/* Dimension breakdown */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 14 }}>Dimension Breakdown</div>
            <div className="space-y-2">
              {result.dimensions.map((dim, i) => (
                <div
                  key={dim.name}
                  style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}
                  data-testid={`card-dimension-${i}`}
                >
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full"
                    data-testid={`button-expand-dimension-${i}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
                      background: "none", border: "none", cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                  >
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>{dim.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div style={{ width: 120, height: 2, background: "rgba(255,255,255,0.06)" }}>
                        <div style={{ height: 2, width: `${dim.score}%`, background: scoreColor(dim.score), transition: "width 0.8s ease" }} />
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor(dim.score), fontFamily: "Space Grotesk, sans-serif", width: 40, textAlign: "right" }}>{dim.score}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{expanded === i ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {expanded === i && (
                    <div style={{ padding: "16px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.07)" }} className="space-y-4">
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Why this score</div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>{dim.reasoning}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>How to improve</div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>{dim.howToImprove}</p>
                      </div>
                      <div style={{ background: "rgba(75,142,255,0.05)", border: "1px solid rgba(75,142,255,0.16)", padding: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#4b8eff", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Recommendation</div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>{dim.eliteRecommendation}</p>
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
    <div className="flex flex-col h-full" style={{ background: "#121317" }}>
      <div className="px-8 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#ffffff", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
          Optimisation_Scorecard
        </span>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>Scored across 8 dimensions against your goal and current position.</div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7 max-w-2xl space-y-6">
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Your Goal *</div>
          <input
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            placeholder="e.g. Build a £5k/month consulting practice in AI"
            data-testid="input-scorecard-goal"
            style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Industry / Domain *</div>
          <input
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            placeholder="e.g. AI Consulting / Data Science"
            data-testid="input-scorecard-industry"
            style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Current Status *</div>
          <textarea
            value={form.currentStatus}
            onChange={(e) => setForm({ ...form, currentStatus: e.target.value })}
            placeholder="Describe where you are now: what you have built, what you are doing, what is working and what is not."
            rows={5}
            data-testid="input-scorecard-status"
            style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }}
          />
        </div>
        <div className="pt-2">
          <HudBtn onClick={handleSubmit} disabled={runScorecard.isPending} data-testid="button-run-scorecard">
            {runScorecard.isPending ? "Scoring..." : "Run Scorecard"}
          </HudBtn>
        </div>
      </div>
    </div>
  );
}
