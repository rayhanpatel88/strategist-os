import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type GoalStatus = "Not Started" | "In Progress" | "On Track" | "At Risk" | "Complete";
type GoalType = "monthly" | "quarterly";
type KeyResult = { id: string; text: string; done: boolean };

type Goal = {
  id: number;
  title: string;
  description: string;
  type: GoalType;
  status: GoalStatus;
  progress: number;
  targetDate: string;
  category: string;
  keyResults: KeyResult[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type GoalForm = {
  title: string;
  description: string;
  type: GoalType;
  status: GoalStatus;
  progress: number;
  targetDate: string;
  category: string;
  keyResults: KeyResult[];
  notes: string;
};

const STATUSES: GoalStatus[] = ["Not Started", "In Progress", "On Track", "At Risk", "Complete"];
const CATEGORIES = ["Growth", "Revenue", "Product", "Personal", "Learning", "Health", "Brand", "Other"];

const STATUS_COLOR: Record<GoalStatus, string> = {
  "Not Started": "var(--sos-text-dim)",
  "In Progress": "var(--sos-blue)",
  "On Track": "var(--sos-emerald)",
  "At Risk": "#f59e0b",
  "Complete": "var(--sos-emerald)",
};

const STATUS_BG: Record<GoalStatus, string> = {
  "Not Started": "transparent",
  "In Progress": "rgba(59,130,246,0.1)",
  "On Track": "rgba(114,254,136,0.08)",
  "At Risk": "rgba(245,158,11,0.1)",
  "Complete": "rgba(114,254,136,0.12)",
};

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function endOfQuarter(): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  return new Date(now.getFullYear(), (q + 1) * 3, 0).toISOString().split("T")[0];
}

function endOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
}

