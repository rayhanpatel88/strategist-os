import { useState } from "react";
import {
  useListWorkflows,
  useListWorkflowTemplates,
  useCreateWorkflow,
  useDeleteWorkflow,
  getListWorkflowsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Workflow = {
  id: number;
  name: string;
  description: string;
  trigger: string;
  inputs: string[];
  aiTask: string;
  tools: string[];
  output: string;
  humanReviewStep: string;
  monetisationUseCase: string;
  isTemplate: boolean;
  createdAt: string;
};

function WorkflowCard({ wf, onDelete }: { wf: Workflow; onDelete?: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }} data-testid={`card-workflow-${wf.id}`}>
      <button
        className="w-full"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-workflow-${wf.id}`}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
          transition: "background 0.1s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--sos-row-hover)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sos-text)", marginBottom: 3 }}>{wf.name}</div>
          <div style={{ fontSize: 11, color: "var(--sos-text-dim)" }}>{wf.description}</div>
        </div>
        <div className="flex items-center gap-3">
          {wf.isTemplate && (
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-blue)", border: "1px solid var(--sos-blue-border)", padding: "3px 8px", fontFamily: "Space Grotesk, sans-serif" }}>
              Template
            </span>
          )}
          <span style={{ fontSize: 10, color: "var(--sos-text-subtle)" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--sos-border)" }}>
          <div className="grid grid-cols-2 gap-5 pt-5">
            {[
              { label: "Trigger", content: <p style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.6 }}>{wf.trigger}</p> },
              {
                label: "Inputs",
                content: (
                  <ul className="space-y-1.5">
                    {wf.inputs.map((inp, i) => (
                      <li key={i} className="flex gap-2" style={{ fontSize: 12, color: "var(--sos-text-secondary)" }}>
                        <span style={{ color: "var(--sos-blue)" }}>→</span>{inp}
                      </li>
                    ))}
                  </ul>
                ),
              },
              { label: "AI Task", content: <p style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.6 }}>{wf.aiTask}</p> },
              {
                label: "Tools",
                content: (
                  <div className="flex flex-wrap gap-1.5">
                    {wf.tools.map((t) => (
                      <span key={t} style={{ fontSize: 10, color: "var(--sos-text-secondary)", border: "1px solid var(--sos-ghost-border)", padding: "3px 8px", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.04em" }}>{t}</span>
                    ))}
                  </div>
                ),
              },
              { label: "Output", content: <p style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.6 }}>{wf.output}</p> },
              { label: "Human Review Step", content: <p style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.6 }}>{wf.humanReviewStep}</p> },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{item.label}</div>
                {item.content}
              </div>
            ))}
          </div>

          <div style={{ background: "var(--sos-blue-tint)", border: "1px solid var(--sos-blue-border)", padding: 14, marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-blue)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Use Case</div>
            <p style={{ fontSize: 12, color: "var(--sos-text-body)", lineHeight: 1.65 }}>{wf.monetisationUseCase}</p>
          </div>

          {onDelete && (
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => onDelete(wf.id)}
                data-testid={`button-delete-workflow-${wf.id}`}
                style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-error-dim)", background: "none", border: "1px solid var(--sos-error-dim)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}
              >
                Delete Workflow
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HudBtn({ onClick, disabled, children, variant = "primary", "data-testid": dt }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: "primary" | "ghost"; "data-testid"?: string }) {
  if (variant === "ghost") {
    return (
      <button onClick={onClick} disabled={disabled} data-testid={dt}
        style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", opacity: disabled ? 0.4 : 1 }}>
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

export default function Workflows() {
  const [tab, setTab] = useState<"templates" | "custom" | "create">("templates");
  const [form, setForm] = useState({
    name: "", description: "", trigger: "", inputs: "", aiTask: "",
    tools: "", output: "", humanReviewStep: "", monetisationUseCase: "",
  });

  const templates = useListWorkflowTemplates();
  const custom = useListWorkflows();
  const create = useCreateWorkflow();
  const del = useDeleteWorkflow();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!form.name || !form.trigger) {
      toast({ title: "Name and trigger are required", variant: "destructive" });
      return;
    }
    create.mutate(
      {
        data: {
          ...form,
          inputs: form.inputs.split(",").map((s) => s.trim()).filter(Boolean),
          tools: form.tools.split(",").map((s) => s.trim()).filter(Boolean),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
          toast({ title: "Workflow created" });
          setTab("custom");
          setForm({ name: "", description: "", trigger: "", inputs: "", aiTask: "", tools: "", output: "", humanReviewStep: "", monetisationUseCase: "" });
        },
        onError: () => toast({ title: "Failed to create workflow", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    del.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkflowsQueryKey() });
        toast({ title: "Workflow deleted" });
      },
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
          Workflow_Designer
        </span>
        <div className="flex items-center gap-3">
          <HudBtn variant="ghost" onClick={() => setTab("create")} data-testid="button-create-workflow">+ Create Workflow</HudBtn>
          {/* Tab switcher */}
          <div className="flex" style={{ border: "1px solid var(--sos-ghost-border)" }}>
            {(["templates", "custom"] as const).map((t, idx) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                data-testid={`tab-workflows-${t}`}
                style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "7px 14px", cursor: "pointer", border: "none",
                  background: tab === t ? "var(--sos-tab-active-bg)" : "transparent",
                  color: tab === t ? "var(--sos-text)" : "var(--sos-text-dim)",
                  fontFamily: "Space Grotesk, sans-serif",
                  borderRight: idx === 0 ? "1px solid var(--sos-ghost-border)" : "none",
                }}
              >
                {t === "templates" ? `Templates (${templates.data?.length ?? 0})` : `Mine (${custom.data?.length ?? 0})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7">
        {tab === "templates" && (
          <div className="space-y-2 max-w-4xl">
            {templates.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", height: 64 }} />
                ))
              : templates.data?.map((wf) => (
                  <WorkflowCard key={wf.id} wf={wf as Workflow} />
                ))}
          </div>
        )}

        {tab === "custom" && (
          <div className="space-y-2 max-w-4xl">
            {custom.isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="animate-pulse" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", height: 64 }} />
                ))
              : custom.data && custom.data.length > 0
              ? custom.data.map((wf) => (
                  <WorkflowCard key={wf.id} wf={wf as Workflow} onDelete={handleDelete} />
                ))
              : (
                  <div className="py-20 text-center">
                    <div style={{ fontSize: 12, color: "var(--sos-text-muted)", marginBottom: 10 }}>No custom workflows saved.</div>
                    <button onClick={() => setTab("create")} style={{ fontSize: 12, color: "var(--sos-blue)", background: "none", border: "none", cursor: "pointer" }}>
                      Create a workflow to begin.
                    </button>
                  </div>
                )}
          </div>
        )}

        {tab === "create" && (
          <div className="max-w-2xl space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Workflow Name *</div>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. LinkedIn Content Engine" data-testid="input-workflow-name" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Trigger *</div>
                <input value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} placeholder="e.g. Weekly schedule, user input" data-testid="input-workflow-trigger" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Description</div>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this workflow do?" data-testid="input-workflow-description" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>AI Task</div>
              <textarea value={form.aiTask} onChange={(e) => setForm({ ...form, aiTask: e.target.value })} placeholder="What should the AI do?" rows={2} data-testid="input-workflow-ai-task" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Inputs (comma-separated)</div>
                <input value={form.inputs} onChange={(e) => setForm({ ...form, inputs: e.target.value })} placeholder="Topic, audience, tone" data-testid="input-workflow-inputs" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Tools (comma-separated)</div>
                <input value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} placeholder="OpenAI, Zapier, Notion" data-testid="input-workflow-tools" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Output</div>
              <input value={form.output} onChange={(e) => setForm({ ...form, output: e.target.value })} placeholder="What does the workflow produce?" data-testid="input-workflow-output" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Human Review Step</div>
              <input value={form.humanReviewStep} onChange={(e) => setForm({ ...form, humanReviewStep: e.target.value })} placeholder="Where does a human need to check the output?" data-testid="input-workflow-review" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4 }} />
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Monetisation / Use Case</div>
              <textarea value={form.monetisationUseCase} onChange={(e) => setForm({ ...form, monetisationUseCase: e.target.value })} placeholder="How does this create value or revenue?" rows={2} data-testid="input-workflow-monetisation" style={{ width: "100%", fontSize: 13, paddingBottom: 8, paddingTop: 4, resize: "none", lineHeight: 1.6 }} />
            </div>

            <div className="pt-2">
              <HudBtn onClick={handleCreate} disabled={create.isPending} data-testid="button-submit-workflow">
                {create.isPending ? "Creating..." : "Create Workflow"}
              </HudBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
