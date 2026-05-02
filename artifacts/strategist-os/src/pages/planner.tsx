import { useState } from "react";
import {
  useCreateExecutionPlan,
  useListSavedPlans,
  useSavePlan,
  getListSavedPlansQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type DayAction = { day: number; task: string; priority: string; estimatedTime: string };
type ExecutionPlan = {
  title: string;
  sevenDaySprint: DayAction[];
  thirtyDayRoadmap: { week: number; theme: string; milestones: string[] }[];
  successMetrics: string[];
  risks: { risk: string; mitigation: string }[];
  reviewQuestions: string[];
};

const priorityColor: Record<string, string> = {
  high: "text-chart-5",
  medium: "text-chart-4",
  low: "text-muted-foreground",
};

const priorityBg: Record<string, string> = {
  high: "bg-chart-5/10 border-chart-5/20",
  medium: "bg-chart-4/10 border-chart-4/20",
  low: "bg-secondary border-border",
};

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
    createPlan.mutate(
      { data: form },
      {
        onSuccess: (data) => {
          setPlan(data as ExecutionPlan);
          setStep("result");
        },
        onError: () => toast({ title: "Plan generation failed", variant: "destructive" }),
      }
    );
  };

  const handleSave = () => {
    if (!plan) return;
    savePlan.mutate(
      { data: { title: plan.title, plan } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSavedPlansQueryKey() });
          toast({ title: "Execution plan saved" });
        },
      }
    );
  };

  const renderPlan = (p: ExecutionPlan) => (
    <div className="space-y-6">
      <div className="bg-card border border-card-border rounded-lg p-5">
        <div className="text-lg font-bold text-foreground mb-1">{p.title}</div>
        <div className="text-xs text-muted-foreground">Elite Execution Plan</div>
      </div>

      {/* 7-Day Sprint */}
      <div className="bg-card border border-card-border rounded-lg p-6">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">7-Day Sprint</div>
        <div className="space-y-3">
          {p.sevenDaySprint.map((action) => (
            <div key={action.day} className={`border rounded-md p-3 flex gap-4 items-start ${priorityBg[action.priority] || "bg-secondary border-border"}`} data-testid={`card-sprint-day-${action.day}`}>
              <div className="text-xs font-bold text-muted-foreground w-10 shrink-0 pt-0.5">Day {action.day}</div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{action.task}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-medium capitalize ${priorityColor[action.priority] || "text-muted-foreground"}`}>{action.priority}</span>
                  <span className="text-xs text-muted-foreground">{action.estimatedTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 30-Day Roadmap */}
      <div className="bg-card border border-card-border rounded-lg p-6">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">30-Day Roadmap</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {p.thirtyDayRoadmap.map((week) => (
            <div key={week.week} className="space-y-2" data-testid={`card-roadmap-week-${week.week}`}>
              <div className="text-primary font-semibold text-sm">Week {week.week}</div>
              <div className="text-xs font-medium text-foreground">{week.theme}</div>
              <ul className="space-y-1.5">
                {week.milestones.map((m, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-primary shrink-0">+</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-lg p-6">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Success Metrics</div>
          <ul className="space-y-2">
            {p.successMetrics.map((m, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-chart-2 shrink-0">+</span>{m}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-6">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Risks</div>
          <div className="space-y-3">
            {p.risks.map((r, i) => (
              <div key={i}>
                <div className="text-sm text-foreground flex gap-2">
                  <span className="text-destructive shrink-0">!</span>{r.risk}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 ml-4">Mitigation: {r.mitigation}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Questions */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
        <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Weekly Review Questions</div>
        <ol className="space-y-2">
          {p.reviewQuestions.map((q, i) => (
            <li key={i} className="text-sm text-foreground flex gap-2">
              <span className="text-primary shrink-0 font-medium">{i + 1}.</span>{q}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Elite Execution Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">Convert strategy into precise daily and weekly action.</p>
        </div>
        {step === "result" && plan && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave} disabled={savePlan.isPending} data-testid="button-save-plan">Save Plan</Button>
            <Button variant="outline" onClick={() => { setStep("form"); setPlan(null); }} data-testid="button-new-plan">New Plan</Button>
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        {(["create", "saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-planner-${t}`}
          >
            {t === "create" ? "Create Plan" : `Saved Plans (${savedPlans.data?.length ?? 0})`}
          </button>
        ))}
      </div>

      {tab === "create" && (
        <>
          {step === "form" ? (
            <div className="bg-card border border-card-border rounded-lg p-6 space-y-5 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="pl-goal">Strategic Goal *</Label>
                <Textarea id="pl-goal" value={form.strategicGoal} onChange={(e) => setForm({ ...form, strategicGoal: e.target.value })} placeholder="What is the overarching goal?" rows={2} data-testid="input-planner-goal" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pl-rec">Key Recommendation *</Label>
                <Textarea id="pl-rec" value={form.keyRecommendation} onChange={(e) => setForm({ ...form, keyRecommendation: e.target.value })} placeholder="The strategic recommendation to execute on" rows={3} data-testid="input-planner-recommendation" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pl-res">Available Resources</Label>
                  <Input id="pl-res" value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} placeholder="Time, money, tools, people" data-testid="input-planner-resources" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pl-con">Constraints</Label>
                  <Input id="pl-con" value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })} placeholder="What limits you?" data-testid="input-planner-constraints" />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createPlan.isPending} className="w-full" data-testid="button-create-plan">
                {createPlan.isPending ? "Generating Plan..." : "Generate Execution Plan"}
              </Button>
            </div>
          ) : plan ? renderPlan(plan) : null}
        </>
      )}

      {tab === "saved" && (
        <div className="space-y-4">
          {savedPlans.isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-lg p-5">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))
          ) : savedPlans.data && savedPlans.data.length > 0 ? (
            savedPlans.data.map((sp) => (
              <details key={sp.id} className="bg-card border border-card-border rounded-lg" data-testid={`card-saved-plan-${sp.id}`}>
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-foreground hover:bg-secondary/30 transition-colors rounded-lg">
                  {sp.title}
                  <span className="text-xs text-muted-foreground ml-2 font-normal">
                    {new Date(sp.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </summary>
                <div className="px-5 pb-5">{renderPlan(sp.plan as ExecutionPlan)}</div>
              </details>
            ))
          ) : (
            <div className="bg-card border border-card-border rounded-lg p-12 text-center">
              <div className="text-muted-foreground text-sm">No saved plans yet.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
