import { useState } from "react";
import {
  useGeneratePrompt,
  useListSavedPrompts,
  useSavePrompt,
  useDeleteSavedPrompt,
  getListSavedPromptsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { id: "business-strategy", label: "Business Strategy" },
  { id: "academic-writing", label: "Academic Writing" },
  { id: "ai-automation", label: "AI Automation" },
  { id: "content-creation", label: "Content Creation" },
  { id: "linkedin-positioning", label: "LinkedIn Positioning" },
  { id: "offer-creation", label: "Offer Creation" },
  { id: "replit-app-building", label: "Replit App Building" },
  { id: "data-science", label: "Data Science" },
  { id: "phd-research", label: "PhD / Research" },
] as const;

type GeneratedPrompt = {
  title: string;
  category: string;
  prompt: string;
  usage: string;
  variables: string[];
};

export default function Prompts() {
  const [tab, setTab] = useState<"generate" | "saved">("generate");
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [context, setContext] = useState("");
  const [goal, setGoal] = useState("");
  const [generated, setGenerated] = useState<GeneratedPrompt | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useGeneratePrompt();
  const save = useSavePrompt();
  const del = useDeleteSavedPrompt();
  const savedPrompts = useListSavedPrompts();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!context || !goal) {
      toast({ title: "Fill in context and goal first", variant: "destructive" });
      return;
    }
    generate.mutate(
      { data: { category, context, goal } },
      {
        onSuccess: (data) => setGenerated(data as GeneratedPrompt),
        onError: () => toast({ title: "Generation failed", variant: "destructive" }),
      }
    );
  };

  const handleCopy = () => {
    if (generated) {
      navigator.clipboard.writeText(generated.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Prompt copied to clipboard" });
    }
  };

  const handleSave = () => {
    if (!generated) return;
    save.mutate(
      { data: generated },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSavedPromptsQueryKey() });
          toast({ title: "Prompt saved to arsenal" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    del.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSavedPromptsQueryKey() });
          toast({ title: "Prompt removed" });
        },
      }
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Prompt Arsenal</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate and save premium structured prompts across 9 categories.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        {(["generate", "saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-${t}`}
          >
            {t === "generate" ? "Generate" : `Saved (${savedPrompts.data?.length ?? 0})`}
          </button>
        ))}
      </div>

      {tab === "generate" ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Category</div>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      category === cat.id
                        ? "bg-primary/15 text-primary font-medium border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    data-testid={`button-category-${cat.id}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-context">Context</Label>
              <Textarea
                id="prompt-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe your specific situation, background, or problem..."
                rows={4}
                data-testid="input-prompt-context"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-goal">Goal</Label>
              <Input
                id="prompt-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What do you want this prompt to help you achieve?"
                data-testid="input-prompt-goal"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="w-full"
              data-testid="button-generate-prompt"
            >
              {generate.isPending ? "Generating..." : "Generate Premium Prompt"}
            </Button>

            {generated && (
              <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{generated.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 capitalize">{generated.category.replace(/-/g, " ")}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy} data-testid="button-copy-prompt">
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSave} disabled={save.isPending} data-testid="button-save-prompt">
                      Save
                    </Button>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-md p-4">
                  <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-64">
                    {generated.prompt}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Usage guidance</div>
                  <p className="text-xs text-foreground">{generated.usage}</p>
                </div>

                {generated.variables.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Variables to fill in</div>
                    <div className="flex flex-wrap gap-2">
                      {generated.variables.map((v) => (
                        <span key={v} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded font-mono">
                          [{v}]
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {savedPrompts.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-lg p-5">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))
          ) : savedPrompts.data && savedPrompts.data.length > 0 ? (
            savedPrompts.data.map((prompt) => (
              <div key={prompt.id} className="bg-card border border-card-border rounded-lg p-5" data-testid={`card-saved-prompt-${prompt.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{prompt.title}</div>
                    <div className="text-xs text-muted-foreground capitalize mt-0.5">{prompt.category.replace(/-/g, " ")}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { navigator.clipboard.writeText(prompt.prompt); toast({ title: "Copied" }); }}
                      data-testid={`button-copy-saved-prompt-${prompt.id}`}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(prompt.id)}
                      className="text-destructive"
                      data-testid={`button-delete-saved-prompt-${prompt.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <pre className="text-xs text-muted-foreground font-mono bg-secondary/50 rounded p-3 overflow-auto max-h-32 whitespace-pre-wrap">
                  {prompt.prompt.substring(0, 300)}{prompt.prompt.length > 300 ? "..." : ""}
                </pre>
              </div>
            ))
          ) : (
            <div className="bg-card border border-card-border rounded-lg p-12 text-center">
              <div className="text-muted-foreground text-sm">No saved prompts yet.</div>
              <button onClick={() => setTab("generate")} className="text-primary text-sm mt-2 block cursor-pointer hover:underline">
                Generate your first prompt
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
