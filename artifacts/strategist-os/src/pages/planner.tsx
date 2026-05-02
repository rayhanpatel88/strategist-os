import { useState } from "react";
import {
  useCreateExecutionPlan,
  useListSavedPlans,
  useSavePlan,
  getListSavedPlansQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type DayAction = { day: number; task: string; priority: string; estimatedTime: string };
type ExecutionPlan = {
  title: string;
  sevenDaySprint: DayAction[];
  thirtyDayRoadmap: { week: number; theme: string; milestones: string[] }[];
  successMetrics: string[];
  risks: { risk: string; mitigation: string }[];
  reviewQuestions: string[];
};

const priorityDot: Record<string, string> = {
  high: "#ffb4ab",
  medium: "#72fe88",
  low: "rgba(255,255,255,0.3)",
};

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

function renderPlan(p: ExecutionPlan) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="p-5" style={{ background: "rgba(75,142,255,0.07)", border: "1px solid rgba(75,142,255,0.2)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", fontFamily: "Space Grotesk, sans-serif", marginBottom: 3 }}>{p.title}</div>
        <div style={{ fontSize: 10, color: "#4b8eff", letterSpacing: "0.1em", textTransform: "uppercase" }}>Elite Execution Plan</div>
      </div>

      {/* 7-Day Sprint */}
      <div className="p-6" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 16 }}>7-Day Sprint</div>
        <div className="space-y-2">
          {p.sevenDaySprint.map((action) => (
            <div
              key={action.day}
              className="flex gap-4 items-start p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              data-testid={`card-sprint-day-${action.day}`}
            >
              <div className="flex items-center gap-2 shrink-0" style={{ width: 60 }}>
                <span className="status-pip" style={{ background: priorityDot[action.priority] || "rgba(255,255,255,0.3)" }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>D{action.day}</span>
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{action.task}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  <span style={{ fontSize: 10, color: priorityDot[action.priority] || "rgba(255,255,255,0.3)", textTransform: "capitalize", letterSpacing: "0.06em" }}>{action.priority}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{action.estimatedTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 30-Day Roadmap */}
      <div className="p-6" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 20 }}>30-Day Roadmap</div>
        <div className="grid grid-cols-4 gap-6">
          {p.thirtyDayRoadmap.map((week) => (
            <div key={week.week} data-testid={`card-roadmap-week-${week.week}`}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#4b8eff", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontFamily: "Space Grotesk, sans-serif" }}>Week {week.week}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#ffffff", marginBottom: 10, lineHeight: 1.4 }}>{week.theme}</div>
              <ul className="space-y-2">
                {week.milestones.map((m, i) => (
                  <li key={i} className="flex gap-2" style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                    <span style={{ color: "#72fe88", flexShrink: 0 }}>+</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics + Risks */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 14 }}>Success Metrics</div>
          <ul className="space-y-3">
            {p.successMetrics.map((m, i) => (
              <li key={i} className="flex gap-2" style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                <span style={{ color: "#72fe88", flexShrink: 0 }}>+</span>{m}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 14 }}>Risks</div>
          <div className="space-y-4">
            {p.risks.map((r, i) => (
              <div key={i}>
                <div className="flex gap-2" style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, marginBottom: 3 }}>
                  <span style={{ color: "#ffb4ab", flexShrink: 0 }}>!</span>{r.risk}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 14 }}>Mitigation: {r.mitigation}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review questions */}
      <div className="p-6" style={{ background: "rgba(114,254,136,0.04)", border: "1px solid rgba(114,254,136,0.16)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#72fe88", textTransform: "uppercase", marginBottom: 14 }}>Weekly Review Questions</div>
        <ol className="space-y-3">
          {p.reviewQuestions.map((q, i) => (
            <li key={i} className="flex gap-3" style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
              <span style={{ color: "#72fe88", fontWeight: 700, flexShrink: 0, fontFamily: "Space Grotesk, sans-serif" }}>{i + 1}.</span>{q}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function Planner() {
  const [tab, setTab] = useState<"create" | "saved">("create");
  const [step, setStep] = useState<"form" | "result">("form");
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [form, setForm] = useState({ strategicGoal: "", keyRecommendation: "", resources: "", constraints: "" });

  const createPlan = useCreateExecutionPlan();
  const savedPlans = useListSavedPlans();
  const savePlan = useSavePlan();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!form.strategicGoal || !form.keyRecommendation) {
      toast({ title: "Please fill in goal and key recommendation", variant: "destructive" });
      return;
    }
    createPlan.mutate({ data: form }, {
      onSuccess: (data) => { setPlan(data as ExecutionPlan); setStep("result"); },
      onError: () => toast({ title: "Plan generation failed", variant: "destructive" }),
    });
  };

  const handleSave = () => {
    if (!plan) return;
    savePlan.mutate({ data: { title: plan.title, plan } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedPlansQueryKey() });
        toast({ title: "Execution plan saved" });
      },
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#121317" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#ffffff", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
          Execution_Planner
        </span>
        <div className="flex items-center gap-3">
          {step === "result" && plan && (
            <>
              <HudBtn variant="ghost" onClick={handleSave} disabled={savePlan.isPending} data-testid="button-save-plan">Save Plan</HudBtn>
              <HudBtn variant="ghost" onClick={() => { setStep("form"); setPlan(null); }} data-testid="button-new-plan">New Plan</HudBtn>
            </>
          )}
          {/* Tab switcher */}
          <div className="flex" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            {(["create", "saved"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                data-testid={`tab-planner-${t}`}
                style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "7px 16px", cursor: "pointer", border: "none",
                  background: tab === t ? "rgba(255,255,255,0.08)" : "transparent",
                  color: tab === t ? "#ffffff" : "rgba(255,255,255,0.35)",
                  fontFamily: "Space Grotesk, sans-serif",
                  borderRight: t === "create" ? "1px solid rgba(255,255,255,0.1)" : "none",
                }}
              >
                {t === "create" ? "Create" : `Saved (${savedPlans.data?.length ?? 0})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7">
        {tab === "create" && (
          <>
            {step === "form" ? (
              <div className="max-w-2xl space-y-6">
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Strategic Goal *</div>
                  <textarea value={form.strategicGoal} onChange={(e) => setForm({ ...form, strategicGoal: e.target.value })} placeholder="What is the overarching goal?" rows={2} data-testid="input-planner-goal" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Key Recommendation *</div>
                  <textarea value={form.keyRecommendation} onChange={(e) => setForm({ ...form, keyRecommendation: e.target.value })} placeholder="The strategic recommendation to execute on" rows={3} data-testid="input-planner-recommendation" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Available Resources</div>
                    <input value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} placeholder="Time, money, tools, people" data-testid="input-planner-resources" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Constraints</div>
                    <input value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })} placeholder="What limits you?" data-testid="input-planner-constraints" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
                  </div>
                </div>
                <div className="pt-2">
                  <HudBtn onClick={handleCreate} disabled={createPlan.isPending} data-testid="button-create-plan">
                    {createPlan.isPending ? "Generating Plan..." : "Generate Execution Plan"}
                  </HudBtn>
                </div>
              </div>
            ) : plan ? renderPlan(plan) : null}
          </>
        )}

        {tab === "saved" && (
          <div className="space-y-3">
            {savedPlans.isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-5 animate-pulse" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)", height: 80 }} />
              ))
            ) : savedPlans.data && savedPlans.data.length > 0 ? (
              savedPlans.data.map((sp) => (
                <details key={sp.id} style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)" }} data-testid={`card-saved-plan-${sp.id}`}>
                  <summary style={{ padding: "16px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", listStyle: "none" }}>
                    <span>{sp.title}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{new Date(sp.createdAt).toLocaleDateString("en-GB")}</span>
                  </summary>
                  <div style={{ padding: "20px" }}>{renderPlan(sp.plan as ExecutionPlan)}</div>
                </details>
              ))
            ) : (
              <div className="py-20 text-center">
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>No saved plans yet.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
