import { useState } from "react";
import { useRunDiagnosis, useCreateSession, getListSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DiagnosisResult = {
  strategicDiagnosis: string;
  leverageScore: number;
  bottleneckAnalysis: string;
  opportunityMap: string[];
  riskMap: string[];
  roiActions: { action: string; impact: string; timeframe: string }[];
  eliteOperatorNextStep: string;
};

export default function Diagnosis() {
  const [step, setStep] = useState<"form" | "result">("form");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [form, setForm] = useState({
    goal: "",
    industry: "",
    assets: "",
    constraints: "",
    deadline: "",
    desiredOutcome: "",
    bottleneck: "",
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
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
              },
            }
          );
        },
        onError: () => {
          toast({ title: "Analysis failed", description: "Could not run diagnosis. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  if (step === "result" && result) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Strategic Diagnosis</h1>
            <p className="text-muted-foreground text-sm mt-1">Analysis complete</p>
          </div>
          <Button variant="outline" onClick={() => { setStep("form"); setResult(null); }} data-testid="button-new-diagnosis">
            New Diagnosis
          </Button>
        </div>

        {/* Leverage Score */}
        <div className="bg-card border border-card-border rounded-lg p-8 mb-6 flex items-center gap-8">
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(result.leverageScore / 100) * 264} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{result.leverageScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Leverage Score</div>
            <div className="text-lg font-semibold text-foreground mb-3">
              {result.leverageScore >= 75 ? "High leverage position" : result.leverageScore >= 50 ? "Moderate leverage — clear upside" : "Low leverage — significant improvement available"}
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-1000"
                style={{ width: `${result.leverageScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Strategic Diagnosis */}
        <div className="bg-card border border-card-border rounded-lg p-6 mb-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Strategic Diagnosis</div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{result.strategicDiagnosis}</p>
        </div>

        {/* Bottleneck */}
        <div className="bg-card border border-card-border rounded-lg p-6 mb-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Bottleneck Analysis</div>
          <p className="text-sm text-foreground leading-relaxed">{result.bottleneckAnalysis}</p>
        </div>

        {/* ROI Actions */}
        <div className="bg-card border border-card-border rounded-lg p-6 mb-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">3 Highest ROI Actions</div>
          <div className="space-y-4">
            {result.roiActions.map((action, i) => (
              <div key={i} className="flex gap-4" data-testid={`card-roi-action-${i}`}>
                <div className="text-primary font-bold text-lg w-6 shrink-0">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{action.action}</div>
                  <div className="text-xs text-muted-foreground mt-1">{action.impact}</div>
                  <div className="text-xs text-primary mt-1 font-medium">{action.timeframe}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunity & Risk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-card border border-card-border rounded-lg p-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Opportunity Map</div>
            <ul className="space-y-2">
              {result.opportunityMap.map((o, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  <span className="text-primary shrink-0 mt-0.5">+</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Risk Map</div>
            <ul className="space-y-2">
              {result.riskMap.map((r, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  <span className="text-destructive shrink-0 mt-0.5">!</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Elite Operator */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
          <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">What a Top 0.1% Operator Would Do Next</div>
          <p className="text-sm text-foreground leading-relaxed">{result.eliteOperatorNextStep}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Strategic Diagnosis Engine</h1>
        <p className="text-muted-foreground text-sm mt-1">Describe your situation. Get a precise strategic analysis.</p>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Current Goal *</Label>
            <Input
              id="goal"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              placeholder="e.g. Land my first consulting client"
              data-testid="input-goal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry / Domain *</Label>
            <Input
              id="industry"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              placeholder="e.g. AI / Data Science / Consulting"
              data-testid="input-industry"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assets">Current Assets</Label>
          <Textarea
            id="assets"
            value={form.assets}
            onChange={(e) => setForm({ ...form, assets: e.target.value })}
            placeholder="Skills, projects, network, credentials, tools..."
            rows={3}
            data-testid="input-assets"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bottleneck">Current Bottleneck</Label>
          <Textarea
            id="bottleneck"
            value={form.bottleneck}
            onChange={(e) => setForm({ ...form, bottleneck: e.target.value })}
            placeholder="What is the main thing blocking you right now?"
            rows={2}
            data-testid="input-bottleneck"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="constraints">Constraints</Label>
            <Textarea
              id="constraints"
              value={form.constraints}
              onChange={(e) => setForm({ ...form, constraints: e.target.value })}
              placeholder="Time, money, skills, access..."
              rows={2}
              data-testid="input-constraints"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              placeholder="e.g. 90 days, end of Q2, 6 months"
              data-testid="input-deadline"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="desiredOutcome">Desired Outcome</Label>
          <Textarea
            id="desiredOutcome"
            value={form.desiredOutcome}
            onChange={(e) => setForm({ ...form, desiredOutcome: e.target.value })}
            placeholder="What does success look like specifically?"
            rows={2}
            data-testid="input-desired-outcome"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={runDiagnosis.isPending}
          className="w-full"
          data-testid="button-run-diagnosis"
        >
          {runDiagnosis.isPending ? "Analysing..." : "Run Strategic Diagnosis"}
        </Button>
      </div>
    </div>
  );
}
