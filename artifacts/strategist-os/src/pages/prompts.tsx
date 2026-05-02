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
  { id: "offer-creation", label: "Offer Creation" },
  { id: "replit-app-building", label: "Replit App Building" },
  { id: "data-science", label: "Data Science" },
  { id: "phd-research", label: "PhD / Research" },
] as const;

type GeneratedPrompt = { title: string; category: string; prompt: string; usage: string; variables: string[] };

function HudBtn({ onClick, disabled, children, variant = "primary", "data-testid": dt }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: "primary" | "ghost" | "dim"; "data-testid"?: string }) {
  const styles: React.CSSProperties =
    variant === "primary"
      ? { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#121317", background: disabled ? "rgba(255,255,255,0.5)" : "#ffffff", border: "none", padding: "11px 24px", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif", width: "100%", transition: "background 0.1s" }
      : variant === "ghost"
      ? { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", background: "none", border: "1px solid rgba(255,255,255,0.12)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", opacity: disabled ? 0.4 : 1 }
      : { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4b8eff", background: "none", border: "1px solid rgba(75,142,255,0.25)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" };
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
    del.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedPromptsQueryKey() });
        toast({ title: "Prompt removed" });
      },
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#121317" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#ffffff", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
          Prompt_Arsenal
        </span>
        {/* Tab switcher */}
        <div className="flex" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {(["generate", "saved"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`tab-${t}`}
              style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "7px 16px", cursor: "pointer", border: "none",
                background: tab === t ? "rgba(255,255,255,0.08)" : "transparent",
                color: tab === t ? "#ffffff" : "rgba(255,255,255,0.35)",
                fontFamily: "Space Grotesk, sans-serif",
                borderRight: t === "generate" ? "1px solid rgba(255,255,255,0.1)" : "none",
                transition: "background 0.1s",
              }}
            >
              {t === "generate" ? "Generate" : `Saved (${savedPrompts.data?.length ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      {tab === "generate" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left — category selector */}
          <div
            className="flex flex-col shrink-0 overflow-y-auto py-6"
            style={{ width: 200, borderRight: "1px solid rgba(255,255,255,0.07)", paddingLeft: 24, paddingRight: 16 }}
          >
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 14 }}>Category</div>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  data-testid={`button-category-${cat.id}`}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    fontSize: 12, padding: "8px 10px",
                    background: category === cat.id ? "rgba(255,255,255,0.06)" : "transparent",
                    borderLeft: category === cat.id ? "2px solid #ffffff" : "2px solid transparent",
                    color: category === cat.id ? "#ffffff" : "rgba(255,255,255,0.38)",
                    fontWeight: category === cat.id ? 600 : 400,
                    cursor: "pointer", border: "none",
                    borderLeftWidth: 2,
                    borderLeftStyle: "solid",
                    borderLeftColor: category === cat.id ? "#ffffff" : "transparent",
                    transition: "all 0.1s",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right — form + output */}
          <div className="flex-1 overflow-y-auto px-8 py-7 space-y-6">
            <div className="space-y-5 max-w-2xl">
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Context</div>
                <textarea
                  id="prompt-context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Describe your specific situation, background, or problem..."
                  rows={4}
                  data-testid="input-prompt-context"
                  style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Goal</div>
                <input
                  id="prompt-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What do you want this prompt to help you achieve?"
                  data-testid="input-prompt-goal"
                  style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }}
                />
              </div>
              <HudBtn onClick={handleGenerate} disabled={generate.isPending} data-testid="button-generate-prompt">
                {generate.isPending ? "Generating..." : "Generate Prompt"}
              </HudBtn>
            </div>

            {generated && (
              <div className="max-w-2xl" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)", padding: 24 }}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", marginBottom: 3 }}>{generated.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "capitalize", letterSpacing: "0.04em" }}>{generated.category.replace(/-/g, " ")}</div>
                  </div>
                  <div className="flex gap-2">
                    <HudBtn variant="ghost" onClick={handleCopy} data-testid="button-copy-prompt">{copied ? "Copied" : "Copy"}</HudBtn>
                    <HudBtn variant="dim" onClick={handleSave} disabled={save.isPending} data-testid="button-save-prompt">Save</HudBtn>
                  </div>
                </div>

                <div style={{ background: "#0d0e12", padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <pre style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "Space Grotesk, monospace", whiteSpace: "pre-wrap", lineHeight: 1.7, overflow: "auto", maxHeight: 280 }}>
                    {generated.prompt}
                  </pre>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Usage guidance</div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{generated.usage}</p>
                </div>

                {generated.variables.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Variables to fill in</div>
                    <div className="flex flex-wrap gap-2">
                      {generated.variables.map((v) => (
                        <span key={v} style={{ background: "rgba(75,142,255,0.1)", border: "1px solid rgba(75,142,255,0.2)", color: "#4b8eff", fontSize: 11, padding: "3px 8px", fontFamily: "Space Grotesk, monospace" }}>
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
              <div key={i} className="mb-3 p-5 animate-pulse" style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)", height: 90 }} />
            ))
          ) : savedPrompts.data && savedPrompts.data.length > 0 ? (
            <div className="space-y-3 max-w-3xl">
              {savedPrompts.data.map((prompt) => (
                <div key={prompt.id} style={{ background: "#1e1f23", border: "1px solid rgba(255,255,255,0.07)" }} data-testid={`card-saved-prompt-${prompt.id}`}>
                  <div className="flex items-start justify-between p-5 pb-4">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", marginBottom: 3 }}>{prompt.title}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "capitalize", letterSpacing: "0.04em" }}>{prompt.category.replace(/-/g, " ")}</div>
                    </div>
                    <div className="flex gap-2">
                      <HudBtn variant="ghost" onClick={() => { navigator.clipboard.writeText(prompt.prompt); toast({ title: "Copied" }); }} data-testid={`button-copy-saved-prompt-${prompt.id}`}>Copy</HudBtn>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        data-testid={`button-delete-saved-prompt-${prompt.id}`}
                        style={{ fontSize: 10, color: "rgba(255,180,171,0.6)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px" }}>
                    <pre style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk, monospace", overflow: "hidden", maxHeight: 64, whiteSpace: "pre-wrap" }}>
                      {prompt.prompt.substring(0, 220)}{prompt.prompt.length > 220 ? "..." : ""}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>No prompts saved.</div>
              <button onClick={() => setTab("generate")} style={{ fontSize: 12, color: "#4b8eff", background: "none", border: "none", cursor: "pointer" }}>
                Generate a prompt to begin.
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
