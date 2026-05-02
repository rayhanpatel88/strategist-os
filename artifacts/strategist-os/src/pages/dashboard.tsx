import { useGetSessionsSummary, useListSessions, useDeleteSession, getListSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const now = new Date();
const systemDate = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).toUpperCase();

function HudCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: "emerald" | "blue" | "white" }) {
  const valueColor = accent === "emerald" ? "var(--sos-emerald)" : accent === "blue" ? "var(--sos-blue)" : "var(--sos-text)";
  return (
    <div
      className="flex flex-col gap-2 p-5"
      style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}
    >
      <div className="label-caps">{label}</div>
      <div
        className="data-mono"
        style={{ fontSize: 28, fontWeight: 700, color: valueColor, lineHeight: 1, fontFamily: "Space Grotesk, sans-serif" }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>{sub}</div>
      )}
    </div>
  );
}

function TelemetryBar({ value, max = 100, color = "var(--sos-emerald)" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 2, background: "var(--sos-track-bg)", width: "100%" }}>
      <div style={{ height: 2, width: `${pct}%`, background: color, transition: "width 0.8s ease" }} />
    </div>
  );
}

type ActivityEntry = { date: string; score: number | null; hasContent: boolean };
type WeekReview = { daysPlanned: number; avgScore: number | null; completedTasks: string[]; totalDays: number };

function getThisMondayStr(): string {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const mon = new Date(today);
  mon.setDate(today.getDate() - dow);
  return mon.toISOString().split("T")[0];
}

function getLastMondayStr(): string {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const lastMon = new Date(today);
  lastMon.setDate(today.getDate() - dow - 7);
  return lastMon.toISOString().split("T")[0];
}

