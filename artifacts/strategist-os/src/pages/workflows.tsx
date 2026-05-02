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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="bg-card border border-card-border rounded-lg overflow-hidden" data-testid={`card-workflow-${wf.id}`}>
      <button
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-workflow-${wf.id}`}
      >
        <div className="text-left">
          <div className="text-sm font-semibold text-foreground">{wf.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{wf.description}</div>
        </div>
        <div className="flex items-center gap-3">
          {wf.isTemplate && (
            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded font-medium">Template</span>
          )}
          <span className="text-muted-foreground text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-card-border pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Trigger</div>
              <p className="text-sm text-foreground">{wf.trigger}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Inputs</div>
              <ul className="space-y-1">
                {wf.inputs.map((inp, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-primary">→</span>{inp}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">AI Task</div>
              <p className="text-sm text-foreground">{wf.aiTask}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Tools</div>
              <div className="flex flex-wrap gap-1">
                {wf.tools.map((t) => (
                  <span key={t} className="bg-secondary text-foreground text-xs px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Output</div>
              <p className="text-sm text-foreground">{wf.output}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Human Review Step</div>
              <p className="text-sm text-foreground">{wf.humanReviewStep}</p>
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
            <div className="text-xs font-semibold text-primary mb-1">Monetisation / Use Case</div>
            <p className="text-sm text-foreground">{wf.monetisationUseCase}</p>
          </div>
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(wf.id)}
              className="text-destructive"
              data-testid={`button-delete-workflow-${wf.id}`}
            >
              Delete Workflow
            </Button>
          )}
        </div>
      )}
    </div>
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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Agent Workflow Designer</h1>
          <p className="text-muted-foreground text-sm mt-1">Design, save, and deploy AI agent workflows.</p>
        </div>
        <Button onClick={() => setTab("create")} data-testid="button-create-workflow">
          Create Workflow
        </Button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        {(["templates", "custom", "create"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-workflows-${t}`}
          >
            {t === "templates" ? `Templates (${templates.data?.length ?? 0})` : t === "custom" ? `My Workflows (${custom.data?.length ?? 0})` : "Create"}
          </button>
        ))}
      </div>

      {tab === "templates" && (
        <div className="space-y-3">
          {templates.isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-card-border rounded-lg p-5">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-64" />
                </div>
              ))
            : templates.data?.map((wf) => (
                <WorkflowCard key={wf.id} wf={wf as Workflow} />
              ))}
        </div>
      )}

      {tab === "custom" && (
        <div className="space-y-3">
          {custom.isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-card border border-card-border rounded-lg p-5">
                  <Skeleton className="h-4 w-48 mb-2" />
                </div>
              ))
            : custom.data && custom.data.length > 0
            ? custom.data.map((wf) => (
                <WorkflowCard key={wf.id} wf={wf as Workflow} onDelete={handleDelete} />
              ))
            : (
                <div className="bg-card border border-card-border rounded-lg p-12 text-center">
                  <div className="text-muted-foreground text-sm">No custom workflows yet.</div>
                  <button onClick={() => setTab("create")} className="text-primary text-sm mt-2 block cursor-pointer hover:underline">
                    Create your first workflow
                  </button>
                </div>
              )}
        </div>
      )}

      {tab === "create" && (
        <div className="bg-card border border-card-border rounded-lg p-6 space-y-5 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wf-name">Workflow Name *</Label>
              <Input id="wf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. LinkedIn Content Engine" data-testid="input-workflow-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-trigger">Trigger *</Label>
              <Input id="wf-trigger" value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} placeholder="e.g. Weekly schedule, user input" data-testid="input-workflow-trigger" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wf-desc">Description</Label>
            <Input id="wf-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this workflow do?" data-testid="input-workflow-description" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wf-ai-task">AI Task</Label>
            <Textarea id="wf-ai-task" value={form.aiTask} onChange={(e) => setForm({ ...form, aiTask: e.target.value })} placeholder="What should the AI do?" rows={2} data-testid="input-workflow-ai-task" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wf-inputs">Inputs (comma-separated)</Label>
              <Input id="wf-inputs" value={form.inputs} onChange={(e) => setForm({ ...form, inputs: e.target.value })} placeholder="Topic, audience, tone" data-testid="input-workflow-inputs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-tools">Tools (comma-separated)</Label>
              <Input id="wf-tools" value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} placeholder="OpenAI, Zapier, Notion" data-testid="input-workflow-tools" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wf-output">Output</Label>
            <Input id="wf-output" value={form.output} onChange={(e) => setForm({ ...form, output: e.target.value })} placeholder="What does the workflow produce?" data-testid="input-workflow-output" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wf-review">Human Review Step</Label>
            <Input id="wf-review" value={form.humanReviewStep} onChange={(e) => setForm({ ...form, humanReviewStep: e.target.value })} placeholder="Where does a human need to check the output?" data-testid="input-workflow-review" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wf-monetise">Monetisation / Use Case</Label>
            <Textarea id="wf-monetise" value={form.monetisationUseCase} onChange={(e) => setForm({ ...form, monetisationUseCase: e.target.value })} placeholder="How does this create value or revenue?" rows={2} data-testid="input-workflow-monetisation" />
          </div>

          <Button onClick={handleCreate} disabled={create.isPending} className="w-full" data-testid="button-submit-workflow">
            {create.isPending ? "Creating..." : "Create Workflow"}
          </Button>
        </div>
      )}
    </div>
  );
}
