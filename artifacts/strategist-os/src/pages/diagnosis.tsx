import { useState, useEffect } from "react";
import { useRunDiagnosis, useCreateSession, getListSessionsQueryKey } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ThinkingScreen } from "@/components/thinking-screen";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type DiagnosisResult = {
  strategicDiagnosis: string;
  leverageScore: number;
  bottleneckAnalysis: string;
  opportunityMap: string[];
  riskMap: string[];
  roiActions: { action: string; impact: string; timeframe: string }[];
  eliteOperatorNextStep: string;
};

type HistoryEntry = {
  id: number;
  goal: string;
  industry: string;
  leverageScore: number;
  result: DiagnosisResult;
  createdAt: string;
};

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase" }}>{label}</div>
      {children}
    </div>
  );
}

function HudBtn({ onClick, disabled, children, variant = "primary", "data-testid": dt }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: "primary" | "ghost"; "data-testid"?: string;
}) {
  if (variant === "ghost") {
    return (
      <button onClick={onClick} disabled={disabled} data-testid={dt}
        style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "8px 16px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", opacity: disabled ? 0.4 : 1 }}>
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

function ScorePip({ score }: { score: number }) {
  const color = score >= 75 ? "var(--sos-emerald)" : score >= 50 ? "var(--sos-blue)" : "var(--sos-error)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700, color, background: `color-mix(in srgb, ${color} 12%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      padding: "2px 7px", fontFamily: "Space Grotesk, sans-serif", flexShrink: 0,
    }}>
      {score}
    </span>
  );
}

