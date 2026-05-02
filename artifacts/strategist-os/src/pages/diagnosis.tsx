import { useState } from "react";
import { useRunDiagnosis, useCreateSession, getListSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type DiagnosisResult = {
  strategicDiagnosis: string;
  leverageScore: number;
  bottleneckAnalysis: string;
  opportunityMap: string[];
  riskMap: string[];
  roiActions: { action: string; impact: string; timeframe: string }[];
  eliteOperatorNextStep: string;
};

function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between px-8 py-4 shrink-0"
      style={{ borderBottom: "1px solid var(--sos-border)" }}
    >
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
          {title}
        </span>
        {sub && <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2, letterSpacing: "0.04em" }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase" }}>{label}</div>
      {children}
    </div>
  );
}

function HudInput({ id, value, onChange, placeholder, "data-testid": dt }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; "data-testid"?: string }) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid={dt}
      style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }}
    />
  );
}

function HudTextarea({ id, value, onChange, placeholder, rows = 3, "data-testid": dt }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; "data-testid"?: string }) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      data-testid={dt}
      style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }}
    />
  );
}

function HudBtn({ onClick, disabled, children, variant = "primary", "data-testid": dt }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: "primary" | "ghost"; "data-testid"?: string }) {
  if (variant === "ghost") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        data-testid={dt}
        style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)",
          padding: "8px 16px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={dt}
      style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--sos-btn-text)", background: disabled ? "var(--sos-btn-disabled-bg)" : "var(--sos-btn-bg)",
        border: "none", padding: "11px 24px", cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Space Grotesk, sans-serif", width: "100%",
        transition: "background 0.1s",
      }}
    >
      {children}
    </button>
  );
}

