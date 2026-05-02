import { useState } from "react";
import { useBuildOpportunityStack } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type RoadmapWeek = { week: number; focus: string; actions: string[] };
type OpportunityResult = {
  positioningAngle: string;
  bestNiche: string;
  offerIdea: string;
  contentAngle: string;
  proofAsset: string;
  roadmap30Day: RoadmapWeek[];
};

function HudBtn({ onClick, disabled, children, "data-testid": dt }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; "data-testid"?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={dt}
      style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "#121317", background: disabled ? "rgba(255,255,255,0.5)" : "#ffffff",
        border: "none", padding: "11px 24px", cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Space Grotesk, sans-serif", width: "100%",
      }}
    >
      {children}
    </button>
  );
}

export default function Opportunity() {
  const [step, setStep] = useState<"form" | "result">("form");
  const [result, setResult] = useState<OpportunityResult | null>(null);
  const [form, setForm] = useState({ skills: "", experience: "", tools: "", projects: "", targetAudience: "", desiredPath: "" });

  const build = useBuildOpportunityStack();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.skills || !form.targetAudience) {
      toast({ title: "Please fill in at least your skills and target audience", variant: "destructive" });
      return;
    }
    build.mutate(
      { data: form },
      {
        onSuccess: (data) => { setResult(data as OpportunityResult); setStep("result"); },
        onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
      }
    );
  };

  if (step === "result" && result) {
    return (
      <div className="flex flex-col h-full" style={{ background: "#121317" }}>
        <div
          className="flex items-center justify-between px-8 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#ffffff", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
            Opportunity_Stack
          </span>
          <button
            onClick={() => { setStep("form"); setResult(null); }}
            data-testid="button-new-opportunity"
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", background: "none", border: "1px solid rgba(255,255,255,0.12)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}
          >
            New Analysis
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-4">
          {/* Key positioning cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Positioning Angle", value: result.positioningAngle, highlight: true },
              { label: "Best Niche", value: result.bestNiche, highlight: false },
              { label: "Offer / Project Idea", value: result.offerIdea, highlight: false },
              { label: "Content Angle", value: result.contentAngle, highlight: false },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6"
                style={{
                  background: item.highlight ? "rgba(114,254,136,0.05)" : "#1e1f23",
                  border: item.highlight ? "1px solid rgba(114,254,136,0.18)" : "1px solid rgba(255,255,255,0.07)",
                }}
                data-testid={`card-opportunity-${i}`}
              >
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: item.highlight ? "#72fe88" : "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 10 }}>
                  {item.label}
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Proof asset — full width */}
          <div
            className="p-6"
            style={{ background: "rgba(75,142,255,0.05)", border: "1px solid rgba(75,142,255,0.18)" }}
            data-testid="card-opportunity-4"
          >
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#4b8eff", textTransform: "uppercase", marginBottom: 10 }}>
              Proof Asset to Build
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>{result.proofAsset}</p>
          </div>

          {/* 30-day roadmap */}
          <div className="p-6" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 20 }}>
              30-Day Execution Roadmap
            </div>
            <div className="grid grid-cols-4 gap-6">
              {result.roadmap30Day.map((week) => (
                <div key={week.week} data-testid={`card-roadmap-week-${week.week}`}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4b8eff", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>
                    Week {week.week}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#ffffff", marginBottom: 10, lineHeight: 1.4 }}>{week.focus}</div>
                  <ul className="space-y-2">
                    {week.actions.map((action, j) => (
                      <li key={j} className="flex gap-2" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                        <span style={{ color: "#4b8eff", flexShrink: 0 }}>→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
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
      <div
        className="px-8 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#ffffff", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
          Opportunity_Stack_Builder
        </span>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2, letterSpacing: "0.04em" }}>Input your assets. Get your sharpest positioning and 30-day roadmap.</div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7 max-w-2xl space-y-6">
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Skills *</div>
          <textarea
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="e.g. Machine learning, Python, LLM fine-tuning, data visualisation, strategic consulting"
            rows={2}
            data-testid="input-skills"
            style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Experience</div>
          <textarea
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            placeholder="e.g. MSc Data Science (ongoing), 2 years freelance web development, led university AI society"
            rows={2}
            data-testid="input-experience"
            style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Tools You Know</div>
            <input
              value={form.tools}
              onChange={(e) => setForm({ ...form, tools: e.target.value })}
              placeholder="Python, Replit, LangChain, n8n..."
              data-testid="input-tools"
              style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Current Projects</div>
            <input
              value={form.projects}
              onChange={(e) => setForm({ ...form, projects: e.target.value })}
              placeholder="e.g. AI automation SaaS, dissertation on NLP"
              data-testid="input-projects"
              style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }}
            />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Target Audience *</div>
          <input
            value={form.targetAudience}
            onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
            placeholder="e.g. Startup founders, enterprise innovation teams, MSc / PhD students"
            data-testid="input-target-audience"
            style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Desired Income or Career Path</div>
          <input
            value={form.desiredPath}
            onChange={(e) => setForm({ ...form, desiredPath: e.target.value })}
            placeholder="e.g. £5k/month consulting, PhD offer, CTO role at AI startup"
            data-testid="input-desired-path"
            style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }}
          />
        </div>

        <div className="pt-2">
          <HudBtn onClick={handleSubmit} disabled={build.isPending} data-testid="button-build-opportunity-stack">
            {build.isPending ? "Building your stack..." : "Build Opportunity Stack"}
          </HudBtn>
        </div>
      </div>
    </div>
  );
}