function emptyForm(type: GoalType = "quarterly"): GoalForm {
  return {
    title: "",
    description: "",
    type,
    status: "Not Started",
    progress: 0,
    targetDate: type === "quarterly" ? endOfQuarter() : endOfMonth(),
    category: "Growth",
    keyResults: [],
    notes: "",
  };
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 3, background: "var(--sos-border-s)", width: "100%", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${value}%`, background: color, transition: "width 0.3s ease" }} />
    </div>
  );
}

type Tab = "all" | "quarterly" | "monthly";

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [krInput, setKrInput] = useState("");
  const [expandedKr, setExpandedKr] = useState<Set<number>>(new Set());
  const progressTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const { toast } = useToast();

  const fetchGoals = useCallback(() => {
    setLoading(true);
    fetch(`${basePath}/api/goals`)
      .then((r) => r.json())
      .then((d) => setGoals(d.goals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const filtered = useMemo(() => goals.filter((g) => tab === "all" || g.type === tab), [goals, tab]);

  const stats = useMemo(() => ({
    total: goals.length,
    complete: goals.filter((g) => g.status === "Complete").length,
    active: goals.filter((g) => ["In Progress", "On Track"].includes(g.status)).length,
    avgProgress: goals.length > 0 ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0,
  }), [goals]);

  const openCreate = (type: GoalType = "quarterly") => {
    setEditingGoal(null);
    setForm(emptyForm(type));
    setKrInput("");
    setModalOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title, description: goal.description, type: goal.type,
      status: goal.status, progress: goal.progress, targetDate: goal.targetDate,
      category: goal.category, keyResults: [...goal.keyResults], notes: goal.notes,
    });
    setKrInput("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      if (editingGoal) {
        const r = await fetch(`${basePath}/api/goals/${editingGoal.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        const data = await r.json();
        setGoals((gs) => gs.map((g) => g.id === editingGoal.id ? data.goal : g));
      } else {
        const r = await fetch(`${basePath}/api/goals`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        const data = await r.json();
        setGoals((gs) => [data.goal, ...gs]);
      }
      setModalOpen(false);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this goal? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`${basePath}/api/goals/${id}`, { method: "DELETE" });
      setGoals((gs) => gs.filter((g) => g.id !== id));
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleKr = async (goal: Goal, krId: string) => {
    const updated = goal.keyResults.map((kr) => kr.id === krId ? { ...kr, done: !kr.done } : kr);
    setGoals((gs) => gs.map((g) => g.id === goal.id ? { ...g, keyResults: updated } : g));
    await fetch(`${basePath}/api/goals/${goal.id}/key-result`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyResults: updated }),
    });
  };

  const updateProgress = (goal: Goal, progress: number) => {
    setGoals((gs) => gs.map((g) => g.id === goal.id ? { ...g, progress } : g));
    const existing = progressTimers.current.get(goal.id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(async () => {
      await fetch(`${basePath}/api/goals/${goal.id}/progress`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress }),
      });
      progressTimers.current.delete(goal.id);
    }, 600);
    progressTimers.current.set(goal.id, t);
  };

  const addKr = () => {
    if (!krInput.trim()) return;
    setForm((f) => ({ ...f, keyResults: [...f.keyResults, { id: uid(), text: krInput.trim(), done: false }] }));
    setKrInput("");
  };

  const computeProgressFromKr = () => {
    if (form.keyResults.length === 0) return;
    const done = form.keyResults.filter((k) => k.done).length;
    const pct = Math.round((done / form.keyResults.length) * 100);
    setForm((f) => ({ ...f, progress: pct }));
  };

  const toggleExpand = (id: number) =>
    setExpandedKr((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const tabStyle = (t: Tab) => ({
    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const,
    padding: "7px 16px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif",
    color: tab === t ? "var(--sos-text)" : "var(--sos-text-dim)",
    background: "none", border: "none",
    borderBottom: tab === t ? "2px solid var(--sos-emerald)" : "2px solid transparent",
  });

  const inputStyle = {
    width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)",
    border: "1px solid var(--sos-border-s)", padding: "8px 10px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--sos-bg)", display: "flex", flexDirection: "column" }}>

      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
            Goals
          </div>
          <div style={{ fontSize: 11, color: "var(--sos-text-dim)", marginTop: 2 }}>
            Quarterly and monthly targets
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openCreate("quarterly")}
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
            + Quarterly
          </button>
          <button onClick={() => openCreate("monthly")}
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: "var(--sos-btn-bg)", border: "none", padding: "8px 20px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
            + Monthly
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderBottom: "1px solid var(--sos-border)", gap: 1, background: "var(--sos-border-s)" }}>
          {[
            { label: "Total Goals", value: stats.total },
            { label: "Complete", value: stats.complete, color: "var(--sos-emerald)" },
            { label: "Active", value: stats.active, color: "var(--sos-blue)" },
            { label: "Avg Progress", value: `${stats.avgProgress}%` },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--sos-surface)", padding: "14px 20px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: (s as any).color ?? "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid var(--sos-border)", paddingLeft: 12 }}>
        <button style={tabStyle("all")} onClick={() => setTab("all")}>All ({goals.length})</button>
        <button style={tabStyle("quarterly")} onClick={() => setTab("quarterly")}>Quarterly ({goals.filter((g) => g.type === "quarterly").length})</button>
        <button style={tabStyle("monthly")} onClick={() => setTab("monthly")}>Monthly ({goals.filter((g) => g.type === "monthly").length})</button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center" style={{ paddingTop: 80 }}>
            <span style={{ fontSize: 12, color: "var(--sos-text-muted)", letterSpacing: "0.06em" }}>Loading goals...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ paddingTop: 80, gap: 16 }}>
            <div style={{ fontSize: 32, opacity: 0.3 }}>🎯</div>
            <div style={{ fontSize: 13, color: "var(--sos-text-dim)", fontWeight: 500 }}>No {tab !== "all" ? tab : ""} goals yet</div>
            <button onClick={() => openCreate(tab === "all" ? "quarterly" : tab as GoalType)}
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: "var(--sos-btn-bg)", border: "none", padding: "10px 24px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
              Add your first goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 1, background: "var(--sos-border-s)" }}>
            {filtered.map((goal) => {
              const days = daysUntil(goal.targetDate);
              const statusColor = STATUS_COLOR[goal.status];
              const doneKr = goal.keyResults.filter((k) => k.done).length;
              const expanded = expandedKr.has(goal.id);

              return (
                <div key={goal.id}
                  style={{ background: "var(--sos-surface)", borderLeft: `3px solid ${statusColor}`, display: "flex", flexDirection: "column", gap: 0 }}>

                  {/* Card Header */}
                  <div className="flex items-start justify-between px-5 pt-5 pb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: goal.type === "quarterly" ? "var(--sos-blue)" : "#8b5cf6", fontFamily: "Space Grotesk, sans-serif" }}>
                          {goal.type}
                        </span>
                        {goal.category && (
                          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "var(--sos-bg)", border: "1px solid var(--sos-border-s)", padding: "2px 6px" }}>
                            {goal.category}
                          </span>
                        )}
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: statusColor, background: STATUS_BG[goal.status], padding: "2px 7px" }}>
                          {goal.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.3 }}>
                        {goal.title}
                      </div>
                      {goal.description && (
                        <div style={{ fontSize: 11, color: "var(--sos-text-muted)", marginTop: 5, lineHeight: 1.5 }}>
                          {goal.description}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-3 shrink-0">
                      <button onClick={() => openEdit(goal)}
                        style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(goal.id)} disabled={deletingId === goal.id}
                        style={{ fontSize: 10, color: "var(--sos-error)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", opacity: deletingId === goal.id ? 0.4 : 1 }}>
                        {deletingId === goal.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="px-5 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>Progress</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, fontFamily: "Space Grotesk, sans-serif" }}>{goal.progress}%</span>
                    </div>
                    <ProgressBar value={goal.progress} color={statusColor} />
                    <input type="range" min={0} max={100} value={goal.progress}
                      onChange={(e) => updateProgress(goal, parseInt(e.target.value, 10))}
                      style={{ width: "100%", marginTop: 6, accentColor: "var(--sos-emerald)", cursor: "pointer" }} />
                  </div>

                  {/* Key Results */}
                  {goal.keyResults.length > 0 && (
                    <div className="px-5 pb-3">
                      <button onClick={() => toggleExpand(goal.id)}
                        style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "Space Grotesk, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                        Key Results ({doneKr}/{goal.keyResults.length})
                        <span style={{ fontSize: 10, opacity: 0.6 }}>{expanded ? "▲" : "▼"}</span>
                      </button>
                      {expanded && (
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                          {goal.keyResults.map((kr) => (
                            <label key={kr.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
                              <input type="checkbox" checked={kr.done}
                                onChange={() => toggleKr(goal, kr.id)}
                                style={{ marginTop: 1, accentColor: "var(--sos-emerald)", cursor: "pointer", flexShrink: 0 }} />
                              <span style={{ fontSize: 11, color: kr.done ? "var(--sos-text-dim)" : "var(--sos-text-body)", textDecoration: kr.done ? "line-through" : "none", lineHeight: 1.4 }}>
                                {kr.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 py-3 mt-auto" style={{ borderTop: "1px solid var(--sos-border-s)" }}>
                    <span style={{ fontSize: 10, color: "var(--sos-text-dim)" }}>Due {formatDate(goal.targetDate)}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, fontFamily: "Space Grotesk, sans-serif",
                      color: goal.status === "Complete" ? "var(--sos-emerald)" : days < 0 ? "var(--sos-error)" : days <= 14 ? "#f59e0b" : "var(--sos-text-dim)",
                    }}>
                      {goal.status === "Complete" ? "Done" : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-start justify-center" style={{ background: "rgba(0,0,0,0.6)", zIndex: 110, overflowY: "auto", padding: "24px 16px" }}>
          <div style={{ background: "var(--sos-bg)", border: "1px solid var(--sos-border)", width: "100%", maxWidth: 620 }}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--sos-border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
                {editingGoal ? "Edit Goal" : "New Goal"}
              </div>
              <button onClick={() => setModalOpen(false)}
                style={{ fontSize: 18, color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", padding: "2px 8px", lineHeight: 1 }}>
                ×
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col" style={{ gap: 18 }}>

              {/* Type Toggle */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>Type</div>
                <div className="flex">
                  {(["quarterly", "monthly"] as GoalType[]).map((t) => (
                    <button key={t} onClick={() => setForm((f) => ({ ...f, type: t, targetDate: t === "quarterly" ? endOfQuarter() : endOfMonth() }))}
                      style={{ flex: 1, padding: "9px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", border: "1px solid var(--sos-border-s)", background: form.type === t ? (t === "quarterly" ? "rgba(59,130,246,0.12)" : "rgba(139,92,246,0.12)") : "var(--sos-surface)", color: form.type === t ? (t === "quarterly" ? "var(--sos-blue)" : "#8b5cf6") : "var(--sos-text-dim)" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>Title</div>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="What do you want to achieve?" style={inputStyle} />
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-2" style={{ gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>Category</div>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={inputStyle}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>Status</div>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as GoalStatus }))} style={{ ...inputStyle, color: STATUS_COLOR[form.status] }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Target Date + Progress */}
              <div className="grid grid-cols-2" style={{ gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>Target Date</div>
                  <input type="date" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>Progress</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--sos-emerald)", fontFamily: "Space Grotesk, sans-serif" }}>{form.progress}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={form.progress}
                    onChange={(e) => setForm((f) => ({ ...f, progress: parseInt(e.target.value, 10) }))}
                    style={{ width: "100%", accentColor: "var(--sos-emerald)", marginTop: 8 }} />
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>Description</div>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Optional context or outcome statement" style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
              </div>

              {/* Key Results */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>Key Results</div>
                  {form.keyResults.length > 0 && (
                    <button onClick={computeProgressFromKr}
                      style={{ fontSize: 9, color: "var(--sos-blue)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.06em" }}>
                      Compute progress from KRs
                    </button>
                  )}
                </div>
                {form.keyResults.length > 0 && (
                  <div style={{ marginBottom: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {form.keyResults.map((kr, i) => (
                      <div key={kr.id} className="flex items-center gap-2" style={{ padding: "6px 10px", background: "var(--sos-surface)", border: "1px solid var(--sos-border-s)" }}>
                        <input type="checkbox" checked={kr.done}
                          onChange={() => setForm((f) => ({ ...f, keyResults: f.keyResults.map((k) => k.id === kr.id ? { ...k, done: !k.done } : k) }))}
                          style={{ accentColor: "var(--sos-emerald)", cursor: "pointer", flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 11, color: kr.done ? "var(--sos-text-dim)" : "var(--sos-text-body)", textDecoration: kr.done ? "line-through" : "none" }}>{kr.text}</span>
                        <button onClick={() => setForm((f) => ({ ...f, keyResults: f.keyResults.filter((k) => k.id !== kr.id) }))}
                          style={{ fontSize: 11, color: "var(--sos-error)", background: "none", border: "none", cursor: "pointer", padding: "0 2px", opacity: 0.7 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={krInput} onChange={(e) => setKrInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKr(); } }}
                    placeholder="Add a key result and press Enter" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={addKr}
                    style={{ fontSize: 10, fontWeight: 700, color: "var(--sos-emerald)", background: "rgba(114,254,136,0.08)", border: "1px solid rgba(114,254,136,0.2)", padding: "8px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", whiteSpace: "nowrap" }}>
                    Add
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>Notes</div>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Strategy, blockers, context..." style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: saving ? "var(--sos-btn-disabled-bg)" : "var(--sos-btn-bg)", border: "none", padding: "12px 32px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                  {saving ? "Saving..." : editingGoal ? "Save Changes" : "Create Goal"}
                </button>
                <button onClick={() => setModalOpen(false)}
                  style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "12px 20px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
