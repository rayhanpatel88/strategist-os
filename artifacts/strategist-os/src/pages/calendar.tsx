import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

type TimeBlock = {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  category: string;
  priority: string;
  status: string;
};

type CalTask = {
  id: string;
  name: string;
  priority: string;
  estimatedDuration: string;
  dueTime: string;
  linkedGoal: string;
  status: string;
};

type Review = {
  movedForward: string;
  delayed: string;
  friction: string;
  changes: string;
  score: number | null;
};

type PlanData = {
  objective: string;
  priorities: string[];
  notes: string;
  timeBlocks: TimeBlock[];
  tasks: CalTask[];
  review: Review;
};

const CATEGORIES = ["Deep Work", "Admin", "Study", "Client Work", "Content", "Health", "Personal", "Review"];
const BLOCK_STATUSES = ["Planned", "In Progress", "Complete", "Moved"];
const TASK_STATUSES = ["Not Started", "In Progress", "Done", "Deferred"];
const PRIORITIES = ["High", "Medium", "Low"];

const CAT_COLOR: Record<string, string> = {
  "Deep Work": "#3b82f6",
  Admin: "#6b7280",
  Study: "#8b5cf6",
  "Client Work": "#f59e0b",
  Content: "#14b8a6",
  Health: "#22c55e",
  Personal: "#ec4899",
  Review: "#eab308",
};

const STATUS_COLOR: Record<string, string> = {
  Planned: "var(--sos-text-muted)",
  "In Progress": "var(--sos-blue)",
  Complete: "var(--sos-emerald)",
  Moved: "#eab308",
  "Not Started": "var(--sos-text-muted)",
  Done: "var(--sos-emerald)",
  Deferred: "#eab308",
};

