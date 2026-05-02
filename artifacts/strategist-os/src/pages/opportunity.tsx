import { useState } from "react";
import { useBuildOpportunityStack } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RoadmapWeek = {
  week: number;
  focus: string;
  actions: string[];
};

type OpportunityResult = {
  positioningAngle: string;
  bestNiche: string;
  offerIdea: string;
  contentAngle: string;
  proofAsset: string;
  roadmap30Day: RoadmapWeek[];
};

export default function Opportunity() {
  const [step, setStep] = useState<"form" | "result">("form");
  const [result, setResult] = useState<OpportunityResult | null>(null);
  const [form, setForm] = useState({
    skills: "",
    experience: "",
    tools: "",
    projects: "",
    targetAudience: "",
    desiredPath: "",
  });

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
        onSuccess: (data) => {
          setResult(data as OpportunityResult);
          setStep("result");
        },
        onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
      }
    );
  };

  if (step === "result" && result) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Opportunity Stack</h1>
            <p className="text-muted-foreground text-sm mt-1">Your positioning, niche, and 30-day roadmap</p>
          </div>
          <Button variant="outline" onClick={() => { setStep("form"); setResult(null); }} data-testid="button-new-opportunity">
            New Analysis
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { label: "Positioning Angle", value: result.positioningAngle, highlight: true },
            { label: "Best Niche", value: result.bestNiche, highlight: false },
            { label: "Offer / Project Idea", value: result.offerIdea, highlight: false },
            { label: "Content Angle", value: result.contentAngle, highlight: false },
            { label: "Proof Asset to Build", value: result.proofAsset, highlight: true },
          ].map((item, i) => (
            <div
              key={i}
              className={`rounded-lg p-6 ${item.highlight ? "bg-primary/10 border border-primary/20" : "bg-card border border-card-border"}`}
              data-testid={`card-opportunity-${i}`}
            >
              <div className={`text-xs font-semibold uppercase tracking-widest mb-3 ${item.highlight ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </div>
              <p className="text-sm text-foreground leading-relaxed">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-card-border rounded-lg p-6">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">30-Day Execution Roadmap</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {result.roadmap30Day.map((week) => (
              <div key={week.week} className="space-y-3" data-testid={`card-roadmap-week-${week.week}`}>
                <div className="flex items-center gap-2">
                  <div className="text-primary font-bold text-sm">Week {week.week}</div>
                </div>
                <div className="text-xs font-semibold text-foreground">{week.focus}</div>
                <ul className="space-y-2">
                  {week.actions.map((action, j) => (
                    <li key={j} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-primary shrink-0">→</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Opportunity Stack Builder</h1>
        <p className="text-muted-foreground text-sm mt-1">Input your assets. Get your sharpest positioning and 30-day roadmap.</p>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="opp-skills">Skills *</Label>
          <Textarea
            id="opp-skills"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="e.g. Machine learning, Python, LLM fine-tuning, data visualisation, strategic consulting"
            rows={2}
            data-testid="input-skills"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="opp-experience">Experience</Label>
          <Textarea
            id="opp-experience"
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            placeholder="e.g. MSc Data Science (ongoing), 2 years freelance web development, led university AI society"
            rows={2}
            data-testid="input-experience"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="opp-tools">Tools You Know</Label>
            <Input
              id="opp-tools"
              value={form.tools}
              onChange={(e) => setForm({ ...form, tools: e.target.value })}
              placeholder="Python, Replit, LangChain, n8n..."
              data-testid="input-tools"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-projects">Current Projects</Label>
            <Input
              id="opp-projects"
              value={form.projects}
              onChange={(e) => setForm({ ...form, projects: e.target.value })}
              placeholder="e.g. AI automation SaaS, dissertation on NLP"
              data-testid="input-projects"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="opp-audience">Target Audience *</Label>
          <Input
            id="opp-audience"
            value={form.targetAudience}
            onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
            placeholder="e.g. Startup founders, enterprise innovation teams, MSc / PhD students"
            data-testid="input-target-audience"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="opp-path">Desired Income or Career Path</Label>
          <Input
            id="opp-path"
            value={form.desiredPath}
            onChange={(e) => setForm({ ...form, desiredPath: e.target.value })}
            placeholder="e.g. £5k/month consulting, PhD offer, CTO role at AI startup"
            data-testid="input-desired-path"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={build.isPending}
          className="w-full"
          data-testid="button-build-opportunity-stack"
        >
          {build.isPending ? "Building your stack..." : "Build Opportunity Stack"}
        </Button>
      </div>
    </div>
  );
}