function printDiagnosis(result: DiagnosisResult, sessionTitle: string) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const scoreLabel = result.leverageScore >= 75 ? "High leverage" : result.leverageScore >= 50 ? "Moderate leverage" : "Low leverage";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Strategy Diagnosis: ${sessionTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Space Grotesk', system-ui, sans-serif; color: #0d0e12; background: #fff; padding: 48px; font-size: 13px; line-height: 1.6; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #0d0e12; margin-bottom: 32px; }
  .brand { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #0d0e12; }
  .meta { text-align: right; font-size: 10px; color: rgba(13,14,18,0.5); letter-spacing: 0.06em; line-height: 1.8; }
  h1 { font-size: 22px; font-weight: 700; color: #0d0e12; margin-bottom: 4px; line-height: 1.2; }
  .score-row { display: flex; align-items: baseline; gap: 16px; margin-bottom: 32px; }
  .score-val { font-size: 48px; font-weight: 700; line-height: 1; color: ${result.leverageScore >= 75 ? "#00a844" : result.leverageScore >= 50 ? "#2b6ce6" : "#c04040"}; }
  .score-label { font-size: 12px; color: rgba(13,14,18,0.5); letter-spacing: 0.08em; text-transform: uppercase; }
  .track { height: 3px; background: rgba(13,14,18,0.08); margin-bottom: 32px; }
  .track-fill { height: 3px; background: ${result.leverageScore >= 75 ? "#00a844" : result.leverageScore >= 50 ? "#2b6ce6" : "#c04040"}; width: ${result.leverageScore}%; }
  .section { margin-bottom: 28px; }
  .section-label { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(13,14,18,0.4); margin-bottom: 8px; }
  .section-text { font-size: 13px; color: #0d0e12; line-height: 1.7; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .action-item { display: flex; gap: 12px; margin-bottom: 16px; }
  .action-num { font-size: 20px; font-weight: 700; color: #2b6ce6; width: 24px; flex-shrink: 0; }
  .action-body { flex: 1; }
  .action-title { font-size: 13px; font-weight: 600; color: #0d0e12; margin-bottom: 3px; }
  .action-impact { font-size: 12px; color: rgba(13,14,18,0.55); margin-bottom: 3px; }
  .action-time { font-size: 11px; color: #00a844; font-weight: 600; }
  ul { list-style: none; }
  li { display: flex; gap: 8px; font-size: 12px; color: #0d0e12; margin-bottom: 6px; line-height: 1.5; }
  .bullet-pos { color: #00a844; flex-shrink: 0; }
  .bullet-neg { color: #c04040; flex-shrink: 0; }
  .next-step { background: rgba(0,168,68,0.05); border: 1px solid rgba(0,168,68,0.2); padding: 16px; margin-bottom: 0; }
  .next-step .section-label { color: #00a844; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid rgba(13,14,18,0.08); display: flex; justify-content: space-between; font-size: 10px; color: rgba(13,14,18,0.35); letter-spacing: 0.06em; text-transform: uppercase; }
  @media print { body { padding: 32px; } }
</style>
</head>
<body>
<div class="header">
  <div class="brand">StrategistOS: Strategic Diagnosis</div>
  <div class="meta"><div>${date}</div><div>Rayhan Patel · MSc Data Science</div></div>
</div>
<h1>${sessionTitle}</h1>
<div class="score-row">
  <span class="score-val">${result.leverageScore}</span>
  <span class="score-label">Leverage Score: ${scoreLabel}</span>
</div>
<div class="track"><div class="track-fill"></div></div>
<div class="section">
  <div class="section-label">Strategic Diagnosis</div>
  <div class="section-text">${result.strategicDiagnosis.replace(/\n/g, "<br>")}</div>
</div>
<div class="section">
  <div class="section-label">Bottleneck Analysis</div>
  <div class="section-text">${result.bottleneckAnalysis}</div>
</div>
<div class="section">
  <div class="section-label">Three Highest-Return Actions</div>
  ${result.roiActions.map((a, i) => `<div class="action-item"><div class="action-num">${i + 1}</div><div class="action-body"><div class="action-title">${a.action}</div><div class="action-impact">${a.impact}</div><div class="action-time">${a.timeframe}</div></div></div>`).join("")}
</div>
<div class="grid2">
  <div>
    <div class="section-label">Opportunity Map</div>
    <ul>${result.opportunityMap.map((o) => `<li><span class="bullet-pos">+</span>${o}</li>`).join("")}</ul>
  </div>
  <div>
    <div class="section-label">Risk Map</div>
    <ul>${result.riskMap.map((r) => `<li><span class="bullet-neg">!</span>${r}</li>`).join("")}</ul>
  </div>
</div>
<div class="next-step">
  <div class="section-label">Recommended Next Step</div>
  <div class="section-text">${result.eliteOperatorNextStep}</div>
</div>
<div class="footer">
  <span>Generated by StrategistOS</span>
  <span>Confidential</span>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

function HistorySidebar({
  history, activeId, onSelect, onDelete, onNew,
}: {
  history: HistoryEntry[]; activeId: number | null;
  onSelect: (e: HistoryEntry) => void; onDelete: (id: number) => void; onNew: () => void;
}) {
  return (
    <aside className="flex flex-col shrink-0 h-full overflow-hidden"
      style={{ width: 264, borderRight: "1px solid var(--sos-border)", background: "var(--sos-sidebar-bg)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>History</div>
        <span style={{ fontSize: 10, color: "var(--sos-text-muted)", fontFamily: "Space Grotesk, sans-serif" }}>{history.length}</span>
      </div>

      <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--sos-border-s)" }}>
        <button onClick={onNew} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--sos-emerald)", background: "rgba(114,254,136,0.06)",
          border: "1px solid rgba(114,254,136,0.2)", padding: "8px 12px",
          cursor: "pointer", fontFamily: "Space Grotesk, sans-serif",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>
          New Diagnosis
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {history.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <div style={{ fontSize: 11, color: "var(--sos-text-muted)", lineHeight: 1.6 }}>
              No diagnoses yet. Run your first analysis to track your leverage score over time.
            </div>
          </div>
        ) : (
          history.map((entry) => {
            const isActive = entry.id === activeId;
            const date = new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            return (
              <div key={entry.id} onClick={() => onSelect(entry)} className="group"
                style={{
                  padding: "10px 14px", cursor: "pointer",
                  borderLeft: isActive ? "2px solid var(--sos-emerald)" : "2px solid transparent",
                  background: isActive ? "rgba(114,254,136,0.04)" : "transparent",
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--sos-text)" : "var(--sos-text-secondary)", lineHeight: 1.4, flex: 1 }}>
                    {entry.goal ? entry.goal.slice(0, 68) + (entry.goal.length > 68 ? "…" : "") : "Diagnosis"}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                    style={{ flexShrink: 0, opacity: 0, fontSize: 13, color: "var(--sos-error)", background: "none", border: "none", padding: 2, cursor: "pointer", lineHeight: 1 }}
                    className="group-hover:opacity-100">
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <ScorePip score={entry.leverageScore} />
                  {entry.industry && (
                    <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.02em" }}>
                      {entry.industry.slice(0, 24)}{entry.industry.length > 24 ? "…" : ""}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: "var(--sos-text-muted)", marginLeft: "auto" }}>{date}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function ResultPanel({ result, goal, onNew }: { result: DiagnosisResult; goal: string; onNew: () => void }) {
  const scoreColor = result.leverageScore >= 75 ? "var(--sos-emerald)" : result.leverageScore >= 50 ? "var(--sos-blue)" : "var(--sos-error)";
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>Strategic Diagnosis</span>
          <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2 }}>Analysis complete</div>
        </div>
        <div className="flex items-center gap-2">
          <HudBtn variant="ghost" onClick={() => printDiagnosis(result, goal)} data-testid="button-export-pdf">Export PDF</HudBtn>
          <HudBtn variant="ghost" onClick={onNew} data-testid="button-new-diagnosis">New Diagnosis</HudBtn>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7 space-y-4">
        <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
          <div className="flex items-end justify-between mb-4">
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Leverage Score</div>
              <div style={{ fontSize: 44, fontWeight: 700, color: scoreColor, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
                {result.leverageScore}<span style={{ fontSize: 16, color: "var(--sos-text-muted)", marginLeft: 4 }}>/100</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--sos-text-secondary)", textAlign: "right", maxWidth: 280, lineHeight: 1.55 }}>
              {result.leverageScore >= 75 ? "Strong position. The priority is systematic execution." : result.leverageScore >= 50 ? "Moderate position. Defined gaps with clear upside available." : "Constrained position. The bottleneck is structural, not effort."}
            </div>
          </div>
          <div style={{ height: 3, background: "var(--sos-track-bg)" }}>
            <div style={{ height: 3, width: `${result.leverageScore}%`, background: scoreColor, transition: "width 1s ease" }} />
          </div>
        </div>

        <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 12 }}>Strategic Diagnosis</div>
          <p style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{result.strategicDiagnosis}</p>
        </div>

        <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 12 }}>Bottleneck Analysis</div>
          <p style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.7 }}>{result.bottleneckAnalysis}</p>
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 14 }}>Opportunities</div>
            <ul className="space-y-3">
              {result.opportunityMap.map((o, i) => (
                <li key={i} className="flex gap-3" style={{ fontSize: 12, color: "var(--sos-text-body)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--sos-emerald)", flexShrink: 0, marginTop: 1 }}>+</span>{o}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 14 }}>Risks</div>
            <ul className="space-y-3">
              {result.riskMap.map((r, i) => (
                <li key={i} className="flex gap-3" style={{ fontSize: 12, color: "var(--sos-text-body)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--sos-error)", flexShrink: 0, marginTop: 1 }}>!</span>{r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-6" style={{ background: "var(--sos-emerald-tint)", border: "1px solid var(--sos-emerald-border)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-emerald)", textTransform: "uppercase", marginBottom: 12 }}>Recommended Next Step</div>
          <p style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.7 }}>{result.eliteOperatorNextStep}</p>
        </div>
      </div>
    </div>
  );
}

function FormPanel({ onResult }: { onResult: (r: DiagnosisResult, goal: string) => void }) {
  const [form, setForm] = useState({
    goal: "", industry: "", assets: "", constraints: "", deadline: "", desiredOutcome: "", bottleneck: "",
  });

  const { data: profile } = useQuery<{ preferredIndustry: string; defaultAssets: string; defaultConstraints: string }>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch(`${basePath}/api/settings`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        industry: prev.industry || profile.preferredIndustry || "",
        assets: prev.assets || profile.defaultAssets || "",
        constraints: prev.constraints || profile.defaultConstraints || "",
      }));
    }
  }, [profile]);

  const runDiagnosis = useRunDiagnosis();
  const createSession = useCreateSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.goal || !form.industry) {
      toast({ title: "Goal and industry are required", variant: "destructive" });
      return;
    }
    runDiagnosis.mutate({ data: form }, {
      onSuccess: (data) => {
        const r = data as DiagnosisResult;
        onResult(r, form.goal.substring(0, 60));
        createSession.mutate(
          { data: { title: form.goal.substring(0, 60), goal: form.goal, industry: form.industry } },
          { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() }) }
        );
      },
      onError: () => toast({ title: "Analysis failed. Please try again.", variant: "destructive" }),
    });
  };

  const inputStyle: React.CSSProperties = { width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 };
  const taStyle: React.CSSProperties = { ...inputStyle, resize: "none" as const, lineHeight: 1.6 };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>Strategic Diagnosis</span>
          <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2 }}>Describe your position. Receive a structured analysis with ranked priorities and a clear next step.</div>
        </div>
      </div>

      {runDiagnosis.isPending ? (
        <ThinkingScreen
          title="Running Strategic Diagnosis"
          subtitle="GPT-5.1 is analysing your position"
          stages={[
            "Reading strategic context",
            "Identifying true bottleneck",
            "Mapping leverage opportunities",
            "Calculating leverage score",
            "Generating recommendations",
          ]}
        />
      ) : (
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-7 max-w-2xl space-y-7">
          <div className="grid grid-cols-2 gap-6">
            <FieldGroup label="Current Goal *">
              <input id="goal" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                placeholder="State the specific outcome you are working toward" data-testid="input-goal" style={inputStyle} />
            </FieldGroup>
            <FieldGroup label="Industry / Domain *">
              <input id="industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="e.g. AI Consulting, SaaS, Research" data-testid="input-industry" style={inputStyle} />
            </FieldGroup>
          </div>

          <FieldGroup label="Current Assets">
            <textarea id="assets" value={form.assets} onChange={(e) => setForm({ ...form, assets: e.target.value })}
              placeholder="Skills, credentials, tools, relationships, projects, existing revenue"
              rows={3} data-testid="input-assets" style={taStyle} />
          </FieldGroup>

          <FieldGroup label="Primary Bottleneck">
            <textarea id="bottleneck" value={form.bottleneck} onChange={(e) => setForm({ ...form, bottleneck: e.target.value })}
              placeholder="What is the single thing most limiting your progress right now?"
              rows={2} data-testid="input-bottleneck" style={taStyle} />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-6">
            <FieldGroup label="Constraints">
              <textarea id="constraints" value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                placeholder="Time per week, budget, access, competing priorities"
                rows={2} data-testid="input-constraints" style={taStyle} />
            </FieldGroup>
            <FieldGroup label="Timeline">
              <input id="deadline" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                placeholder="e.g. 60 days, end of Q3" data-testid="input-deadline" style={inputStyle} />
            </FieldGroup>
          </div>

          <FieldGroup label="Definition of Success">
            <textarea id="desiredOutcome" value={form.desiredOutcome} onChange={(e) => setForm({ ...form, desiredOutcome: e.target.value })}
              placeholder="What does a successful outcome look like in concrete terms?"
              rows={2} data-testid="input-desired-outcome" style={taStyle} />
          </FieldGroup>

          <div className="pt-2">
            <HudBtn onClick={handleSubmit} disabled={runDiagnosis.isPending} data-testid="button-run-diagnosis">
              Run Diagnosis
            </HudBtn>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default function Diagnosis() {
  const [view, setView] = useState<"form" | "result">("form");
  const [activeResult, setActiveResult] = useState<DiagnosisResult | null>(null);
  const [activeGoal, setActiveGoal] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: history = [] } = useQuery<HistoryEntry[]>({
    queryKey: ["diagnosis-history"],
    queryFn: async () => {
      const res = await fetch(`${basePath}/api/diagnosis/history`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${basePath}/api/diagnosis/history/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["diagnosis-history"] });
      if (activeId === id) { setView("form"); setActiveResult(null); setActiveId(null); }
      toast({ title: "Diagnosis removed" });
    },
  });

  const handleResult = (result: DiagnosisResult, goal: string) => {
    setActiveResult(result);
    setActiveGoal(goal);
    setActiveId(null);
    setView("result");
    queryClient.invalidateQueries({ queryKey: ["diagnosis-history"] });
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
    setActiveResult(entry.result);
    setActiveGoal(entry.goal);
    setActiveId(entry.id);
    setView("result");
  };

  const handleNew = () => {
    setView("form");
    setActiveResult(null);
    setActiveId(null);
  };

  return (
    <div className="flex h-full" style={{ background: "var(--sos-bg)" }}>
      <HistorySidebar
        history={history}
        activeId={activeId}
        onSelect={handleSelectHistory}
        onDelete={(id) => deleteMutation.mutate(id)}
        onNew={handleNew}
      />
      <div className="flex-1 min-w-0 overflow-hidden">
        {view === "result" && activeResult ? (
          <ResultPanel result={activeResult} goal={activeGoal} onNew={handleNew} />
        ) : (
          <FormPanel onResult={handleResult} />
        )}
      </div>
    </div>
  );
}