const PRI_COLOR: Record<string, string> = {
  High: "var(--sos-error)",
  Medium: "var(--sos-blue)",
  Low: "var(--sos-text-muted)",
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDisplayDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function shiftDate(d: string, delta: number) {
  const dt = new Date(d + "T12:00:00");
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().split("T")[0];
}

function emptyPlan(): PlanData {
  return {
    objective: "",
    priorities: ["", "", ""],
    notes: "",
    timeBlocks: [],
    tasks: [],
    review: { movedForward: "", delayed: "", friction: "", changes: "", score: null },
  };
}

const TEMPLATES: Record<string, Partial<PlanData>> = {
  "Deep Work Day": {
    objective: "Complete a significant output through sustained, distraction-free work.",
    priorities: ["Deep work block: minimum 4 uninterrupted hours", "No reactive tasks before 1pm", "Ship one concrete deliverable by end of day"],
    timeBlocks: [
      { startTime: "08:00", endTime: "08:30", activity: "Morning setup and context load", category: "Admin", priority: "Low", status: "Planned" },
      { startTime: "08:30", endTime: "12:30", activity: "Primary deep work block", category: "Deep Work", priority: "High", status: "Planned" },
      { startTime: "12:30", endTime: "13:15", activity: "Lunch break", category: "Health", priority: "Low", status: "Planned" },
      { startTime: "13:15", endTime: "15:30", activity: "Secondary deep work block", category: "Deep Work", priority: "High", status: "Planned" },
      { startTime: "15:30", endTime: "16:00", activity: "Communications and inbox clearance", category: "Admin", priority: "Medium", status: "Planned" },
      { startTime: "16:00", endTime: "16:30", activity: "End-of-day review", category: "Review", priority: "High", status: "Planned" },
    ].map((b) => ({ ...b, id: uid() })),
    tasks: [
      { name: "Ship primary deliverable", priority: "High", estimatedDuration: "4 hours", dueTime: "15:00", linkedGoal: "", status: "Not Started" },
      { name: "Clear inbox and communications in one batch", priority: "Medium", estimatedDuration: "30 min", dueTime: "16:00", linkedGoal: "", status: "Not Started" },
    ].map((t) => ({ ...t, id: uid() })),
  },
  "University Study Day": {
    objective: "Make measurable progress on coursework through structured study blocks with active recall.",
    priorities: ["Complete assigned readings before attempting problems", "Use active recall, not passive re-reading", "Submit any due assignments by 5pm"],
    timeBlocks: [
      { startTime: "08:00", endTime: "08:20", activity: "Review yesterday's notes: key points only", category: "Study", priority: "Medium", status: "Planned" },
      { startTime: "08:20", endTime: "10:30", activity: "Study block 1: core subject material", category: "Study", priority: "High", status: "Planned" },
      { startTime: "10:30", endTime: "10:45", activity: "Break", category: "Health", priority: "Low", status: "Planned" },
      { startTime: "10:45", endTime: "12:30", activity: "Study block 2: practice problems and application", category: "Study", priority: "High", status: "Planned" },
      { startTime: "12:30", endTime: "13:15", activity: "Lunch break", category: "Health", priority: "Low", status: "Planned" },
      { startTime: "13:15", endTime: "15:00", activity: "Study block 3: secondary subject or exam prep", category: "Study", priority: "High", status: "Planned" },
      { startTime: "15:00", endTime: "16:30", activity: "Assignment completion and submission", category: "Study", priority: "High", status: "Planned" },
      { startTime: "16:30", endTime: "17:00", activity: "Review what was learned and set tomorrow's focus", category: "Review", priority: "Medium", status: "Planned" },
    ].map((b) => ({ ...b, id: uid() })),
    tasks: [
      { name: "Complete assigned readings", priority: "High", estimatedDuration: "1.5 hours", dueTime: "10:00", linkedGoal: "", status: "Not Started" },
      { name: "Submit outstanding assignment", priority: "High", estimatedDuration: "2 hours", dueTime: "16:30", linkedGoal: "", status: "Not Started" },
      { name: "Create active recall flashcards for today's material", priority: "Medium", estimatedDuration: "30 min", dueTime: "17:00", linkedGoal: "", status: "Not Started" },
    ].map((t) => ({ ...t, id: uid() })),
  },
  "Client Delivery Day": {
    objective: "Deliver client-facing work on time, with all communications resolved before end of day.",
    priorities: ["Client deliverables shipped before 3pm", "All client communications responded to within 2 hours", "Document decisions and open questions for follow-up"],
    timeBlocks: [
      { startTime: "08:00", endTime: "08:30", activity: "Review client briefs, outstanding items, and today's deliverables", category: "Admin", priority: "High", status: "Planned" },
      { startTime: "08:30", endTime: "11:00", activity: "Client work block 1: primary deliverable", category: "Client Work", priority: "High", status: "Planned" },
      { startTime: "11:00", endTime: "11:30", activity: "Client communications batch", category: "Admin", priority: "Medium", status: "Planned" },
      { startTime: "11:30", endTime: "13:00", activity: "Client work block 2: review and polish", category: "Client Work", priority: "High", status: "Planned" },
      { startTime: "13:00", endTime: "13:45", activity: "Lunch break", category: "Health", priority: "Low", status: "Planned" },
      { startTime: "13:45", endTime: "15:30", activity: "Secondary client work or prep for next delivery", category: "Client Work", priority: "Medium", status: "Planned" },
      { startTime: "15:30", endTime: "16:00", activity: "Final client communications and handoff notes", category: "Admin", priority: "High", status: "Planned" },
      { startTime: "16:00", endTime: "16:30", activity: "Document open items and next steps for client", category: "Review", priority: "High", status: "Planned" },
    ].map((b) => ({ ...b, id: uid() })),
    tasks: [
      { name: "Ship primary client deliverable", priority: "High", estimatedDuration: "3 hours", dueTime: "14:00", linkedGoal: "", status: "Not Started" },
      { name: "Respond to all outstanding client emails", priority: "High", estimatedDuration: "45 min", dueTime: "11:30", linkedGoal: "", status: "Not Started" },
      { name: "Document decisions and open questions", priority: "Medium", estimatedDuration: "20 min", dueTime: "16:30", linkedGoal: "", status: "Not Started" },
    ].map((t) => ({ ...t, id: uid() })),
  },
  "Content Creation Day": {
    objective: "Produce and distribute one substantial content piece with a clear audience and message.",
    priorities: ["Draft is complete before editing begins", "Publish to at least one channel by 4pm", "Repurpose into one secondary format"],
    timeBlocks: [
      { startTime: "08:00", endTime: "08:30", activity: "Define the content angle, audience, and single key point", category: "Content", priority: "High", status: "Planned" },
      { startTime: "08:30", endTime: "11:00", activity: "Writing block: first draft, no editing", category: "Content", priority: "High", status: "Planned" },
      { startTime: "11:00", endTime: "11:15", activity: "Break", category: "Health", priority: "Low", status: "Planned" },
      { startTime: "11:15", endTime: "12:30", activity: "Editing and refinement", category: "Content", priority: "High", status: "Planned" },
      { startTime: "12:30", endTime: "13:15", activity: "Lunch break", category: "Health", priority: "Low", status: "Planned" },
      { startTime: "13:15", endTime: "14:30", activity: "Repurpose into secondary format (thread, clip, summary)", category: "Content", priority: "Medium", status: "Planned" },
      { startTime: "14:30", endTime: "15:30", activity: "Publish and distribute across channels", category: "Content", priority: "High", status: "Planned" },
      { startTime: "15:30", endTime: "16:00", activity: "Review metrics from previous content", category: "Review", priority: "Medium", status: "Planned" },
    ].map((b) => ({ ...b, id: uid() })),
    tasks: [
      { name: "Publish primary content piece", priority: "High", estimatedDuration: "4 hours", dueTime: "15:30", linkedGoal: "", status: "Not Started" },
      { name: "Repurpose into secondary format", priority: "Medium", estimatedDuration: "1 hour", dueTime: "14:30", linkedGoal: "", status: "Not Started" },
    ].map((t) => ({ ...t, id: uid() })),
  },
  "Admin Reset Day": {
    objective: "Clear the backlog, organise systems, and create a clean slate for the next productive period.",
    priorities: ["Inbox reaches zero", "All outstanding tasks triaged and scheduled", "Systems and files organised by end of day"],
    timeBlocks: [
      { startTime: "08:00", endTime: "09:30", activity: "Email and messages: process to zero, reply or defer", category: "Admin", priority: "High", status: "Planned" },
      { startTime: "09:30", endTime: "11:00", activity: "Outstanding tasks: complete, delegate, or cancel", category: "Admin", priority: "High", status: "Planned" },
      { startTime: "11:00", endTime: "11:15", activity: "Break", category: "Health", priority: "Low", status: "Planned" },
      { startTime: "11:15", endTime: "12:30", activity: "File and document organisation", category: "Admin", priority: "Medium", status: "Planned" },
      { startTime: "12:30", endTime: "13:15", activity: "Lunch break", category: "Health", priority: "Low", status: "Planned" },
      { startTime: "13:15", endTime: "15:00", activity: "Plan and schedule the next two weeks", category: "Admin", priority: "High", status: "Planned" },
      { startTime: "15:00", endTime: "16:00", activity: "System maintenance: tools, subscriptions, bookmarks", category: "Admin", priority: "Low", status: "Planned" },
      { startTime: "16:00", endTime: "16:30", activity: "Weekly review: what worked, what needs to change", category: "Review", priority: "High", status: "Planned" },
    ].map((b) => ({ ...b, id: uid() })),
    tasks: [
      { name: "Process inbox to zero", priority: "High", estimatedDuration: "1.5 hours", dueTime: "09:30", linkedGoal: "", status: "Not Started" },
      { name: "Triage all open tasks into calendar or cancel", priority: "High", estimatedDuration: "1 hour", dueTime: "11:00", linkedGoal: "", status: "Not Started" },
      { name: "Plan next two weeks at block level", priority: "High", estimatedDuration: "1.5 hours", dueTime: "15:00", linkedGoal: "", status: "Not Started" },
    ].map((t) => ({ ...t, id: uid() })),
  },
  "Balanced Day": {
    objective: "Make progress on strategic work while maintaining energy, health, and relationships.",
    priorities: ["One substantial output produced", "Physical activity completed", "No work after 6pm"],
    timeBlocks: [
      { startTime: "07:30", endTime: "08:00", activity: "Morning routine", category: "Personal", priority: "High", status: "Planned" },
      { startTime: "08:00", endTime: "10:30", activity: "Strategic work block", category: "Deep Work", priority: "High", status: "Planned" },
      { startTime: "10:30", endTime: "11:00", activity: "Exercise or walk", category: "Health", priority: "High", status: "Planned" },
      { startTime: "11:00", endTime: "12:30", activity: "Communications and follow-ups", category: "Admin", priority: "Medium", status: "Planned" },
      { startTime: "12:30", endTime: "13:15", activity: "Lunch", category: "Health", priority: "Medium", status: "Planned" },
      { startTime: "13:15", endTime: "15:30", activity: "Secondary work block: projects or learning", category: "Deep Work", priority: "Medium", status: "Planned" },
      { startTime: "15:30", endTime: "16:30", activity: "Personal time: reading, relationships, or rest", category: "Personal", priority: "Medium", status: "Planned" },
      { startTime: "16:30", endTime: "17:00", activity: "End-of-day review and tomorrow setup", category: "Review", priority: "High", status: "Planned" },
    ].map((b) => ({ ...b, id: uid() })),
    tasks: [
      { name: "Complete strategic work output", priority: "High", estimatedDuration: "2.5 hours", dueTime: "10:30", linkedGoal: "", status: "Not Started" },
      { name: "Exercise or physical activity (30+ min)", priority: "High", estimatedDuration: "30 min", dueTime: "11:00", linkedGoal: "", status: "Not Started" },
      { name: "Handle all communications in one batch", priority: "Medium", estimatedDuration: "45 min", dueTime: "12:30", linkedGoal: "", status: "Not Started" },
    ].map((t) => ({ ...t, id: uid() })),
  },
};

const blankBlock = (): Omit<TimeBlock, "id"> => ({
  startTime: "09:00", endTime: "10:00", activity: "", category: "Deep Work", priority: "High", status: "Planned",
});

const blankTask = (): Omit<CalTask, "id"> => ({
  name: "", priority: "High", estimatedDuration: "", dueTime: "", linkedGoal: "", status: "Not Started",
});

function Sel({ value, options, onChange, style }: { value: string; options: string[]; onChange: (v: string) => void; style?: React.CSSProperties }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ fontSize: 11, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "4px 6px", ...style }}>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [plan, setPlan] = useState<PlanData>(emptyPlan());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiForm, setAiForm] = useState({ goal: "", hoursAvailable: 8, mustComplete: "", avoid: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const [addingBlock, setAddingBlock] = useState(false);
  const [newBlock, setNewBlock] = useState(blankBlock());
  const [editBlockId, setEditBlockId] = useState<string | null>(null);
  const [editBlock, setEditBlock] = useState<TimeBlock | null>(null);
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState(blankTask());
  const [reviewOpen, setReviewOpen] = useState(false);
  const { toast } = useToast();
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoplan") === "today") {
      setSelectedDate(todayStr());
      setAiOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const loadPlan = useCallback((date: string) => {
    setLoading(true);
    fetch(`${base}/api/calendar/${date}`)
      .then((r) => r.json())
      .then(({ data }: { data: PlanData }) => {
        const p = data || emptyPlan();
        if (!p.priorities || p.priorities.length < 3) p.priorities = ["", "", ""];
        if (!p.review) p.review = emptyPlan().review;
        setPlan(p);
      })
      .catch(() => setPlan(emptyPlan()))
      .finally(() => setLoading(false));
  }, [base]);

  useEffect(() => { loadPlan(selectedDate); }, [selectedDate, loadPlan]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${base}/api/calendar/${selectedDate}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      toast({ title: "Save failed. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (name: string) => {
    const t = TEMPLATES[name];
    if (!t) return;
    setPlan((p) => ({
      ...p,
      objective: t.objective ?? p.objective,
      priorities: t.priorities ?? p.priorities,
      timeBlocks: (t.timeBlocks ?? []).map((b) => ({ ...b, id: uid() })),
      tasks: (t.tasks ?? []).map((tk) => ({ ...tk, id: uid() })),
    }));
    setShowTemplates(false);
    toast({ title: `Template applied: ${name}` });
  };

  const handleAiGenerate = async () => {
    if (!aiForm.goal) { toast({ title: "Enter a goal first", variant: "destructive" }); return; }
    setAiLoading(true);
    try {
      const r = await fetch(`${base}/api/calendar/ai-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiForm),
      });
      const data = await r.json();
      setPlan((p) => ({
        ...p,
        objective: data.objective ?? p.objective,
        priorities: data.priorities ?? p.priorities,
        timeBlocks: (data.timeBlocks ?? []).map((b: Omit<TimeBlock, "id">) => ({ ...b, id: uid() })),
        tasks: (data.tasks ?? []).map((t: Omit<CalTask, "id">) => ({ ...t, id: uid() })),
      }));
      setAiOpen(false);
      toast({ title: "Plan generated" });
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const addBlock = () => {
    if (!newBlock.activity) { toast({ title: "Enter an activity name", variant: "destructive" }); return; }
    setPlan((p) => ({ ...p, timeBlocks: [...p.timeBlocks, { ...newBlock, id: uid() }] }));
    setNewBlock(blankBlock());
    setAddingBlock(false);
  };

  const saveEditBlock = () => {
    if (!editBlock) return;
    setPlan((p) => ({ ...p, timeBlocks: p.timeBlocks.map((b) => b.id === editBlock.id ? editBlock : b) }));
    setEditBlockId(null);
    setEditBlock(null);
  };

  const deleteBlock = (id: string) => {
    setPlan((p) => ({ ...p, timeBlocks: p.timeBlocks.filter((b) => b.id !== id) }));
  };

  const updateBlockStatus = (id: string, status: string) => {
    setPlan((p) => ({ ...p, timeBlocks: p.timeBlocks.map((b) => b.id === id ? { ...b, status } : b) }));
  };

  const addTask = () => {
    if (!newTask.name) { toast({ title: "Enter a task name", variant: "destructive" }); return; }
    setPlan((p) => ({ ...p, tasks: [...p.tasks, { ...newTask, id: uid() }] }));
    setNewTask(blankTask());
    setAddingTask(false);
  };

  const cycleTaskStatus = (id: string) => {
    setPlan((p) => ({
      ...p,
      tasks: p.tasks.map((t) => {
        if (t.id !== id) return t;
        const idx = TASK_STATUSES.indexOf(t.status);
        return { ...t, status: TASK_STATUSES[(idx + 1) % TASK_STATUSES.length] };
      }),
    }));
  };

  const deleteTask = (id: string) => {
    setPlan((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== id) }));
  };

  const sortedBlocks = [...plan.timeBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <div className="flex items-center gap-6">
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
            Calendar
          </span>
          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
              style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-border-s)", padding: "4px 8px", cursor: "pointer" }}>
              Prev
            </button>
            <span style={{ fontSize: 12, color: "var(--sos-text)", fontWeight: 600, minWidth: 220, textAlign: "center" }}>
              {formatDisplayDate(selectedDate)}
            </span>
            <button onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
              style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-border-s)", padding: "4px 8px", cursor: "pointer" }}>
              Next
            </button>
            {selectedDate !== todayStr() && (
              <button onClick={() => setSelectedDate(todayStr())}
                style={{ fontSize: 10, color: "var(--sos-blue)", background: "none", border: "none", padding: "4px 6px", cursor: "pointer", letterSpacing: "0.06em" }}>
                Today
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Template selector */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowTemplates((v) => !v)}
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
              Templates
            </button>
            {showTemplates && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "var(--sos-surface)", border: "1px solid var(--sos-border)", zIndex: 50, minWidth: 200 }}>
                {Object.keys(TEMPLATES).map((name) => (
                  <button key={name} onClick={() => applyTemplate(name)}
                    style={{ display: "block", width: "100%", textAlign: "left", fontSize: 12, color: "var(--sos-text-body)", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--sos-border-s)" }}>
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setAiOpen(true)}
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-blue)", background: "var(--sos-blue-tint)", border: "1px solid var(--sos-blue-border)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
            AI Assist
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: saving ? "var(--sos-btn-disabled-bg)" : "var(--sos-btn-bg)", border: "none", padding: "8px 20px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
            {savedFlash ? "Saved" : saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div style={{ fontSize: 12, color: "var(--sos-text-muted)", letterSpacing: "0.06em" }}>Loading plan...</div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left column */}
          <div className="flex flex-col gap-5 shrink-0 overflow-y-auto py-6 px-5" style={{ width: 260, borderRight: "1px solid var(--sos-border)" }}>
            {/* Objective */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>
                Daily Objective
              </div>
              <textarea
                value={plan.objective}
                onChange={(e) => setPlan((p) => ({ ...p, objective: e.target.value }))}
                placeholder="State the day's primary output in one sentence."
                rows={3}
                style={{ width: "100%", fontSize: 12, resize: "none", lineHeight: 1.6, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "8px 10px" }}
              />
            </div>

            {/* Top 3 Priorities */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 10, fontFamily: "Space Grotesk, sans-serif" }}>
                Top Priorities
              </div>
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--sos-blue)", marginTop: 9, minWidth: 12, fontFamily: "Space Grotesk, sans-serif" }}>{i + 1}</span>
                    <input
                      value={plan.priorities[i] ?? ""}
                      onChange={(e) => {
                        const ps = [...plan.priorities];
                        ps[i] = e.target.value;
                        setPlan((p) => ({ ...p, priorities: ps }));
                      }}
                      placeholder={`Priority ${i + 1}`}
                      style={{ flex: 1, fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "6px 8px" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="flex-1">
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>
                Quick Notes
              </div>
              <textarea
                value={plan.notes}
                onChange={(e) => setPlan((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Context, constraints, or anything else relevant to today."
                rows={8}
                style={{ width: "100%", fontSize: 12, resize: "none", lineHeight: 1.6, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "8px 10px" }}
              />
            </div>
          </div>

          {/* Center column: Time Blocks */}
          <div className="flex flex-col flex-1 overflow-y-auto py-6 px-6">
            <div className="flex items-center justify-between mb-4">
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text-dim)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
                Schedule
              </div>
              <button onClick={() => setAddingBlock((v) => !v)}
                style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--sos-blue)", background: "none", border: "1px solid var(--sos-blue-border)", padding: "5px 12px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                + Add Block
              </button>
            </div>

            {/* Add block form */}
            {addingBlock && (
              <div className="mb-4 p-4" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 12, fontFamily: "Space Grotesk, sans-serif" }}>New Block</div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Start</div>
                      <input type="time" value={newBlock.startTime} onChange={(e) => setNewBlock((b) => ({ ...b, startTime: e.target.value }))}
                        style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "6px 8px" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>End</div>
                      <input type="time" value={newBlock.endTime} onChange={(e) => setNewBlock((b) => ({ ...b, endTime: e.target.value }))}
                        style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "6px 8px" }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Activity</div>
                    <input value={newBlock.activity} onChange={(e) => setNewBlock((b) => ({ ...b, activity: e.target.value }))} placeholder="What are you doing?"
                      style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "6px 8px" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Category</div>
                      <Sel value={newBlock.category} options={CATEGORIES} onChange={(v) => setNewBlock((b) => ({ ...b, category: v }))} style={{ width: "100%" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Priority</div>
                      <Sel value={newBlock.priority} options={PRIORITIES} onChange={(v) => setNewBlock((b) => ({ ...b, priority: v }))} style={{ width: "100%" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Status</div>
                      <Sel value={newBlock.status} options={BLOCK_STATUSES} onChange={(v) => setNewBlock((b) => ({ ...b, status: v }))} style={{ width: "100%" }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addBlock}
                      style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: "var(--sos-btn-bg)", border: "none", padding: "7px 16px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                      Add
                    </button>
                    <button onClick={() => { setAddingBlock(false); setNewBlock(blankBlock()); }}
                      style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 16px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Block list */}
            {sortedBlocks.length === 0 && !addingBlock && (
              <div className="py-16 text-center">
                <div style={{ fontSize: 12, color: "var(--sos-text-muted)", marginBottom: 6 }}>No blocks scheduled.</div>
                <div style={{ fontSize: 11, color: "var(--sos-text-dim)" }}>Add a block or apply a template to structure the day.</div>
              </div>
            )}

            <div className="space-y-2">
              {sortedBlocks.map((block) => (
                <div key={block.id}>
                  {editBlockId === block.id && editBlock ? (
                    <div className="p-4" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-blue-border)" }}>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Start</div>
                            <input type="time" value={editBlock.startTime} onChange={(e) => setEditBlock((b) => b && ({ ...b, startTime: e.target.value }))}
                              style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "6px 8px" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>End</div>
                            <input type="time" value={editBlock.endTime} onChange={(e) => setEditBlock((b) => b && ({ ...b, endTime: e.target.value }))}
                              style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "6px 8px" }} />
                          </div>
                        </div>
                        <input value={editBlock.activity} onChange={(e) => setEditBlock((b) => b && ({ ...b, activity: e.target.value }))}
                          style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "6px 8px" }} />
                        <div className="grid grid-cols-3 gap-3">
                          <Sel value={editBlock.category} options={CATEGORIES} onChange={(v) => setEditBlock((b) => b && ({ ...b, category: v }))} style={{ width: "100%" }} />
                          <Sel value={editBlock.priority} options={PRIORITIES} onChange={(v) => setEditBlock((b) => b && ({ ...b, priority: v }))} style={{ width: "100%" }} />
                          <Sel value={editBlock.status} options={BLOCK_STATUSES} onChange={(v) => setEditBlock((b) => b && ({ ...b, status: v }))} style={{ width: "100%" }} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEditBlock}
                            style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: "var(--sos-btn-bg)", border: "none", padding: "7px 16px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                            Save
                          </button>
                          <button onClick={() => { setEditBlockId(null); setEditBlock(null); }}
                            style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 16px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-3" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border-s)" }}>
                      {/* Time */}
                      <div style={{ minWidth: 88, paddingTop: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sos-text-muted)", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.04em" }}>
                          {block.startTime}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--sos-text-dim)" }}>{block.endTime}</div>
                      </div>
                      {/* Category stripe */}
                      <div style={{ width: 3, alignSelf: "stretch", background: CAT_COLOR[block.category] ?? "#6b7280", flexShrink: 0, marginTop: 2 }} />
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13, color: "var(--sos-text-body)", lineHeight: 1.4, marginBottom: 5 }}>{block.activity}</div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: CAT_COLOR[block.category] ?? "#6b7280", textTransform: "uppercase" }}>
                            {block.category}
                          </span>
                          <span style={{ fontSize: 9, color: PRI_COLOR[block.priority] ?? "var(--sos-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            {block.priority}
                          </span>
                          <select value={block.status}
                            onChange={(e) => updateBlockStatus(block.id, e.target.value)}
                            style={{ fontSize: 9, fontWeight: 600, color: STATUS_COLOR[block.status] ?? "var(--sos-text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            {BLOCK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditBlockId(block.id); setEditBlock({ ...block }); }}
                          style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>Edit</button>
                        <button onClick={() => deleteBlock(block.id)}
                          style={{ fontSize: 10, color: "var(--sos-error)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Tasks + Review */}
          <div className="flex flex-col shrink-0 overflow-y-auto py-6 px-5" style={{ width: 280, borderLeft: "1px solid var(--sos-border)" }}>
            {/* Tasks */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text-dim)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
                  Tasks
                </div>
                <button onClick={() => setAddingTask((v) => !v)}
                  style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-blue)", background: "none", border: "1px solid var(--sos-blue-border)", padding: "4px 10px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                  + Add
                </button>
              </div>

              {/* Add task form */}
              {addingTask && (
                <div className="p-3 mb-3" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
                  <div className="space-y-2">
                    <input value={newTask.name} onChange={(e) => setNewTask((t) => ({ ...t, name: e.target.value }))} placeholder="Task name"
                      style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "6px 8px" }} />
                    <div className="grid grid-cols-2 gap-2">
                      <Sel value={newTask.priority} options={PRIORITIES} onChange={(v) => setNewTask((t) => ({ ...t, priority: v }))} style={{ width: "100%" }} />
                      <input value={newTask.estimatedDuration} onChange={(e) => setNewTask((t) => ({ ...t, estimatedDuration: e.target.value }))} placeholder="Duration"
                        style={{ width: "100%", fontSize: 11, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "4px 6px" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="time" value={newTask.dueTime} onChange={(e) => setNewTask((t) => ({ ...t, dueTime: e.target.value }))}
                        style={{ width: "100%", fontSize: 11, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "4px 6px" }} />
                      <input value={newTask.linkedGoal} onChange={(e) => setNewTask((t) => ({ ...t, linkedGoal: e.target.value }))} placeholder="Linked goal"
                        style={{ width: "100%", fontSize: 11, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "4px 6px" }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addTask}
                        style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: "var(--sos-btn-bg)", border: "none", padding: "6px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                        Add
                      </button>
                      <button onClick={() => { setAddingTask(false); setNewTask(blankTask()); }}
                        style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "6px 14px", cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {plan.tasks.length === 0 && !addingTask && (
                <div style={{ fontSize: 11, color: "var(--sos-text-dim)", padding: "16px 0" }}>No tasks added yet.</div>
              )}

              <div className="space-y-2">
                {plan.tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 p-2.5" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border-s)" }}>
                    <button onClick={() => cycleTaskStatus(task.id)} title={`Status: ${task.status}`}
                      style={{ marginTop: 2, width: 14, height: 14, flexShrink: 0, border: `2px solid ${STATUS_COLOR[task.status] ?? "var(--sos-text-muted)"}`, background: task.status === "Done" ? STATUS_COLOR[task.status] : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {task.status === "Done" && <span style={{ fontSize: 8, color: "#fff", fontWeight: 800 }}>X</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 12, color: task.status === "Done" ? "var(--sos-text-dim)" : "var(--sos-text-body)", textDecoration: task.status === "Done" ? "line-through" : "none", lineHeight: 1.4, marginBottom: 3 }}>
                        {task.name}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: 9, color: PRI_COLOR[task.priority], letterSpacing: "0.06em", textTransform: "uppercase" }}>{task.priority}</span>
                        {task.estimatedDuration && <span style={{ fontSize: 9, color: "var(--sos-text-dim)" }}>{task.estimatedDuration}</span>}
                        {task.dueTime && <span style={{ fontSize: 9, color: "var(--sos-text-dim)" }}>Due {task.dueTime}</span>}
                        <span style={{ fontSize: 9, color: STATUS_COLOR[task.status], textTransform: "uppercase", letterSpacing: "0.06em" }}>{task.status}</span>
                      </div>
                      {task.linkedGoal && (
                        <div style={{ fontSize: 9, color: "var(--sos-text-dim)", marginTop: 2, fontStyle: "italic" }}>{task.linkedGoal}</div>
                      )}
                    </div>
                    <button onClick={() => deleteTask(task.id)}
                      style={{ fontSize: 10, color: "var(--sos-error)", background: "none", border: "none", cursor: "pointer", padding: "2px", flexShrink: 0, marginTop: 1 }}>
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* End-of-Day Review */}
            <div style={{ borderTop: "1px solid var(--sos-border)", paddingTop: 16 }}>
              <button onClick={() => setReviewOpen((v) => !v)} className="flex items-center justify-between w-full"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: reviewOpen ? 14 : 0 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text-dim)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
                  End-of-Day Review
                </div>
                <span style={{ fontSize: 10, color: "var(--sos-text-dim)" }}>{reviewOpen ? "Collapse" : "Open"}</span>
              </button>

              {reviewOpen && (
                <div className="space-y-4">
                  {[
                    { key: "movedForward", label: "What moved forward today?" },
                    { key: "delayed", label: "What got delayed?" },
                    { key: "friction", label: "What created friction?" },
                    { key: "changes", label: "What should change tomorrow?" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <div style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                      <textarea value={plan.review[key as keyof Review] as string}
                        onChange={(e) => setPlan((p) => ({ ...p, review: { ...p.review, [key]: e.target.value } }))}
                        rows={2}
                        style={{ width: "100%", fontSize: 11, resize: "none", lineHeight: 1.5, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "6px 8px" }} />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                      Day Score: {plan.review.score !== null ? `${plan.review.score}/10` : "Not rated"}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button key={n} onClick={() => setPlan((p) => ({ ...p, review: { ...p.review, score: n } }))}
                          style={{ width: 24, height: 24, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "1px solid", fontFamily: "Space Grotesk, sans-serif", borderColor: plan.review.score === n ? "var(--sos-blue)" : "var(--sos-border-s)", background: plan.review.score === n ? "var(--sos-blue-tint)" : "var(--sos-surface)", color: plan.review.score === n ? "var(--sos-blue)" : "var(--sos-text-muted)" }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Planning Modal */}
      {aiOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", zIndex: 100 }}>
          <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", width: 480, maxWidth: "90vw" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
              AI Planning Assistant
            </div>
            <div style={{ fontSize: 12, color: "var(--sos-text-dim)", marginBottom: 20 }}>
              Generate a realistic plan from your priorities, time limits, and constraints.
            </div>

            <div className="space-y-4">
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Goal for the day *</div>
                <textarea value={aiForm.goal} onChange={(e) => setAiForm((f) => ({ ...f, goal: e.target.value }))}
                  placeholder="State the main goal clearly."
                  rows={2}
                  style={{ width: "100%", fontSize: 12, resize: "none", lineHeight: 1.6, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "8px 10px" }} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Hours available</div>
                <input type="number" min={1} max={24} value={aiForm.hoursAvailable} onChange={(e) => setAiForm((f) => ({ ...f, hoursAvailable: Number(e.target.value) }))}
                  style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "8px 10px" }} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Must complete today</div>
                <input value={aiForm.mustComplete} onChange={(e) => setAiForm((f) => ({ ...f, mustComplete: e.target.value }))}
                  placeholder="The single most important deliverable."
                  style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "8px 10px" }} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Avoid today</div>
                <input value={aiForm.avoid} onChange={(e) => setAiForm((f) => ({ ...f, avoid: e.target.value }))}
                  placeholder="What should not happen today."
                  style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "8px 10px" }} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleAiGenerate} disabled={aiLoading}
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: aiLoading ? "var(--sos-btn-disabled-bg)" : "var(--sos-btn-bg)", border: "none", padding: "11px 24px", cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif", flex: 1 }}>
                {aiLoading ? "Generating..." : "Generate Plan"}
              </button>
              <button onClick={() => setAiOpen(false)}
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "11px 20px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
