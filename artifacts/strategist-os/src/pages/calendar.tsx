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
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type RecurringTpl = {
  id: number;
  name: string;
  days: number[];
  data: Partial<Omit<PlanData, "review">>;
};

type WeekDayData = {
  date: string;
  planned: boolean;
  blocksTotal: number;
  blocksCompleted: number;
  momentumScore: number | null;
  tasksTotal: number;
  tasksDone: number;
  dayScore: number | null;
};

type WeekReviewData = {
  days: WeekDayData[];
  summary: {
    daysPlanned: number;
    avgDayScore: number | null;
    avgMomentum: number | null;
    totalBlocks: number;
    completedBlocks: number;
    totalTasks: number;
    doneTasks: number;
  };
  reflection: ReflectionForm | null;
};

type ReflectionForm = {
  movedForward: string;
  heldBack: string;
  keyLesson: string;
  nextWeekFocus: string;
  weekScore: number | null;
};

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

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function formatWeekRange(start: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(start + "T12:00:00");
  e.setDate(e.getDate() + 6);
  return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

function emptyReflection(): ReflectionForm {
  return { movedForward: "", heldBack: "", keyLesson: "", nextWeekFocus: "", weekScore: null };
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
  const [mobileTab, setMobileTab] = useState<"plan" | "schedule" | "tasks">("schedule");
  type StreakData = {
    currentStreak: number;
    longestStreak: number;
    frozenDates: string[];
    freezesUsedThisMonth: number;
    freezesAllowed: number;
  };
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [freezePromptDate, setFreezePromptDate] = useState<string | null>(null);
  const [freezePromptDismissed, setFreezePromptDismissed] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [showFreezeHistory, setShowFreezeHistory] = useState(false);
  const [unfreezingDate, setUnfreezingDate] = useState<string | null>(null);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTpl[]>([]);
  const [showSaveRecurring, setShowSaveRecurring] = useState(false);
  const [recurringForm, setRecurringForm] = useState<{ name: string; days: number[] }>({ name: "", days: [] });
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [suggestedTemplate, setSuggestedTemplate] = useState<RecurringTpl | null>(null);
  const [bannerDismissedFor, setBannerDismissedFor] = useState<string | null>(null);
  const [showManageRecurring, setShowManageRecurring] = useState(false);
  const [weekReviewOpen, setWeekReviewOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(todayStr()));
  const [weekData, setWeekData] = useState<WeekReviewData | null>(null);
  const [weekLoading, setWeekLoading] = useState(false);
  const [reflection, setReflection] = useState<ReflectionForm>(emptyReflection());
  const [savingReflection, setSavingReflection] = useState(false);
  const [reflectionSavedFlash, setReflectionSavedFlash] = useState(false);
  const { toast } = useToast();
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

  const fetchStreak = useCallback(() => {
    fetch(`${base}/api/calendar/streak`)
      .then((r) => r.json())
      .then((data) => {
        setStreak(data);
        // Auto-detect freeze opportunity: streak is 0, freezes remain, yesterday has no content
        if (
          data.currentStreak === 0 &&
          data.freezesUsedThisMonth < data.freezesAllowed
        ) {
          const yesterday = new Date();
          yesterday.setUTCDate(yesterday.getUTCDate() - 1);
          const yStr = yesterday.toISOString().split("T")[0];
          if (!data.frozenDates.includes(yStr)) {
            setFreezePromptDate(yStr);
          }
        } else {
          setFreezePromptDate(null);
        }
      })
      .catch(() => {});
  }, [base]);

  const applyFreeze = useCallback((date: string) => {
    setFreezing(true);
    fetch(`${base}/api/calendar/streak/freeze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          toast({ title: "Streak frozen", description: `${date} protected. Freeze used.` });
          setFreezePromptDate(null);
          setFreezePromptDismissed(false);
          fetchStreak();
        } else {
          toast({ title: "Could not apply freeze", description: res.error ?? "Unknown error", variant: "destructive" });
        }
      })
      .catch(() => toast({ title: "Network error", variant: "destructive" }))
      .finally(() => setFreezing(false));
  }, [base, fetchStreak, toast]);

  const unfreezeDate = useCallback((date: string) => {
    setUnfreezingDate(date);
    fetch(`${base}/api/calendar/streak/freeze/${date}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          toast({ title: "Freeze removed", description: `${date} unfrozen. Token restored.` });
          fetchStreak();
        } else {
          toast({ title: "Could not remove freeze", variant: "destructive" });
        }
      })
      .catch(() => toast({ title: "Network error", variant: "destructive" }))
      .finally(() => setUnfreezingDate(null));
  }, [base, fetchStreak, toast]);

  const fetchRecurringTemplates = useCallback(() => {
    fetch(`${base}/api/calendar/recurring-templates`)
      .then((r) => r.json())
      .then((rows: unknown) => { if (Array.isArray(rows)) setRecurringTemplates(rows as RecurringTpl[]); })
      .catch(() => {});
  }, [base]);

  useEffect(() => { fetchStreak(); }, [fetchStreak]);
  useEffect(() => { fetchRecurringTemplates(); }, [fetchRecurringTemplates]);

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

  // Suggest matching recurring template when navigating to an empty day
  useEffect(() => {
    const planIsEmpty = !plan.objective?.trim() && plan.timeBlocks.length === 0 && plan.tasks.length === 0;
    if (!planIsEmpty || bannerDismissedFor === selectedDate || recurringTemplates.length === 0) {
      setSuggestedTemplate(null);
      return;
    }
    const dayOfWeek = new Date(selectedDate + "T12:00:00").getDay();
    const match = recurringTemplates.find((t) => t.days.includes(dayOfWeek)) ?? null;
    setSuggestedTemplate(match);
  }, [plan, selectedDate, recurringTemplates, bannerDismissedFor]);

  const applyRecurringTemplate = (tpl: RecurringTpl) => {
    setPlan((p) => ({
      ...p,
      objective: tpl.data.objective ?? p.objective,
      priorities: tpl.data.priorities ?? p.priorities,
      notes: tpl.data.notes ?? p.notes,
      timeBlocks: (tpl.data.timeBlocks ?? []).map((b) => ({ ...b, id: uid(), status: "Planned" })),
      tasks: (tpl.data.tasks ?? []).map((t) => ({ ...t, id: uid(), status: "Not Started" })),
    }));
    setSuggestedTemplate(null);
    setBannerDismissedFor(selectedDate);
    toast({ title: `Template applied: ${tpl.name}` });
  };

  const saveAsRecurring = async () => {
    if (!recurringForm.name.trim()) { toast({ title: "Enter a template name", variant: "destructive" }); return; }
    if (recurringForm.days.length === 0) { toast({ title: "Select at least one day", variant: "destructive" }); return; }
    setSavingRecurring(true);
    try {
      await fetch(`${base}/api/calendar/recurring-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recurringForm.name,
          days: recurringForm.days,
          data: { objective: plan.objective, priorities: plan.priorities, notes: plan.notes, timeBlocks: plan.timeBlocks, tasks: plan.tasks },
        }),
      });
      fetchRecurringTemplates();
      setShowSaveRecurring(false);
      setRecurringForm({ name: "", days: [] });
      toast({ title: "Recurring template saved" });
    } catch {
      toast({ title: "Failed to save template", variant: "destructive" });
    } finally {
      setSavingRecurring(false);
    }
  };

  const deleteRecurringTemplate = async (id: number) => {
    await fetch(`${base}/api/calendar/recurring-templates/${id}`, { method: "DELETE" });
    setRecurringTemplates((ts) => ts.filter((t) => t.id !== id));
  };

  const fetchWeekReview = useCallback((start: string) => {
    setWeekLoading(true);
    setWeekData(null);
    fetch(`${base}/api/calendar/weekly-review?start=${start}`)
      .then((r) => r.json())
      .then((data: WeekReviewData) => {
        setWeekData(data);
        setReflection(data.reflection ?? emptyReflection());
      })
      .catch(() => {})
      .finally(() => setWeekLoading(false));
  }, [base]);

  useEffect(() => {
    if (weekReviewOpen) fetchWeekReview(weekStart);
  }, [weekReviewOpen, weekStart, fetchWeekReview]);

  const saveWeekReflection = async () => {
    setSavingReflection(true);
    try {
      await fetch(`${base}/api/calendar/weekly-reflection`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart, data: reflection }),
      });
      setReflectionSavedFlash(true);
      setTimeout(() => setReflectionSavedFlash(false), 2000);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSavingReflection(false);
    }
  };

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
      fetchStreak();
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
      <div className="shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>

        {/* ── Mobile header (two rows, hidden on md+) ─────────────────────── */}
        <div className="md:hidden">
          {/* Row 1: label + streak + Save */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
                Calendar
              </span>
              {streak !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: streak.currentStreak > 0 ? "rgba(114,254,136,0.08)" : "var(--sos-surface)", border: `1px solid ${streak.currentStreak > 0 ? "rgba(114,254,136,0.22)" : "var(--sos-border-s)"}`, padding: "3px 8px" }}>
                    <span style={{ fontSize: 12 }}>{streak.currentStreak > 0 ? "🔥" : "💤"}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: streak.currentStreak > 0 ? "var(--sos-emerald)" : "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>{streak.currentStreak}</span>
                  </div>
                  <button onClick={() => setShowFreezeHistory(true)} title={`${streak.freezesAllowed - streak.freezesUsedThisMonth} freeze${streak.freezesAllowed - streak.freezesUsedThisMonth !== 1 ? "s" : ""} left — view history`} style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(147,197,253,0.08)", border: "1px solid rgba(147,197,253,0.18)", padding: "3px 7px", cursor: "pointer" }}>
                    <span style={{ fontSize: 10 }}>🧊</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--sos-blue)", fontFamily: "Space Grotesk, sans-serif" }}>{streak.freezesAllowed - streak.freezesUsedThisMonth}</span>
                  </button>
                </div>
              )}
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: saving ? "var(--sos-btn-disabled-bg)" : "var(--sos-btn-bg)", border: "none", padding: "7px 18px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
              {savedFlash ? "Saved" : saving ? "..." : "Save"}
            </button>
          </div>
          {/* Row 2: date nav + icon action buttons */}
          <div className="flex items-center gap-2 px-4 pb-2">
            <button onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
              style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-border-s)", padding: "5px 9px", cursor: "pointer", flexShrink: 0 }}>
              Prev
            </button>
            <span style={{ fontSize: 12, color: "var(--sos-text)", fontWeight: 600, flex: 1, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {formatDisplayDate(selectedDate)}
            </span>
            <button onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
              style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-border-s)", padding: "5px 9px", cursor: "pointer", flexShrink: 0 }}>
              Next
            </button>
            {selectedDate !== todayStr() && (
              <button onClick={() => setSelectedDate(todayStr())}
                style={{ fontSize: 10, color: "var(--sos-blue)", background: "none", border: "none", padding: "5px 4px", cursor: "pointer", flexShrink: 0 }}>
                Today
              </button>
            )}
            <div style={{ display: "flex", gap: 4 }}>
              {/* Templates icon */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowTemplates((v) => !v)} title="Templates"
                  style={{ background: "none", border: "1px solid var(--sos-ghost-border)", padding: "5px 7px", cursor: "pointer", color: "var(--sos-text-dim)", display: "flex", alignItems: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>content_copy</span>
                </button>
                {showTemplates && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "var(--sos-surface)", border: "1px solid var(--sos-border)", zIndex: 50, minWidth: 220, maxHeight: 340, overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", padding: "8px 14px 4px", fontFamily: "Space Grotesk, sans-serif" }}>Daily Presets</div>
                    {Object.keys(TEMPLATES).map((name) => (
                      <button key={name} onClick={() => applyTemplate(name)}
                        style={{ display: "block", width: "100%", textAlign: "left", fontSize: 12, color: "var(--sos-text-body)", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--sos-border-s)" }}>
                        {name}
                      </button>
                    ))}
                    {recurringTemplates.length > 0 && (
                      <>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", padding: "10px 14px 4px", fontFamily: "Space Grotesk, sans-serif", borderTop: "1px solid var(--sos-border)" }}>Recurring</div>
                        {recurringTemplates.map((t) => (
                          <button key={t.id} onClick={() => { applyRecurringTemplate(t); setShowTemplates(false); }}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--sos-border-s)" }}>
                            <div style={{ fontSize: 12, color: "var(--sos-text-body)" }}>{t.name}</div>
                            <div style={{ fontSize: 9, color: "var(--sos-text-dim)", marginTop: 2 }}>{t.days.map((d) => DAY_LABELS[d]).join(" / ")}</div>
                          </button>
                        ))}
                      </>
                    )}
                    <div style={{ borderTop: "1px solid var(--sos-border)", padding: "4px 0" }}>
                      <button onClick={() => { setShowSaveRecurring(true); setShowTemplates(false); setRecurringForm({ name: "", days: [] }); }}
                        style={{ display: "block", width: "100%", textAlign: "left", fontSize: 11, color: "var(--sos-emerald)", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.06em" }}>
                        + Save current as recurring
                      </button>
                      {recurringTemplates.length > 0 && (
                        <button onClick={() => { setShowManageRecurring(true); setShowTemplates(false); }}
                          style={{ display: "block", width: "100%", textAlign: "left", fontSize: 11, color: "var(--sos-text-dim)", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.06em" }}>
                          Manage recurring templates
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Week Review icon */}
              <button onClick={() => { setWeekStart(getMondayOfWeek(selectedDate)); setWeekReviewOpen(true); }} title="Week Review"
                style={{ background: "none", border: "1px solid var(--sos-ghost-border)", padding: "5px 7px", cursor: "pointer", color: "var(--sos-text-dim)", display: "flex", alignItems: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bar_chart</span>
              </button>
              {/* AI Assist icon */}
              <button onClick={() => setAiOpen(true)} title="AI Assist"
                style={{ background: "var(--sos-blue-tint)", border: "1px solid var(--sos-blue-border)", padding: "5px 7px", cursor: "pointer", color: "var(--sos-blue)", display: "flex", alignItems: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Desktop header (single row, hidden on mobile) ─────────────────── */}
        <div className="hidden md:flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-6 min-w-0">
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif", flexShrink: 0 }}>
              Calendar
            </span>
            {streak !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div
                  title={`Longest streak: ${streak.longestStreak} day${streak.longestStreak !== 1 ? "s" : ""}`}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: streak.currentStreak > 0 ? "rgba(114,254,136,0.08)" : "var(--sos-surface)", border: `1px solid ${streak.currentStreak > 0 ? "rgba(114,254,136,0.22)" : "var(--sos-border-s)"}`, padding: "4px 10px", cursor: "default" }}
                >
                  <span style={{ fontSize: 13 }}>{streak.currentStreak > 0 ? "🔥" : "💤"}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: streak.currentStreak > 0 ? "var(--sos-emerald)" : "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>{streak.currentStreak}</span>
                  <span style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>day{streak.currentStreak !== 1 ? "s" : ""}</span>
                </div>
                <button
                  onClick={() => setShowFreezeHistory(true)}
                  title={`${streak.freezesAllowed - streak.freezesUsedThisMonth} of ${streak.freezesAllowed} freezes left — view history`}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(147,197,253,0.07)", border: "1px solid rgba(147,197,253,0.18)", padding: "4px 10px", cursor: "pointer" }}
                >
                  <span style={{ fontSize: 13 }}>🧊</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--sos-blue)", fontFamily: "Space Grotesk, sans-serif" }}>{streak.freezesAllowed - streak.freezesUsedThisMonth}</span>
                  <span style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>left</span>
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
                style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-border-s)", padding: "4px 8px", cursor: "pointer", flexShrink: 0 }}>
                Prev
              </button>
              <span style={{ fontSize: 12, color: "var(--sos-text)", fontWeight: 600, whiteSpace: "nowrap" }}>
                {formatDisplayDate(selectedDate)}
              </span>
              <button onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
                style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-border-s)", padding: "4px 8px", cursor: "pointer", flexShrink: 0 }}>
                Next
              </button>
              {selectedDate !== todayStr() && (
                <button onClick={() => setSelectedDate(todayStr())}
                  style={{ fontSize: 10, color: "var(--sos-blue)", background: "none", border: "none", padding: "4px 6px", cursor: "pointer", letterSpacing: "0.06em", flexShrink: 0 }}>
                  Today
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowTemplates((v) => !v)}
                style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                Templates
              </button>
              {showTemplates && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "var(--sos-surface)", border: "1px solid var(--sos-border)", zIndex: 50, minWidth: 220, maxHeight: 360, overflowY: "auto" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", padding: "8px 14px 4px", fontFamily: "Space Grotesk, sans-serif" }}>Daily Presets</div>
                  {Object.keys(TEMPLATES).map((name) => (
                    <button key={name} onClick={() => applyTemplate(name)}
                      style={{ display: "block", width: "100%", textAlign: "left", fontSize: 12, color: "var(--sos-text-body)", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--sos-border-s)" }}>
                      {name}
                    </button>
                  ))}
                  {recurringTemplates.length > 0 && (
                    <>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", padding: "10px 14px 4px", fontFamily: "Space Grotesk, sans-serif", borderTop: "1px solid var(--sos-border)" }}>Recurring</div>
                      {recurringTemplates.map((t) => (
                        <button key={t.id} onClick={() => { applyRecurringTemplate(t); setShowTemplates(false); }}
                          style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--sos-border-s)" }}>
                          <div style={{ fontSize: 12, color: "var(--sos-text-body)" }}>{t.name}</div>
                          <div style={{ fontSize: 9, color: "var(--sos-text-dim)", marginTop: 2 }}>{t.days.map((d) => DAY_LABELS[d]).join(" / ")}</div>
                        </button>
                      ))}
                    </>
                  )}
                  <div style={{ borderTop: "1px solid var(--sos-border)", padding: "4px 0" }}>
                    <button onClick={() => { setShowSaveRecurring(true); setShowTemplates(false); setRecurringForm({ name: "", days: [] }); }}
                      style={{ display: "block", width: "100%", textAlign: "left", fontSize: 11, color: "var(--sos-emerald)", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.06em" }}>
                      + Save current as recurring
                    </button>
                    {recurringTemplates.length > 0 && (
                      <button onClick={() => { setShowManageRecurring(true); setShowTemplates(false); }}
                        style={{ display: "block", width: "100%", textAlign: "left", fontSize: 11, color: "var(--sos-text-dim)", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.06em" }}>
                        Manage recurring templates
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => { setWeekStart(getMondayOfWeek(selectedDate)); setWeekReviewOpen(true); }}
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 14px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
              Week Review
            </button>
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
      </div>

      {/* Streak freeze prompt banner */}
      {freezePromptDate && !freezePromptDismissed && (
        <div className="flex items-center justify-between gap-3 shrink-0 px-4 py-2" style={{ background: "rgba(147,197,253,0.06)", borderBottom: "1px solid rgba(147,197,253,0.18)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <span style={{ fontSize: 13 }}>🧊</span>
            <span style={{ fontSize: 11, color: "var(--sos-text-body)" }}>
              <span style={{ color: "var(--sos-text-dim)" }}>No plan on </span>
              <span style={{ fontWeight: 600, color: "var(--sos-blue)" }}>
                {new Date(freezePromptDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
              </span>
              <span style={{ color: "var(--sos-text-dim)" }}>. Spend a freeze to protect your streak?</span>
              {streak && (
                <span style={{ color: "var(--sos-text-dim)", fontSize: 10 }}> ({streak.freezesAllowed - streak.freezesUsedThisMonth} left)</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => applyFreeze(freezePromptDate)}
              disabled={freezing}
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-blue)", background: "rgba(147,197,253,0.12)", border: "1px solid rgba(147,197,253,0.3)", padding: "4px 12px", cursor: freezing ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
              {freezing ? "..." : "Use Freeze"}
            </button>
            <button
              onClick={() => setFreezePromptDismissed(true)}
              style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Recurring template suggestion banner */}
      {suggestedTemplate && (
        <div className="flex items-center justify-between gap-3 shrink-0 px-4 py-2" style={{ background: "rgba(114,254,136,0.06)", borderBottom: "1px solid rgba(114,254,136,0.18)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <span style={{ fontSize: 12 }}>↩</span>
            <span style={{ fontSize: 11, color: "var(--sos-text-body)" }}>
              <span style={{ fontWeight: 600, color: "var(--sos-emerald)" }}>{suggestedTemplate.name}</span>
              <span style={{ color: "var(--sos-text-dim)" }}> matches {DAY_LABELS[new Date(selectedDate + "T12:00:00").getDay()]}. Apply it?</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => applyRecurringTemplate(suggestedTemplate)}
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-emerald)", background: "rgba(114,254,136,0.12)", border: "1px solid rgba(114,254,136,0.3)", padding: "4px 12px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
              Apply
            </button>
            <button onClick={() => { setSuggestedTemplate(null); setBannerDismissedFor(selectedDate); }}
              style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Mobile panel tabs */}
      <div className="md:hidden flex shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        {(["plan", "schedule", "tasks"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            style={{
              flex: 1, padding: "9px 0", fontSize: 10,
              fontWeight: mobileTab === tab ? 700 : 400,
              letterSpacing: "0.1em", textTransform: "capitalize",
              color: mobileTab === tab ? "var(--sos-text)" : "var(--sos-text-dim)",
              background: mobileTab === tab ? "var(--sos-surface)" : "none",
              border: "none", cursor: "pointer",
              borderBottom: mobileTab === tab ? "2px solid var(--sos-blue)" : "2px solid transparent",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            {tab === "plan" ? "Plan" : tab === "schedule" ? "Schedule" : "Tasks"}
          </button>
        ))}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div style={{ fontSize: 12, color: "var(--sos-text-muted)", letterSpacing: "0.06em" }}>Loading plan...</div>
        </div>
      ) : (
        <div className="sos-cal-body flex flex-1 overflow-hidden">
          {/* Left column */}
          <div className={`sos-cal-left flex flex-col gap-5 shrink-0 overflow-y-auto py-6 px-5 ${mobileTab !== "plan" ? "hidden md:flex" : ""}`} style={{ width: 260, borderRight: "1px solid var(--sos-border)" }}>
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
          <div className={`sos-cal-center flex flex-col flex-1 overflow-y-auto py-6 px-6 ${mobileTab !== "schedule" ? "hidden md:flex" : ""}`}>
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <div className={`sos-cal-right flex flex-col shrink-0 overflow-y-auto py-6 px-5 ${mobileTab !== "tasks" ? "hidden md:flex" : ""}`} style={{ width: 280, borderLeft: "1px solid var(--sos-border)" }}>
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

      {/* Save as Recurring Template Modal */}
      {showSaveRecurring && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", zIndex: 100 }}>
          <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", width: 420, maxWidth: "92vw" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
              Save as Recurring Template
            </div>
            <div style={{ fontSize: 12, color: "var(--sos-text-dim)", marginBottom: 20 }}>
              This plan will auto-fill on matching days when the schedule is empty.
            </div>
            <div className="space-y-4">
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Template name *</div>
                <input
                  value={recurringForm.name}
                  onChange={(e) => setRecurringForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Deep Work Morning, Client Day"
                  style={{ width: "100%", fontSize: 12, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "8px 10px" }}
                />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 10 }}>Repeat on *</div>
                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map((label, idx) => {
                    const active = recurringForm.days.includes(idx);
                    return (
                      <button key={idx} onClick={() => setRecurringForm((f) => ({
                        ...f,
                        days: active ? f.days.filter((d) => d !== idx) : [...f.days, idx],
                      }))}
                        style={{ padding: "6px 12px", fontSize: 11, fontWeight: active ? 700 : 400, fontFamily: "Space Grotesk, sans-serif", cursor: "pointer", border: "1px solid", borderColor: active ? "var(--sos-emerald)" : "var(--sos-border-s)", background: active ? "rgba(114,254,136,0.1)" : "var(--sos-input-bg)", color: active ? "var(--sos-emerald)" : "var(--sos-text-dim)" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--sos-text-dim)", padding: "8px 10px", background: "var(--sos-bg)", border: "1px solid var(--sos-border-s)" }}>
                Saves: objective, priorities, notes, {plan.timeBlocks.length} block{plan.timeBlocks.length !== 1 ? "s" : ""}, {plan.tasks.length} task{plan.tasks.length !== 1 ? "s" : ""}. Review data is not included.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveAsRecurring} disabled={savingRecurring}
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: savingRecurring ? "var(--sos-btn-disabled-bg)" : "var(--sos-btn-bg)", border: "none", padding: "11px 24px", cursor: savingRecurring ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif", flex: 1 }}>
                {savingRecurring ? "Saving..." : "Save Template"}
              </button>
              <button onClick={() => setShowSaveRecurring(false)}
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "11px 20px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Recurring Templates Modal */}
      {showManageRecurring && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", zIndex: 100 }}>
          <div className="p-6" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", width: 440, maxWidth: "92vw" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 16 }}>
              Recurring Templates
            </div>
            {recurringTemplates.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--sos-text-dim)", padding: "16px 0" }}>No recurring templates saved.</div>
            ) : (
              <div className="space-y-2">
                {recurringTemplates.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-3 p-3" style={{ background: "var(--sos-bg)", border: "1px solid var(--sos-border-s)" }}>
                    <div className="min-w-0">
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sos-text-body)", marginBottom: 3 }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: "var(--sos-text-dim)" }}>{t.days.map((d) => DAY_LABELS[d]).join(" / ")}</div>
                      <div style={{ fontSize: 10, color: "var(--sos-text-dim)", marginTop: 2 }}>
                        {(t.data.timeBlocks ?? []).length} block{(t.data.timeBlocks ?? []).length !== 1 ? "s" : ""} · {(t.data.tasks ?? []).length} task{(t.data.tasks ?? []).length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { applyRecurringTemplate(t); setShowManageRecurring(false); }}
                        style={{ fontSize: 10, color: "var(--sos-blue)", background: "none", border: "1px solid var(--sos-blue-border)", padding: "4px 10px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                        Apply
                      </button>
                      <button onClick={() => deleteRecurringTemplate(t.id)}
                        style={{ fontSize: 10, color: "var(--sos-error)", background: "none", border: "1px solid rgba(239,68,68,0.3)", padding: "4px 10px", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowManageRecurring(false); setShowSaveRecurring(true); setRecurringForm({ name: "", days: [] }); }}
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-emerald)", background: "none", border: "1px solid rgba(114,254,136,0.3)", padding: "10px 20px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                + New Template
              </button>
              <button onClick={() => setShowManageRecurring(false)}
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "10px 20px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", marginLeft: "auto" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Review Modal */}
      {weekReviewOpen && (
        <div className="fixed inset-0 flex items-start justify-center" style={{ background: "rgba(0,0,0,0.6)", zIndex: 110, overflowY: "auto", padding: "24px 16px" }}>
          <div style={{ background: "var(--sos-bg)", border: "1px solid var(--sos-border)", width: "100%", maxWidth: 780 }}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--sos-border)" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
                  Week Review
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => setWeekStart((s) => shiftDate(s, -7))}
                    style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-border-s)", padding: "3px 8px", cursor: "pointer" }}>
                    Prev
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--sos-text-body)" }}>{formatWeekRange(weekStart)}</span>
                  <button onClick={() => setWeekStart((s) => shiftDate(s, 7))}
                    style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-border-s)", padding: "3px 8px", cursor: "pointer" }}>
                    Next
                  </button>
                  {weekStart !== getMondayOfWeek(todayStr()) && (
                    <button onClick={() => setWeekStart(getMondayOfWeek(todayStr()))}
                      style={{ fontSize: 10, color: "var(--sos-blue)", background: "none", border: "none", padding: "3px 6px", cursor: "pointer" }}>
                      This Week
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => setWeekReviewOpen(false)}
                style={{ fontSize: 18, color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>
                ×
              </button>
            </div>

            {weekLoading ? (
              <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
                <span style={{ fontSize: 12, color: "var(--sos-text-muted)", letterSpacing: "0.06em" }}>Loading week data...</span>
              </div>
            ) : weekData ? (
              <div>
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 px-6 py-5" style={{ gap: 1, borderBottom: "1px solid var(--sos-border)", background: "var(--sos-border-s)" }}>
                  {[
                    { label: "Days Planned", value: `${weekData.summary.daysPlanned}/7` },
                    { label: "Avg Momentum", value: weekData.summary.avgMomentum !== null ? `${weekData.summary.avgMomentum}%` : "—" },
                    { label: "Avg Day Score", value: weekData.summary.avgDayScore !== null ? `${weekData.summary.avgDayScore}/10` : "—" },
                    { label: "Blocks Done", value: `${weekData.summary.completedBlocks}/${weekData.summary.totalBlocks}` },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col" style={{ background: "var(--sos-surface)", padding: "14px 16px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 6 }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 7-Day Momentum Chart */}
                <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--sos-border)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 12 }}>
                    7-Day Momentum
                  </div>
                  <div className="flex items-end gap-2" style={{ height: 80 }}>
                    {weekData.days.map((day) => {
                      const score = day.momentumScore;
                      const barH = score !== null ? Math.max(4, Math.round((score / 100) * 72)) : 4;
                      const color = score === null ? "var(--sos-border)" : score >= 75 ? "var(--sos-emerald)" : score >= 40 ? "var(--sos-blue)" : "#f59e0b";
                      const label = new Date(day.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" });
                      const isToday = day.date === todayStr();
                      return (
                        <div key={day.date} className="flex flex-col items-center flex-1" style={{ gap: 4 }}>
                          <div style={{ fontSize: 9, color: score !== null ? color : "var(--sos-text-dim)", fontWeight: 600 }}>
                            {score !== null ? `${score}%` : ""}
                          </div>
                          <div style={{ width: "100%", height: barH, background: color, opacity: day.planned ? 1 : 0.3, position: "relative" }}>
                            {isToday && <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "var(--sos-emerald)" }} />}
                          </div>
                          <div style={{ fontSize: 9, color: isToday ? "var(--sos-text)" : "var(--sos-text-dim)", fontWeight: isToday ? 700 : 400 }}>{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day Breakdown Table */}
                <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--sos-border)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 10 }}>
                    Day Breakdown
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--sos-border-s)" }}>
                          {["Day", "Blocks Done", "Tasks Done", "Momentum", "Score"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {weekData.days.map((day) => {
                          const isToday = day.date === todayStr();
                          const dayName = new Date(day.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
                          return (
                            <tr key={day.date} style={{ borderBottom: "1px solid var(--sos-border-s)", background: isToday ? "rgba(114,254,136,0.04)" : "transparent" }}>
                              <td style={{ padding: "8px", color: isToday ? "var(--sos-emerald)" : day.planned ? "var(--sos-text-body)" : "var(--sos-text-dim)", fontWeight: isToday ? 700 : 400 }}>{dayName}</td>
                              <td style={{ padding: "8px", color: "var(--sos-text-body)" }}>{day.blocksTotal > 0 ? `${day.blocksCompleted}/${day.blocksTotal}` : <span style={{ color: "var(--sos-text-dim)" }}>—</span>}</td>
                              <td style={{ padding: "8px", color: "var(--sos-text-body)" }}>{day.tasksTotal > 0 ? `${day.tasksDone}/${day.tasksTotal}` : <span style={{ color: "var(--sos-text-dim)" }}>—</span>}</td>
                              <td style={{ padding: "8px" }}>
                                {day.momentumScore !== null ? (
                                  <span style={{ color: day.momentumScore >= 75 ? "var(--sos-emerald)" : day.momentumScore >= 40 ? "var(--sos-blue)" : "#f59e0b", fontWeight: 600 }}>
                                    {day.momentumScore}%
                                  </span>
                                ) : <span style={{ color: "var(--sos-text-dim)" }}>—</span>}
                              </td>
                              <td style={{ padding: "8px", color: "var(--sos-text-body)" }}>
                                {day.dayScore !== null ? `${day.dayScore}/10` : <span style={{ color: "var(--sos-text-dim)" }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Streak */}
                {streak !== null && (
                  <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--sos-border)", background: "var(--sos-surface)" }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 3 }}>Current Streak</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: streak.currentStreak > 0 ? "var(--sos-emerald)" : "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif" }}>
                        {streak.currentStreak > 0 ? "🔥" : "💤"} {streak.currentStreak} day{streak.currentStreak !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={{ width: 1, height: 36, background: "var(--sos-border)" }} />
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 3 }}>Longest Ever</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
                        {streak.longestStreak} day{streak.longestStreak !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={{ width: 1, height: 36, background: "var(--sos-border)" }} />
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 3 }}>Tasks This Week</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
                        {weekData.summary.doneTasks}/{weekData.summary.totalTasks}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reflection */}
                <div className="px-6 py-5">
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 16 }}>
                    Weekly Reflection
                  </div>
                  <div className="space-y-4">
                    {([
                      { key: "movedForward", label: "What moved forward this week?" },
                      { key: "heldBack", label: "What held you back?" },
                      { key: "keyLesson", label: "Key lesson learned?" },
                      { key: "nextWeekFocus", label: "Primary focus for next week?" },
                    ] as const).map(({ key, label }) => (
                      <div key={key}>
                        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 6 }}>{label}</div>
                        <textarea
                          value={reflection[key]}
                          onChange={(e) => setReflection((r) => ({ ...r, [key]: e.target.value }))}
                          rows={2}
                          style={{ width: "100%", fontSize: 12, resize: "none", lineHeight: 1.6, color: "var(--sos-text-body)", background: "var(--sos-input-bg)", border: "1px solid var(--sos-border-s)", padding: "8px 10px" }}
                        />
                      </div>
                    ))}

                    <div>
                      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 10 }}>
                        Week Score: {reflection.weekScore !== null ? `${reflection.weekScore}/10` : "Not rated"}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <button key={n}
                            onClick={() => setReflection((r) => ({ ...r, weekScore: r.weekScore === n ? null : n }))}
                            style={{ width: 32, height: 32, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid", fontFamily: "Space Grotesk, sans-serif", borderColor: reflection.weekScore === n ? "var(--sos-emerald)" : "var(--sos-border-s)", background: reflection.weekScore === n ? "rgba(114,254,136,0.12)" : "var(--sos-surface)", color: reflection.weekScore === n ? "var(--sos-emerald)" : "var(--sos-text-muted)" }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={saveWeekReflection} disabled={savingReflection}
                      style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: savingReflection ? "var(--sos-btn-disabled-bg)" : "var(--sos-btn-bg)", border: "none", padding: "11px 28px", cursor: savingReflection ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                      {reflectionSavedFlash ? "Saved" : savingReflection ? "Saving..." : "Save Reflection"}
                    </button>
                    <button onClick={() => setWeekReviewOpen(false)}
                      style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "11px 20px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
                <span style={{ fontSize: 12, color: "var(--sos-text-muted)" }}>No data available for this week.</span>
              </div>
            )}
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
      {/* Freeze History Modal */}
      {showFreezeHistory && streak && (() => {
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        const monthFreezes = streak.frozenDates
          .filter((d) => d.startsWith(thisMonth))
          .sort()
          .reverse();
        const remaining = streak.freezesAllowed - streak.freezesUsedThisMonth;
        return (
          <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)", zIndex: 100 }} onClick={() => setShowFreezeHistory(false)}>
            <div style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", width: 420, maxWidth: "92vw", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between" style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--sos-border)" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
                    Freeze History
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sos-text-dim)", marginTop: 2 }}>{monthLabel}</div>
                </div>
                <button onClick={() => setShowFreezeHistory(false)} style={{ background: "none", border: "none", color: "var(--sos-text-dim)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 6px" }}>
                  ×
                </button>
              </div>

              {/* Token summary bar */}
              <div className="flex items-center gap-4" style={{ padding: "12px 20px", borderBottom: "1px solid var(--sos-border-s)", background: "rgba(147,197,253,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {Array.from({ length: streak.freezesAllowed }).map((_, i) => (
                    <div key={i} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${i < remaining ? "rgba(147,197,253,0.4)" : "var(--sos-border-s)"}`, background: i < remaining ? "rgba(147,197,253,0.1)" : "transparent", fontSize: 14 }}>
                      {i < remaining ? "🧊" : "·"}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sos-blue)", fontFamily: "Space Grotesk, sans-serif" }}>
                    {remaining} of {streak.freezesAllowed} remaining
                  </div>
                  <div style={{ fontSize: 10, color: "var(--sos-text-dim)" }}>
                    Resets on the 1st of next month
                  </div>
                </div>
              </div>

              {/* Frozen dates list */}
              <div style={{ overflowY: "auto", flex: 1 }}>
                {monthFreezes.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>🧊</div>
                    <div style={{ fontSize: 12, color: "var(--sos-text-dim)" }}>No freezes used this month.</div>
                    <div style={{ fontSize: 11, color: "var(--sos-text-muted)", marginTop: 4 }}>Use them to protect your streak on missed days.</div>
                  </div>
                ) : (
                  monthFreezes.map((date) => {
                    const label = new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
                    const isUnfreezing = unfreezingDate === date;
                    return (
                      <div key={date} className="flex items-center justify-between" style={{ padding: "12px 20px", borderBottom: "1px solid var(--sos-border-s)" }}>
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: 16 }}>🧊</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sos-text)" }}>{label}</div>
                            <div style={{ fontSize: 10, color: "var(--sos-text-dim)", marginTop: 1 }}>Streak protected</div>
                          </div>
                        </div>
                        <button
                          onClick={() => unfreezeDate(date)}
                          disabled={isUnfreezing}
                          style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-border-s)", padding: "4px 10px", cursor: isUnfreezing ? "not-allowed" : "pointer", fontFamily: "Space Grotesk, sans-serif", opacity: isUnfreezing ? 0.5 : 1 }}>
                          {isUnfreezing ? "..." : "Unfreeze"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "12px 20px", borderTop: "1px solid var(--sos-border-s)" }}>
                <div style={{ fontSize: 10, color: "var(--sos-text-muted)" }}>
                  Unfreezing a date restores the token to your monthly allowance. It also removes streak protection for that day.
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