export default function Diagnosis() {
  const [step, setStep] = useState<"form" | "result">("form");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [form, setForm] = useState({
    goal: "", industry: "", assets: "", constraints: "", deadline: "", desiredOutcome: "", bottleneck: "",
  });

  const runDiagnosis = useRunDiagnosis();
  const createSession = useCreateSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.goal || !form.industry) {
      toast({ title: "Required fields missing", description: "Please fill in at least your goal and industry.", variant: "destructive" });
      return;
    }
    runDiagnosis.mutate(
      { data: form },
      {
        onSuccess: (data) => {
          setResult(data as DiagnosisResult);
          setStep("result");
          createSession.mutate(
            { data: { title: form.goal.substring(0, 60), goal: form.goal, industry: form.industry } },
            { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() }) }
          );
        },
        onError: () => toast({ title: "Analysis failed", description: "Could not run diagnosis. Please try again.", variant: "destructive" }),
      }
    );
  };

  if (step === "result" && result) {
    const scoreColor = result.leverageScore >= 75 ? "var(--sos-emerald)" : result.leverageScore >= 50 ? "var(--sos-blue)" : "var(--sos-error)";
    return (
      <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
        <PageHeader
          title="Strategic Diagnosis"
          sub="Analysis complete"
          right={
            <HudBtn variant="ghost" onClick={() => { setStep("form"); setResult(null); }} data-testid="button-new-diagnosis">
              New Diagnosis
            </HudBtn>
          }
        />

        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-4">
          {/* Leverage score bar */}
          <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
            <div className="flex items-end justify-between mb-4">
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Leverage Score</div>
                <div style={{ fontSize: 44, fontWeight: 700, color: scoreColor, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
                  {result.leverageScore}
                  <span style={{ fontSize: 16, color: "var(--sos-text-muted)", marginLeft: 4 }}>/100</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--sos-text-secondary)", textAlign: "right", maxWidth: 280 }}>
                {result.leverageScore >= 75 ? "High leverage position" : result.leverageScore >= 50 ? "Moderate leverage. Clear upside." : "Low leverage. Significant improvement available."}
              </div>
            </div>
            <div style={{ height: 3, background: "var(--sos-track-bg)" }}>
              <div style={{ height: 3, width: `${result.leverageScore}%`, background: scoreColor, transition: "width 1s ease" }} />
            </div>
          </div>

          {/* Strategic Diagnosis */}
          <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 12 }}>Strategic Diagnosis</div>
            <p style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{result.strategicDiagnosis}</p>
          </div>

          {/* Bottleneck */}
          <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 12 }}>Bottleneck Analysis</div>
            <p style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.7 }}>{result.bottleneckAnalysis}</p>
          </div>

          {/* ROI Actions */}
          <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 16 }}>Three Highest-Return Actions</div>
            <div className="space-y-5">
              {result.roiActions.map((action, i) => (
                <div key={i} className="flex gap-4" data-testid={`card-roi-action-${i}`}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--sos-blue)", width: 24, flexShrink: 0, fontFamily: "Space Grotesk, sans-serif" }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sos-text)", marginBottom: 4 }}>{action.action}</div>
                    <div style={{ fontSize: 12, color: "var(--sos-text-dim)", marginBottom: 3 }}>{action.impact}</div>
                    <div style={{ fontSize: 11, color: "var(--sos-emerald)", fontWeight: 600, letterSpacing: "0.04em" }}>{action.timeframe}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunity + Risk */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 14 }}>Opportunity Map</div>
              <ul className="space-y-3">
                {result.opportunityMap.map((o, i) => (
                  <li key={i} className="flex gap-3" style={{ fontSize: 12, color: "var(--sos-text-body)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--sos-emerald)", flexShrink: 0, marginTop: 1 }}>+</span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 14 }}>Risk Map</div>
              <ul className="space-y-3">
                {result.riskMap.map((r, i) => (
                  <li key={i} className="flex gap-3" style={{ fontSize: 12, color: "var(--sos-text-body)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--sos-error)", flexShrink: 0, marginTop: 1 }}>!</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended next step */}
          <div className="p-6" style={{ background: "var(--sos-emerald-tint)", border: "1px solid var(--sos-emerald-border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-emerald)", textTransform: "uppercase", marginBottom: 12 }}>
              Recommended Next Step
            </div>
            <p style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.7 }}>{result.eliteOperatorNextStep}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
      <PageHeader title="Strategic Diagnosis" sub="Describe your position. Receive a structured diagnosis with ranked priorities and next steps." />

      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-7 max-w-2xl space-y-7">
          <div className="grid grid-cols-2 gap-6">
            <FieldGroup label="Current Goal *">
              <HudInput id="goal" value={form.goal} onChange={(v) => setForm({ ...form, goal: v })} placeholder="e.g. Land my first consulting client" data-testid="input-goal" />
            </FieldGroup>
            <FieldGroup label="Industry / Domain *">
              <HudInput id="industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} placeholder="e.g. AI / Data Science / Consulting" data-testid="input-industry" />
            </FieldGroup>
          </div>

          <FieldGroup label="Current Assets">
            <HudTextarea id="assets" value={form.assets} onChange={(v) => setForm({ ...form, assets: v })} placeholder="Skills, projects, network, credentials, tools..." rows={3} data-testid="input-assets" />
          </FieldGroup>

          <FieldGroup label="Current Bottleneck">
            <HudTextarea id="bottleneck" value={form.bottleneck} onChange={(v) => setForm({ ...form, bottleneck: v })} placeholder="What is the main thing blocking you right now?" rows={2} data-testid="input-bottleneck" />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-6">
            <FieldGroup label="Constraints">
              <HudTextarea id="constraints" value={form.constraints} onChange={(v) => setForm({ ...form, constraints: v })} placeholder="Time, money, skills, access..." rows={2} data-testid="input-constraints" />
            </FieldGroup>
            <FieldGroup label="Deadline">
              <HudInput id="deadline" value={form.deadline} onChange={(v) => setForm({ ...form, deadline: v })} placeholder="e.g. 90 days, end of Q2" data-testid="input-deadline" />
            </FieldGroup>
          </div>

          <FieldGroup label="Desired Outcome">
            <HudTextarea id="desiredOutcome" value={form.desiredOutcome} onChange={(v) => setForm({ ...form, desiredOutcome: v })} placeholder="What does success look like specifically?" rows={2} data-testid="input-desired-outcome" />
          </FieldGroup>

          <div className="pt-2">
            <HudBtn onClick={handleSubmit} disabled={runDiagnosis.isPending} data-testid="button-run-diagnosis">
              {runDiagnosis.isPending ? "Analysing..." : "Run Diagnosis"}
            </HudBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