function WeeklyReviewModal({ weekStart, base, onClose }: { weekStart: string; base: string; onClose: () => void }) {
  const [review, setReview] = useState<WeekReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [priorities, setPriorities] = useState(["", "", ""]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${base}/api/calendar/week-review?start=${weekStart}`)
      .then((r) => r.json())
      .then((d) => setReview(d))
      .catch(() => setReview(null))
      .finally(() => setLoading(false));
  }, [weekStart, base]);

  const weekEndStr = (() => {
    const end = new Date(`${weekStart}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 6);
    return end.toISOString().split("T")[0];
  })();
  const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const filled = priorities.map((p) => p.trim());
      if (filled.some((p) => p)) {
        const res = await fetch(`${base}/api/calendar/${todayStr}`);
        const json = await res.json();
        const updated = { ...(json.data ?? {}), priorities: filled };
        await fetch(`${base}/api/calendar/${todayStr}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updated }),
        });
        toast({ title: "Priorities saved to today's plan" });
      }
    } catch {
      // silent
    }
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(2px)" }}>
      <div style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", width: "min(700px, 95vw)", maxHeight: "90vh", overflow: "auto", position: "relative" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 18px", borderBottom: "1px solid var(--sos-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-muted)", marginBottom: 5 }}>Weekly Planning Review</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.15 }}>New week. New leverage.</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sos-text-muted)", fontSize: 22, lineHeight: 1, padding: 0, marginTop: 2 }}>×</button>
        </div>

        {/* Body: two columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {/* Left: last week */}
          <div style={{ padding: "24px", borderRight: "1px solid var(--sos-border)" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-muted)", marginBottom: 16 }}>
              Last week · {fmt(weekStart)} – {fmt(weekEndStr)}
            </div>
            {loading ? (
              <div style={{ fontSize: 11, color: "var(--sos-text-muted)" }}>Loading...</div>
            ) : !review ? (
              <div style={{ fontSize: 11, color: "var(--sos-text-muted)" }}>No data recorded for last week.</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                  <div style={{ background: "var(--sos-bg)", border: "1px solid var(--sos-border)", padding: "14px 16px" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "var(--sos-emerald)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
                      {review.daysPlanned}
                      <span style={{ fontSize: 13, color: "var(--sos-text-dim)", fontWeight: 400 }}>/7</span>
                    </div>
                    <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--sos-text-dim)", marginTop: 5 }}>Days planned</div>
                  </div>
                  <div style={{ background: "var(--sos-bg)", border: "1px solid var(--sos-border)", padding: "14px 16px" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "var(--sos-blue)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
                      {review.avgScore !== null ? review.avgScore : "—"}
                      {review.avgScore !== null && <span style={{ fontSize: 13, color: "var(--sos-text-dim)", fontWeight: 400 }}>/10</span>}
                    </div>
                    <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--sos-text-dim)", marginTop: 5 }}>Avg day score</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 10 }}>Completed tasks</div>
                  {review.completedTasks.length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--sos-text-subtle)", fontStyle: "italic" }}>No completed tasks recorded last week.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {review.completedTasks.map((task, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ fontSize: 12, color: "var(--sos-emerald)", flexShrink: 0, marginTop: 1 }}>✓</span>
                          <span style={{ fontSize: 12, color: "var(--sos-text-dim)", lineHeight: 1.45 }}>{task}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: this week's priorities */}
          <div style={{ padding: "24px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-muted)", marginBottom: 6 }}>This week's focus</div>
            <div style={{ fontSize: 12, color: "var(--sos-text-dim)", marginBottom: 22, lineHeight: 1.55 }}>
              Set your top 3 priorities. They'll be saved to today's daily plan in the Calendar.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-muted)", marginBottom: 5, fontFamily: "Space Grotesk, sans-serif", fontWeight: 600 }}>
                    0{i + 1}
                  </div>
                  <input
                    value={priorities[i]}
                    onChange={(e) => {
                      const next = [...priorities];
                      next[i] = e.target.value;
                      setPriorities(next);
                    }}
                    placeholder={["Biggest outcome to achieve", "Key project to advance", "One habit to lock in"][i]}
                    style={{
                      width: "100%",
                      background: "var(--sos-bg)",
                      border: "1px solid var(--sos-border)",
                      borderRadius: 2,
                      padding: "10px 12px",
                      fontSize: 12,
                      color: "var(--sos-text)",
                      outline: "none",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      transition: "border-color 0.1s",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--sos-blue)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--sos-border)"; }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
              <button
                onClick={onClose}
                style={{ fontSize: 10, color: "var(--sos-text-muted)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "Space Grotesk, sans-serif",
                  background: "var(--sos-blue)",
                  color: "#fff",
                  border: "none",
                  padding: "11px 22px",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.65 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {saving ? "Saving..." : "Set Priorities →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildHeatmapGrid(): string[][] {
  const today = new Date();
  const todayDOW = (today.getDay() + 6) % 7;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - todayDOW);
  const startMonday = new Date(thisMonday);
  startMonday.setDate(thisMonday.getDate() - 21);
  const rows: string[][] = [];
  for (let week = 0; week < 4; week++) {
    const row: string[] = [];
    for (let day = 0; day < 7; day++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + week * 7 + day);
      row.push(d.toISOString().split("T")[0]);
    }
    rows.push(row);
  }
  return rows;
}

function cellColor(date: string, todayStr: string, map: Map<string, ActivityEntry>) {
  if (date > todayStr) return "transparent";
  const entry = map.get(date);
  if (!entry?.hasContent) return "var(--sos-track-bg)";
  const s = entry.score;
  if (s === null) return "var(--sos-blue-tint)";
  if (s >= 8) return "var(--sos-emerald)";
  if (s >= 6) return "var(--sos-blue)";
  if (s >= 4) return "#f59e0b";
  return "var(--sos-error)";
}

function ExecutionHeatmap({ activity, loading }: { activity: ActivityEntry[]; loading: boolean }) {
  const grid = buildHeatmapGrid();
  const todayStr = new Date().toISOString().split("T")[0];
  const safeActivity = Array.isArray(activity) ? activity : [];
  const map = new Map(safeActivity.map((a) => [a.date, a]));

  const allDates = grid.flat();
  const pastDates = allDates.filter((d) => d <= todayStr);
  const plannedCount = pastDates.filter((d) => map.get(d)?.hasContent).length;

  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (map.get(ds)?.hasContent) {
      streak++;
    } else if (i > 0) {
      break;
    } else {
      break;
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="label-caps">Execution Record</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--sos-emerald)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: 10, color: "var(--sos-text-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>day streak</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--sos-blue)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>{plannedCount}</span>
            <span style={{ fontSize: 10, color: "var(--sos-text-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>days planned</span>
          </div>
        </div>
      </div>

      <div className="p-5" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
        {loading ? (
          <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 11, color: "var(--sos-text-muted)" }}>Loading activity...</div>
          </div>
        ) : (
          <>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} style={{ fontSize: 9, color: "var(--sos-text-dim)", textAlign: "center", letterSpacing: "0.06em", textTransform: "uppercase" }}>{d}</div>
              ))}
            </div>

            {/* Grid */}
            {grid.map((week, wi) => (
              <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                {week.map((date) => {
                  const entry = map.get(date);
                  const isToday = date === todayStr;
                  const isFuture = date > todayStr;
                  const bg = cellColor(date, todayStr, map);
                  return (
                    <div
                      key={date}
                      title={`${date}${entry?.hasContent ? (entry.score !== null ? ` · Score ${entry.score}/10` : " · Planned") : ""}`}
                      style={{
                        height: 20,
                        background: bg,
                        border: isToday ? "1px solid var(--sos-blue)" : "1px solid transparent",
                        borderRadius: 3,
                        opacity: isFuture ? 0 : 1,
                        cursor: entry?.hasContent ? "default" : "default",
                      }}
                    />
                  );
                })}
              </div>
            ))}

            {/* Legend + link */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 10, background: "var(--sos-track-bg)", borderRadius: 2 }} />
                  <span style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.04em" }}>No plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 10, background: "var(--sos-blue-tint)", borderRadius: 2 }} />
                  <span style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.04em" }}>Planned</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 10, background: "var(--sos-blue)", borderRadius: 2 }} />
                  <span style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.04em" }}>Score 6-7</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 10, background: "var(--sos-emerald)", borderRadius: 2 }} />
                  <span style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.04em" }}>Score 8+</span>
                </div>
              </div>
              <Link href="/calendar">
                <span style={{ fontSize: 10, color: "var(--sos-blue)", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600 }}>
                  Open Calendar
                </span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const summary = useGetSessionsSummary();
  const sessions = useListSessions();
  const deleteSession = useDeleteSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [weekReviewStart, setWeekReviewStart] = useState("");
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

  useEffect(() => {
    fetch(`${base}/api/calendar/activity`)
      .then((r) => r.json())
      .then((data: ActivityEntry[]) => setActivity(Array.isArray(data) ? data : []))
      .catch(() => setActivity([]))
      .finally(() => setActivityLoading(false));
  }, [base]);

  useEffect(() => {
    const today = new Date();
    if (today.getDay() !== 1) return;
    const thisMondayKey = `sos_weekly_review_${getThisMondayStr()}`;
    if (localStorage.getItem(thisMondayKey)) return;
    setWeekReviewStart(getLastMondayStr());
    setShowWeeklyReview(true);
  }, []);

  const handleWeeklyReviewClose = () => {
    localStorage.setItem(`sos_weekly_review_${getThisMondayStr()}`, "1");
    setShowWeeklyReview(false);
  };

  const handleDelete = (id: number) => {
    deleteSession.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        toast({ title: "Session removed" });
      },
    });
  };

  const avgScore = summary.data?.averageLeverageScore ? Math.round(summary.data.averageLeverageScore) : null;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
      {showWeeklyReview && weekReviewStart && (
        <WeeklyReviewModal weekStart={weekReviewStart} base={base} onClose={handleWeeklyReviewClose} />
      )}
      {/* Page header */}
      <div
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--sos-border)" }}
      >
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
            Command Centre
          </span>
          <span style={{ width: 1, height: 14, background: "var(--sos-ghost-border)", display: "inline-block" }} />
          <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.06em" }}>{systemDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-pip" style={{ background: "var(--sos-emerald)" }} />
          <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7">
        {/* Telemetry grid */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {summary.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 animate-pulse" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", height: 110 }} />
            ))
          ) : (
            <>
              <HudCard
                label="Total Sessions"
                value={summary.data?.totalSessions ?? 0}
                sub="strategy sessions run"
                accent="white"
              />
              <HudCard
                label="Avg Leverage Score"
                value={avgScore !== null ? `${avgScore}` : "—"}
                sub="across all diagnoses"
                accent={avgScore !== null && avgScore >= 75 ? "emerald" : "blue"}
              />
              <HudCard
                label="Top Industry"
                value={summary.data?.topIndustries?.[0]?.industry ?? "—"}
                sub={summary.data?.topIndustries?.[0] ? `${summary.data.topIndustries[0].count} sessions` : "no data yet"}
                accent="white"
              />
              <HudCard
                label="System Status"
                value="ACTIVE"
                sub="all modules operational"
                accent="emerald"
              />
            </>
          )}
        </div>

        {/* Telemetry bars */}
        {!summary.isLoading && avgScore !== null && (
          <div className="mb-8 p-5" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
            <div className="label-caps mb-4">Performance</div>
            <div className="space-y-4">
              {[
                { label: "LEVERAGE SCORE", value: avgScore, color: avgScore >= 75 ? "var(--sos-emerald)" : "var(--sos-blue)" },
                { label: "SESSION VELOCITY", value: Math.min(100, (summary.data?.totalSessions ?? 0) * 10), color: "var(--sos-blue)" },
                { label: "MODULE COVERAGE", value: 100, color: "var(--sos-emerald)" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase" }}>{item.label}</span>
                    <span className="data-mono" style={{ fontSize: 12, color: item.color, fontFamily: "Space Grotesk, sans-serif" }}>{item.value}</span>
                  </div>
                  <TelemetryBar value={item.value} color={item.color} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution Heatmap */}
        <ExecutionHeatmap activity={activity} loading={activityLoading} />

        {/* Modules */}
        <div className="mb-8">
          <div className="label-caps mb-4">Modules</div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { href: "/diagnosis", label: "Strategic Diagnosis", desc: "Input your context. Get a structured breakdown of bottlenecks, priorities, and ranked next steps.", icon: "biotech" },
              { href: "/scorecard", label: "Optimisation Scorecard", desc: "Assess your position across 8 dimensions. Get a ranked improvement roadmap with timelines.", icon: "analytics" },
              { href: "/opportunity", label: "Opportunity Stack", desc: "Map your skills and assets against demand. Surface the highest-value positioning angle.", icon: "trending_up" },
              { href: "/planner", label: "Execution Planner", desc: "Convert any goal into a 7-day sprint and 30-day roadmap with daily actions and risk flags.", icon: "calendar_month" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className="p-4 cursor-pointer group transition-all duration-100"
                  style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-text-dim)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-border)"; }}
                  data-testid={`card-quick-action-${item.href.replace("/", "")}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined" style={{ color: "var(--sos-blue)", fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--sos-text)", letterSpacing: "0.03em", fontFamily: "Space Grotesk, sans-serif" }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sos-text-dim)", lineHeight: 1.55 }}>{item.desc}</div>
                  <div className="flex items-center gap-1 mt-3">
                    <span style={{ fontSize: 10, color: "var(--sos-blue)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Open</span>
                    <span className="material-symbols-outlined" style={{ color: "var(--sos-blue)", fontSize: 12 }}>arrow_forward</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sessions table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="label-caps">Session Record</div>
            <Link href="/diagnosis">
              <span
                className="cursor-pointer transition-colors"
                style={{ fontSize: 11, color: "var(--sos-blue)", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600 }}
              >
                + New Session
              </span>
            </Link>
          </div>

          <div style={{ border: "1px solid var(--sos-border)" }}>
            <div
              className="grid px-5 py-3"
              style={{ gridTemplateColumns: "1fr 120px 80px 100px", background: "var(--sos-row-hover)", borderBottom: "1px solid var(--sos-border)" }}
            >
              {["Session Title", "Industry", "Score", "Action"].map((h) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-muted)", textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>

            {sessions.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4 animate-pulse" style={{ borderBottom: "1px solid var(--sos-border-s)", background: i % 2 === 0 ? "transparent" : "var(--sos-row-alt)" }}>
                  <div style={{ height: 12, background: "var(--sos-tab-active-bg)", width: "40%", marginBottom: 4 }} />
                </div>
              ))
            ) : sessions.data && sessions.data.length > 0 ? (
              sessions.data.slice(0, 8).map((session, i) => (
                <div
                  key={session.id}
                  className="grid px-5 py-4 items-center"
                  style={{
                    gridTemplateColumns: "1fr 120px 80px 100px",
                    background: i % 2 === 0 ? "transparent" : "var(--sos-row-alt)",
                    borderBottom: "1px solid var(--sos-border-s)",
                  }}
                  data-testid={`card-session-${session.id}`}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sos-text)" }}>{session.title}</div>
                    <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2 }}>
                      {new Date(session.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sos-text-dim)", letterSpacing: "0.04em" }}>{session.industry || "—"}</div>
                  <div>
                    {session.leverageScore != null ? (
                      <span
                        className="data-mono"
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: session.leverageScore >= 75 ? "var(--sos-emerald)" : session.leverageScore >= 50 ? "var(--sos-blue)" : "var(--sos-error)",
                          fontFamily: "Space Grotesk, sans-serif",
                        }}
                      >
                        {Math.round(session.leverageScore)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--sos-text-subtle)", fontSize: 13 }}>—</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(session.id)}
                    style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sos-error)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sos-text-muted)"; }}
                    data-testid={`button-delete-session-${session.id}`}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <div className="px-5 py-14 text-center">
                <div style={{ fontSize: 12, color: "var(--sos-text-muted)", marginBottom: 8 }}>No sessions yet.</div>
                <Link href="/diagnosis">
                  <span className="cursor-pointer" style={{ fontSize: 12, color: "var(--sos-blue)" }}>Run a diagnosis to start building your strategy record.</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
