import { useState } from "react";
import { useBuildOpportunityStack } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ThinkingScreen } from "@/components/thinking-screen";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type RoadmapWeek = { week: number; focus: string; actions: string[] };
type OpportunityResult = {
  positioningAngle: string;
  bestNiche: string;
  offerIdea: string;
  contentAngle: string;
  proofAsset: string;
  roadmap30Day: RoadmapWeek[];
};
type HistoryEntry = {
  id: number;
  inputSummary: string;
  positioningAngle: string;
  result: OpportunityResult;
  createdAt: string;
};

function HudBtn({
  onClick, disabled, children, variant = "primary", "data-testid": dt,
}: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger"; "data-testid"?: string;
}) {
  if (variant === "ghost") {
    return (
      <button onClick={onClick} disabled={disabled} data-testid={dt}
        style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", opacity: disabled ? 0.4 : 1 }}>
        {children}
      </button>
    );
  }
  if (variant === "danger") {
    return (
      <button onClick={onClick} disabled={disabled} data-testid={dt}
        style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--sos-error)", background: "none", border: "none", padding: "4px 0", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", opacity: disabled ? 0.4 : 1 }}>
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

function HistorySidebar({
  history,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: {
  history: HistoryEntry[];
  activeId: number | null;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
}) {
  return (
    <aside
      className="flex flex-col shrink-0 h-full overflow-hidden"
      style={{ width: 264, borderRight: "1px solid var(--sos-border)", background: "var(--sos-sidebar-bg)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>
          History
        </div>
        <span style={{ fontSize: 10, color: "var(--sos-text-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
          {history.length}
        </span>
      </div>

      <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--sos-border-s)" }}>
        <button
          onClick={onNew}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--sos-emerald)", background: "rgba(114,254,136,0.06)",
            border: "1px solid rgba(114,254,136,0.2)", padding: "8px 12px",
            cursor: "pointer", fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>
          New Analysis
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {history.length === 0 ? (
          <div className="px-4 py-6 text-center space-y-1">
            <div style={{ fontSize: 11, color: "var(--sos-text-muted)", lineHeight: 1.6 }}>
              No analyses yet. Build your first opportunity stack to see it here.
            </div>
          </div>
        ) : (
          history.map((entry) => {
            const isActive = entry.id === activeId;
            const date = new Date(entry.createdAt).toLocaleDateString("en-GB", {
              day: "numeric", month: "short",
            });
            return (
              <div
                key={entry.id}
                onClick={() => onSelect(entry)}
                className="group"
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderLeft: isActive ? "2px solid var(--sos-emerald)" : "2px solid transparent",
                  background: isActive ? "rgba(114,254,136,0.04)" : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--sos-text)" : "var(--sos-text-secondary)", lineHeight: 1.4, flex: 1 }}>
                    {entry.positioningAngle
                      ? entry.positioningAngle.slice(0, 72) + (entry.positioningAngle.length > 72 ? "…" : "")
                      : "Analysis"}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                    style={{ flexShrink: 0, opacity: 0, fontSize: 13, color: "var(--sos-error)", background: "none", border: "none", padding: 2, cursor: "pointer", lineHeight: 1 }}
                    className="group-hover:opacity-100"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
                  </button>
                </div>
                {entry.inputSummary && (
                  <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 3, letterSpacing: "0.02em", lineHeight: 1.3 }}>
                    {entry.inputSummary.slice(0, 60)}{entry.inputSummary.length > 60 ? "…" : ""}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 4, letterSpacing: "0.04em" }}>
                  {date}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function ResultPanel({ result, onNew }: { result: OpportunityResult; onNew: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>Opportunity Stack</span>
          <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2 }}>Analysis complete</div>
        </div>
        <HudBtn variant="ghost" onClick={onNew} data-testid="button-new-opportunity">
          New Analysis
        </HudBtn>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Positioning Angle", value: result.positioningAngle, highlight: true },
            { label: "Target Niche", value: result.bestNiche, highlight: false },
            { label: "Offer Concept", value: result.offerIdea, highlight: false },
            { label: "Content Direction", value: result.contentAngle, highlight: false },
          ].map((item, i) => (
            <div key={i} className="p-6"
              style={{ background: item.highlight ? "var(--sos-emerald-tint)" : "var(--sos-surface)", border: item.highlight ? "1px solid var(--sos-emerald-border)" : "1px solid var(--sos-border)" }}
              data-testid={`card-opportunity-${i}`}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: item.highlight ? "var(--sos-emerald)" : "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 10 }}>{item.label}</div>
              <p style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.6 }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="p-6" style={{ background: "var(--sos-blue-tint)", border: "1px solid var(--sos-blue-border)" }} data-testid="card-opportunity-4">
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-blue)", textTransform: "uppercase", marginBottom: 10 }}>Proof Asset to Build</div>
          <p style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.6 }}>{result.proofAsset}</p>
        </div>

        <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 20 }}>30-Day Roadmap</div>
          <div className="grid grid-cols-4 gap-6">
            {result.roadmap30Day.map((week) => (
              <div key={week.week} data-testid={`card-roadmap-week-${week.week}`}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sos-blue)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>Week {week.week}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sos-text)", marginBottom: 10, lineHeight: 1.4 }}>{week.focus}</div>
                <ul className="space-y-2">
                  {week.actions.map((action, j) => (
                    <li key={j} className="flex gap-2" style={{ fontSize: 11, color: "var(--sos-text-secondary)", lineHeight: 1.5 }}>
                      <span style={{ color: "var(--sos-blue)", flexShrink: 0 }}>→</span>{action}
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

function FormPanel({ onResult }: { onResult: (r: OpportunityResult) => void }) {
  const [form, setForm] = useState({ skills: "", experience: "", tools: "", projects: "", targetAudience: "", desiredPath: "" });
  const build = useBuildOpportunityStack();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.skills || !form.targetAudience) {
      toast({ title: "Skills and target audience are required", variant: "destructive" });
      return;
    }
    build.mutate({ data: form }, {
      onSuccess: (data) => onResult(data as OpportunityResult),
      onError: () => toast({ title: "Analysis failed. Please try again.", variant: "destructive" }),
    });
  };

  const inputCls: React.CSSProperties = { width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 };
  const textareaCls: React.CSSProperties = { ...inputCls, resize: "none" as const, lineHeight: 1.6 };

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>Opportunity Stack</span>
        <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2 }}>Map your assets against demand. Get a positioning angle and a 30-day execution plan.</div>
      </div>

      {build.isPending ? (
        <ThinkingScreen
          title="Building Opportunity Stack"
          subtitle="GPT-5.1 is mapping your assets against demand"
          stages={[
            "Mapping skill–demand overlap",
            "Identifying best-fit niche",
            "Designing offer architecture",
            "Building 30-day roadmap",
            "Finalising opportunity stack",
          ]}
        />
      ) : (
      <div className="flex-1 overflow-y-auto px-8 py-7 max-w-2xl space-y-6">
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Skills *</div>
          <textarea value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Technical and strategic skills. Be specific: Python, LLM deployment, financial modelling, stakeholder management." rows={2} data-testid="input-skills" style={textareaCls} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Experience</div>
          <textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="Roles, projects, outcomes. Include credentials if relevant." rows={2} data-testid="input-experience" style={textareaCls} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Tools</div>
            <input value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} placeholder="e.g. Python, LangChain, n8n, Replit" data-testid="input-tools" style={inputCls} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Active Projects</div>
            <input value={form.projects} onChange={(e) => setForm({ ...form, projects: e.target.value })} placeholder="Current work, builds, or research" data-testid="input-projects" style={inputCls} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Target Audience *</div>
          <input value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} placeholder="Who you are building for or selling to" data-testid="input-target-audience" style={inputCls} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Desired Path</div>
          <input value={form.desiredPath} onChange={(e) => setForm({ ...form, desiredPath: e.target.value })} placeholder="e.g. £5k/month consulting, PhD offer, CTO at AI startup" data-testid="input-desired-path" style={inputCls} />
        </div>
        <div className="pt-2">
          <HudBtn onClick={handleSubmit} disabled={build.isPending} data-testid="button-build-opportunity-stack">
            Build Stack
          </HudBtn>
        </div>
      </div>
      )}
    </div>
  );
}

export default function Opportunity() {
  const [view, setView] = useState<"form" | "result">("form");
  const [activeResult, setActiveResult] = useState<OpportunityResult | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: history = [] } = useQuery<HistoryEntry[]>({
    queryKey: ["opportunity-history"],
    queryFn: async () => {
      const res = await fetch(`${basePath}/api/opportunity/history`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${basePath}/api/opportunity/history/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["opportunity-history"] });
      if (activeId === id) {
        setView("form");
        setActiveResult(null);
        setActiveId(null);
      }
      toast({ title: "Analysis removed" });
    },
  });

  const handleResult = (result: OpportunityResult) => {
    setActiveResult(result);
    setView("result");
    setActiveId(null);
    queryClient.invalidateQueries({ queryKey: ["opportunity-history"] });
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
    setActiveResult(entry.result);
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
          <ResultPanel result={activeResult} onNew={handleNew} />
        ) : (
          <FormPanel onResult={handleResult} />
        )}
      </div>
    </div>
  );
}
