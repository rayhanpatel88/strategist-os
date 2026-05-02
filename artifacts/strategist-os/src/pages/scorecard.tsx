import { useState } from "react";
import { useRunScorecard } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

type Dimension = {
  name: string;
  score: number;
  reasoning: string;
  howToImprove: string;
  eliteRecommendation: string;
};

type ScorecardResult = {
  overallScore: number;
  dimensions: Dimension[];
  topPriority: string;
  strategicSummary: string;
};

const scoreColor = (score: number) => {
  if (score >= 75) return "text-chart-2";
  if (score >= 50) return "text-primary";
  return "text-chart-5";
};

const scoreBg = (score: number) => {
  if (score >= 75) return "bg-chart-2";
  if (score >= 50) return "bg-primary";
  return "bg-chart-5";
};

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
    runScorecard.mutate(
      { data: form },
      {
        onSuccess: (data) => {
          setResult(data as ScorecardResult);
          setStep("result");
        },
        onError: () => toast({ title: "Scorecard failed", variant: "destructive" }),
      }
    );
  };

  if (step === "result" && result) {
    const radarData = result.dimensions.map((d) => ({
      subject: d.name.split(" ")[0],
      score: d.score,
    }));

    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Optimisation Scorecard</h1>
            <p className="text-muted-foreground text-sm mt-1">Your strategic performance across 8 dimensions</p>
          </div>
          <Button variant="outline" onClick={() => { setStep("form"); setResult(null); }} data-testid="button-new-scorecard">
            New Scorecard
          </Button>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-card border border-card-border rounded-lg p-6 flex flex-col items-center justify-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Overall Score</div>
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.overallScore / 100) * 264} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-foreground">{result.overallScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-4">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))", borderRadius: "6px" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-card-border rounded-lg p-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Strategic Summary</div>
            <p className="text-sm text-foreground leading-relaxed">{result.strategicSummary}</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Top Priority</div>
            <p className="text-sm text-foreground leading-relaxed">{result.topPriority}</p>
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Dimension Breakdown</div>
          {result.dimensions.map((dim, i) => (
            <div
              key={dim.name}
              className="bg-card border border-card-border rounded-lg overflow-hidden"
              data-testid={`card-dimension-${i}`}
            >
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors"
                data-testid={`button-expand-dimension-${i}`}
              >
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-foreground">{dim.name}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-secondary rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${scoreBg(dim.score)}`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <span className={`text-lg font-bold w-10 text-right tabular-nums ${scoreColor(dim.score)}`}>
                    {dim.score}
                  </span>
                  <span className="text-muted-foreground text-xs">{expanded === i ? "▲" : "▼"}</span>
                </div>
              </button>
              {expanded === i && (
                <div className="px-6 pb-6 space-y-4 border-t border-card-border pt-4">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Why this score</div>
                    <p className="text-sm text-foreground">{dim.reasoning}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">How to improve</div>
                    <p className="text-sm text-foreground">{dim.howToImprove}</p>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                    <div className="text-xs font-medium text-primary mb-1">Elite recommendation</div>
                    <p className="text-sm text-foreground">{dim.eliteRecommendation}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">AI Optimisation Scorecard</h1>
        <p className="text-muted-foreground text-sm mt-1">Get scored across 8 critical strategic dimensions.</p>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="sc-goal">Your Goal *</Label>
          <Input
            id="sc-goal"
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            placeholder="e.g. Build a £5k/month consulting practice in AI"
            data-testid="input-scorecard-goal"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sc-industry">Industry / Domain *</Label>
          <Input
            id="sc-industry"
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            placeholder="e.g. AI Consulting / Data Science"
            data-testid="input-scorecard-industry"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sc-status">Current Status *</Label>
          <Textarea
            id="sc-status"
            value={form.currentStatus}
            onChange={(e) => setForm({ ...form, currentStatus: e.target.value })}
            placeholder="Describe where you are right now — what you've built, what you're doing, what is working and what isn't..."
            rows={5}
            data-testid="input-scorecard-status"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={runScorecard.isPending}
          className="w-full"
          data-testid="button-run-scorecard"
        >
          {runScorecard.isPending ? "Scoring..." : "Generate Optimisation Scorecard"}
        </Button>
      </div>
    </div>
  );
}
