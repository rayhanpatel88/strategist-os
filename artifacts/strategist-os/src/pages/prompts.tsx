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

const CATEGORIES = [
  { id: "business-strategy", label: "Business Strategy" },
  { id: "academic-writing", label: "Academic Writing" },
  { id: "ai-automation", label: "AI Automation" },
  { id: "content-creation", label: "Content Creation" },
  { id: "linkedin-positioning", label: "LinkedIn Positioning" },
  { id: "offer-creation", label: "Offer Design" },
  { id: "replit-app-building", label: "Replit Development" },
  { id: "data-science", label: "Data Science" },
  { id: "phd-research", label: "PhD Research" },
] as const;

type GeneratedPrompt = { title: string; category: string; prompt: string; usage: string; variables: string[] };

function HudBtn({ onClick, disabled, children, variant = "primary", "data-testid": dt }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: "primary" | "ghost" | "dim"; "data-testid"?: string }) {
  const styles: React.CSSProperties =
    variant === "primary"
      ? { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: disabled ? "var(--sos-btn-disabled-bg)" : "var(--sos-btn-bg)", border: "none", padding: "11px 24px", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif", width: "100%" }
      : variant === "ghost"
      ? { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", opacity: disabled ? 0.4 : 1 }
      : { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-blue)", background: "none", border: "1px solid var(--sos-blue-border)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" };
  return (
    <button onClick={onClick} disabled={disabled} data-testid={dt} style={styles}>
      {children}
    </button>
  );
}

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
      toast({ title: "Context and goal are required", variant: "destructive" });
      return;
    }
    generate.mutate({ data: { category, context, goal } }, {
      onSuccess: (data) => setGenerated(data as GeneratedPrompt),
      onError: () => toast({ title: "Generation failed. Please try again.", variant: "destructive" }),
    });
  };

  const handleCopy = () => {
    if (generated) {
      navigator.clipboard.writeText(generated.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard" });
    }
  };

  const handleSave = () => {
    if (!generated) return;
    save.mutate({ data: generated }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedPromptsQueryKey() });
        toast({ title: "Saved to arsenal" });
      },
    });
  };

  const handleDelete = (id: number) => {
    del.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedPromptsQueryKey() });
        toast({ title: "Prompt removed" });
      },
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
      <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
          Prompt Arsenal
        </span>
        <div className="flex" style={{ border: "1px solid var(--sos-ghost-border)" }}>
          {(["generate", "saved"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} data-testid={`tab-${t}`}
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "7px 16px", cursor: "pointer", border: "none", background: tab === t ? "var(--sos-tab-active-bg)" : "transparent", color: tab === t ? "var(--sos-text)" : "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif", borderRight: t === "generate" ? "1px solid var(--sos-ghost-border)" : "none" }}>
              {t === "generate" ? "Generate" : `Saved (${savedPrompts.data?.length ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      {tab === "generate" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Category selector */}
          <div className="flex flex-col shrink-0 overflow-y-auto py-6" style={{ width: 200, borderRight: "1px solid var(--sos-border)", paddingLeft: 24, paddingRight: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-muted)", textTransform: "uppercase", marginBottom: 14 }}>Category</div>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setCategory(cat.id)} data-testid={`button-category-${cat.id}`}
                  style={{ display: "block", width: "100%", textAlign: "left", fontSize: 12, padding: "8px 10px", background: category === cat.id ? "var(--sos-nav-active-bg)" : "transparent", color: category === cat.id ? "var(--sos-text)" : "var(--sos-text-dim)", fontWeight: category === cat.id ? 600 : 400, cursor: "pointer", border: "none", borderLeftWidth: 2, borderLeftStyle: "solid", borderLeftColor: category === cat.id ? "var(--sos-nav-active-border)" : "transparent" }}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form + output */}
          <div className="flex-1 overflow-y-auto px-8 py-7 space-y-6">
            <div className="space-y-5 max-w-2xl">
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Your Context</div>
                <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Describe your situation, background, or specific problem. The more precise, the better the prompt." rows={4} data-testid="input-prompt-context" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>What you want this prompt to do</div>
                <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Write a cold outreach message to a CTO at a Series A SaaS company" data-testid="input-prompt-goal" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
              </div>
              <HudBtn onClick={handleGenerate} disabled={generate.isPending} data-testid="button-generate-prompt">
                {generate.isPending ? "Generating..." : "Generate Prompt"}
              </HudBtn>
            </div>

            {generated && (
              <div className="max-w-2xl" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", padding: 24 }}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sos-text)", marginBottom: 3 }}>{generated.title}</div>
                    <div style={{ fontSize: 11, color: "var(--sos-text-dim)", textTransform: "capitalize", letterSpacing: "0.04em" }}>{generated.category.replace(/-/g, " ")}</div>
                  </div>
                  <div className="flex gap-2">
                    <HudBtn variant="ghost" onClick={handleCopy} data-testid="button-copy-prompt">{copied ? "Copied" : "Copy"}</HudBtn>
                    <HudBtn variant="dim" onClick={handleSave} disabled={save.isPending} data-testid="button-save-prompt">Save</HudBtn>
                  </div>
                </div>

                <div style={{ background: "var(--sos-surface-lowest)", padding: 16, marginBottom: 16, border: "1px solid var(--sos-border-s)" }}>
                  <pre style={{ fontSize: 12, color: "var(--sos-text-body)", fontFamily: "Space Grotesk, monospace", whiteSpace: "pre-wrap", lineHeight: 1.7, overflow: "auto", maxHeight: 280 }}>
                    {generated.prompt}
                  </pre>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>How to use this</div>
                  <p style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.6 }}>{generated.usage}</p>
                </div>

                {generated.variables.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Replace these variables</div>
                    <div className="flex flex-wrap gap-2">
                      {generated.variables.map((v) => (
                        <span key={v} style={{ background: "var(--sos-blue-tint)", border: "1px solid var(--sos-blue-border)", color: "var(--sos-blue)", fontSize: 11, padding: "3px 8px", fontFamily: "Space Grotesk, monospace" }}>
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
        <div className="flex-1 overflow-y-auto px-8 py-7">
          {savedPrompts.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mb-3 p-5 animate-pulse" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", height: 90 }} />
            ))
          ) : savedPrompts.data && savedPrompts.data.length > 0 ? (
            <div className="space-y-3 max-w-3xl">
              {savedPrompts.data.map((prompt) => (
                <div key={prompt.id} style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }} data-testid={`card-saved-prompt-${prompt.id}`}>
                  <div className="flex items-start justify-between p-5 pb-4">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sos-text)", marginBottom: 3 }}>{prompt.title}</div>
                      <div style={{ fontSize: 10, color: "var(--sos-text-dim)", textTransform: "capitalize", letterSpacing: "0.04em" }}>{prompt.category.replace(/-/g, " ")}</div>
                    </div>
                    <div className="flex gap-2">
                      <HudBtn variant="ghost" onClick={() => { navigator.clipboard.writeText(prompt.prompt); toast({ title: "Copied" }); }} data-testid={`button-copy-saved-prompt-${prompt.id}`}>Copy</HudBtn>
                      <button onClick={() => handleDelete(prompt.id)} data-testid={`button-delete-saved-prompt-${prompt.id}`}
                        style={{ fontSize: 10, color: "var(--sos-error-dim)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--sos-border)", padding: "12px 20px" }}>
                    <pre style={{ fontSize: 11, color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, monospace", overflow: "hidden", maxHeight: 64, whiteSpace: "pre-wrap" }}>
                      {prompt.prompt.substring(0, 220)}{prompt.prompt.length > 220 ? "..." : ""}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div style={{ fontSize: 12, color: "var(--sos-text-muted)", marginBottom: 10 }}>No prompts saved yet.</div>
              <button onClick={() => setTab("generate")} style={{ fontSize: 12, color: "var(--sos-blue)", background: "none", border: "none", cursor: "pointer" }}>
                Generate and save your first prompt.
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
