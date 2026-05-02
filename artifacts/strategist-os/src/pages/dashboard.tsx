import { useGetSessionsSummary, useListSessions, useDeleteSession, getListSessionsQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

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

function scoreColor(s: number | null): string {
  if (s === null) return "var(--sos-blue-tint)";
  if (s >= 9) return "var(--sos-emerald)";
  if (s >= 7) return "var(--sos-blue)";
  if (s >= 5) return "#f59e0b";
  return "var(--sos-error)";
}

function cellColor(date: string, todayStr: string, map: Map<string, ActivityEntry>) {
  if (date > todayStr) return "transparent";
  const entry = map.get(date);
  if (!entry?.hasContent) return "var(--sos-track-bg)";
  return scoreColor(entry.score);
}

type Popover = { date: string; x: number; y: number; currentScore: number | null };

function ScorePopover({ popover, saving, onScore, onClose }: {
  popover: Popover;
  saving: boolean;
  onScore: (date: string, score: number) => void;
  onClose: () => void;
}) {
  const label = new Date(popover.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
      <div
        style={{
          position: "fixed",
          left: popover.x,
          top: popover.y - 10,
          transform: "translate(-50%, -100%)",
          zIndex: 100,
          background: "var(--sos-surface)",
          border: "1px solid var(--sos-border)",
          padding: "12px 14px",
          width: 240,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-muted)" }}>Rate this day</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", marginTop: 2 }}>{label}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sos-text-muted)", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 3 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const isCurrent = popover.currentScore === n;
            const bg = n >= 9 ? "var(--sos-emerald)" : n >= 7 ? "var(--sos-blue)" : n >= 5 ? "#f59e0b" : "var(--sos-error)";
            return (
              <button
                key={n}
                disabled={saving}
                onClick={() => onScore(popover.date, n)}
                style={{
                  height: 22,
                  background: isCurrent ? bg : "var(--sos-bg)",
                  border: isCurrent ? `2px solid ${bg}` : "1px solid var(--sos-border)",
                  borderRadius: 2,
                  fontSize: 9,
                  fontWeight: 700,
                  color: isCurrent ? "#fff" : "var(--sos-text-dim)",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "Space Grotesk, sans-serif",
                  transition: "all 0.1s",
                  padding: 0,
                }}
                onMouseEnter={(e) => { if (!isCurrent) { (e.currentTarget as HTMLElement).style.background = bg; (e.currentTarget as HTMLElement).style.color = "#fff"; } }}
                onMouseLeave={(e) => { if (!isCurrent) { (e.currentTarget as HTMLElement).style.background = "var(--sos-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--sos-text-dim)"; } }}
              >
                {n}
              </button>
            );
          })}
        </div>
        {saving && (
          <div style={{ fontSize: 9, color: "var(--sos-text-muted)", marginTop: 8, textAlign: "center", letterSpacing: "0.06em" }}>Saving...</div>
        )}
      </div>
    </>
  );
}

type DiagnosisHistoryEntry = { id: number; goal: string; leverageScore: number; createdAt: string };

function LeverageScoreTrend({ base }: { base: string }) {
  const { data: history = [], isLoading } = useQuery<DiagnosisHistoryEntry[]>({
    queryKey: ["diagnosis-history"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/diagnosis/history`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const chartData = [...history]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((entry, i) => ({
      index: i + 1,
      score: entry.leverageScore,
      goal: entry.goal ? entry.goal.slice(0, 48) + (entry.goal.length > 48 ? "…" : "") : "Diagnosis",
      date: new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    }));

  const latest = chartData[chartData.length - 1];
  const prev = chartData[chartData.length - 2];
  const delta = latest && prev ? latest.score - prev.score : null;
  const trend = delta === null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const scoreColor = d.score >= 75 ? "#72fe88" : d.score >= 50 ? "#4b8cf5" : "#ffb4ab";
    return (
      <div style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", padding: "10px 14px", minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-muted)", marginBottom: 5 }}>{d.date}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1, marginBottom: 4 }}>
          {d.score}<span style={{ fontSize: 12, color: "var(--sos-text-muted)", fontWeight: 400 }}>/100</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--sos-text-dim)", lineHeight: 1.4 }}>{d.goal}</div>
      </div>
    );
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="label-caps">Leverage Score Trend</div>
        {chartData.length >= 2 && delta !== null && (
          <div className="flex items-center gap-2">
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
              color: trend === "up" ? "var(--sos-emerald)" : trend === "down" ? "var(--sos-error)" : "var(--sos-text-dim)",
              fontFamily: "Space Grotesk, sans-serif",
            }}>
              {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"} {Math.abs(delta)} pts since last run
            </span>
            <span style={{ width: 1, height: 12, background: "var(--sos-ghost-border)", display: "inline-block" }} />
            <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>{chartData.length} diagnoses</span>
          </div>
        )}
      </div>

      <div className="p-5" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
        {isLoading ? (
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 11, color: "var(--sos-text-muted)" }}>Loading...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ fontSize: 11, color: "var(--sos-text-muted)", textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>
              Run your first Diagnosis to start tracking your leverage score over time.
            </div>
            <Link href="/diagnosis">
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-blue)", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                Go to Diagnosis →
              </span>
            </Link>
          </div>
        ) : chartData.length === 1 ? (
          <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: chartData[0].score >= 75 ? "var(--sos-emerald)" : chartData[0].score >= 50 ? "var(--sos-blue)" : "var(--sos-error)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
              {chartData[0].score}
            </div>
            <div style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Your first score — run another diagnosis to see the trend
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#72fe88" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#72fe88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "var(--sos-text-dim)", letterSpacing: "0.04em" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: "var(--sos-text-dim)" }}
                  axisLine={false}
                  tickLine={false}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <ReferenceLine y={75} stroke="rgba(114,254,136,0.2)" strokeDasharray="4 4" label={{ value: "HIGH", position: "right", fontSize: 8, fill: "rgba(114,254,136,0.5)", fontFamily: "Space Grotesk, sans-serif" }} />
                <ReferenceLine y={50} stroke="rgba(75,140,245,0.15)" strokeDasharray="4 4" label={{ value: "MID", position: "right", fontSize: 8, fill: "rgba(75,140,245,0.4)", fontFamily: "Space Grotesk, sans-serif" }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#72fe88"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                  dot={{ r: 3, fill: "#72fe88", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#72fe88", stroke: "rgba(114,254,136,0.3)", strokeWidth: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3">
              {[
                { label: "High leverage", color: "var(--sos-emerald)", y: "≥75" },
                { label: "Moderate", color: "var(--sos-blue)", y: "50–74" },
                { label: "Constrained", color: "var(--sos-error)", y: "<50" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div style={{ width: 8, height: 8, background: item.color, borderRadius: 1 }} />
                  <span style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.04em" }}>{item.label} ({item.y})</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type ScorecardHistoryEntry = { id: number; goal: string; overallScore: number; result: { dimensions: { name: string; score: number }[] }; createdAt: string };

function ScorecardRadar({ base }: { base: string }) {
  const { data: history = [], isLoading } = useQuery<ScorecardHistoryEntry[]>({
    queryKey: ["scorecard-history"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/scorecard/history`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const latest = history[0];
  const prev = history[1];
  const delta = latest && prev ? latest.overallScore - prev.overallScore : null;
  const trend = delta === null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  const radarData = latest?.result?.dimensions?.map((d) => ({
    subject: d.name.split(" ")[0],
    score: d.score,
    fullMark: 100,
  })) ?? [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const score = payload[0]?.value as number;
    const color = score >= 75 ? "#72fe88" : score >= 50 ? "#4b8cf5" : "#ffb4ab";
    return (
      <div style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", padding: "8px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-muted)", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
          {score}<span style={{ fontSize: 11, color: "var(--sos-text-muted)", fontWeight: 400 }}>/100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="label-caps">Scorecard Profile</div>
        {latest && (
          <div className="flex items-center gap-2">
            {delta !== null && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                color: trend === "up" ? "var(--sos-emerald)" : trend === "down" ? "var(--sos-error)" : "var(--sos-text-dim)",
                fontFamily: "Space Grotesk, sans-serif",
              }}>
                {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"} {Math.abs(delta!)} pts
              </span>
            )}
            {delta !== null && <span style={{ width: 1, height: 12, background: "var(--sos-ghost-border)", display: "inline-block" }} />}
            <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>{history.length} assessment{history.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      <div style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
        {isLoading ? (
          <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 11, color: "var(--sos-text-muted)" }}>Loading...</div>
          </div>
        ) : !latest ? (
          <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ fontSize: 11, color: "var(--sos-text-muted)", textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>
              Run a Scorecard to visualise your 8-dimension positioning profile here.
            </div>
            <Link href="/scorecard">
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-blue)", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif" }}>
                Go to Scorecard →
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2">
            {/* Left: radar */}
            <div className="p-4" style={{ borderRight: "1px solid var(--sos-border)" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sos-text-muted)", marginBottom: 4 }}>Latest run · {new Date(latest.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.35)", fontFamily: "Space Grotesk, sans-serif" }} />
                  <Radar name="Score" dataKey="score" stroke="#4b8eff" fill="#4b8eff" fillOpacity={0.12} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Right: score + dimension bars */}
            <div className="p-5 flex flex-col justify-center gap-3">
              <div className="flex items-baseline gap-3 mb-1">
                <span style={{ fontSize: 40, fontWeight: 700, color: latest.overallScore >= 75 ? "var(--sos-emerald)" : latest.overallScore >= 50 ? "var(--sos-blue)" : "var(--sos-error)", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
                  {latest.overallScore}
                </span>
                <span style={{ fontSize: 11, color: "var(--sos-text-muted)" }}>/100</span>
              </div>
              {latest.goal && (
                <div style={{ fontSize: 11, color: "var(--sos-text-dim)", lineHeight: 1.4, marginBottom: 6 }}>
                  {latest.goal.slice(0, 64)}{latest.goal.length > 64 ? "…" : ""}
                </div>
              )}
              <div className="space-y-2">
                {radarData.map((d) => {
                  const c = d.score >= 75 ? "var(--sos-emerald)" : d.score >= 50 ? "var(--sos-blue)" : "var(--sos-error)";
                  return (
                    <div key={d.subject} className="flex items-center gap-3">
                      <div style={{ fontSize: 9, color: "var(--sos-text-muted)", width: 64, flexShrink: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>{d.subject}</div>
                      <div style={{ flex: 1, height: 2, background: "var(--sos-track-bg)" }}>
                        <div style={{ height: 2, width: `${d.score}%`, background: c, transition: "width 0.8s ease" }} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: c, fontFamily: "Space Grotesk, sans-serif", width: 24, textAlign: "right" }}>{d.score}</div>
                    </div>
                  );
                })}
              </div>
              <Link href="/scorecard">
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-blue)", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", marginTop: 4, display: "inline-block" }}>
                  View full scorecard →
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExecutionHeatmap({ activity, loading, base, onScoreUpdate }: {
  activity: ActivityEntry[];
  loading: boolean;
  base: string;
  onScoreUpdate: (date: string, score: number) => void;
}) {
  const grid = buildHeatmapGrid();
  const todayStr = new Date().toISOString().split("T")[0];
  const safeActivity = Array.isArray(activity) ? activity : [];
  const map = new Map(safeActivity.map((a) => [a.date, a]));
  const [popover, setPopover] = useState<Popover | null>(null);
  const [saving, setSaving] = useState(false);

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
    } else {
      if (i > 0) break;
      else break;
    }
  }

  const handleCellClick = (e: React.MouseEvent<HTMLDivElement>, date: string) => {
    if (date > todayStr) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const entry = map.get(date);
    setPopover({ date, x: rect.left + rect.width / 2, y: rect.top, currentScore: entry?.score ?? null });
  };

  const handleScore = async (date: string, score: number) => {
    setSaving(true);
    onScoreUpdate(date, score);
    try {
      const r = await fetch(`${base}/api/calendar/${date}`);
      const json = await r.json();
      const existing = json.data ?? {};
      const updated = { ...existing, review: { ...(existing.review ?? {}), score } };
      await fetch(`${base}/api/calendar/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updated }),
      });
    } catch {
      // silent — optimistic update already applied
    } finally {
      setSaving(false);
      setPopover(null);
    }
  };

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

      <div className="p-5" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", position: "relative" }}>
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
                  const isPast = !isFuture;
                  const bg = cellColor(date, todayStr, map);
                  const isActive = popover?.date === date;
                  return (
                    <div
                      key={date}
                      onClick={isPast ? (e) => handleCellClick(e, date) : undefined}
                      title={isFuture ? "" : entry?.hasContent
                        ? (entry.score !== null ? `${date} · Score ${entry.score}/10 — click to update` : `${date} · Planned — click to rate`)
                        : `${date} — click to rate`}
                      style={{
                        height: 20,
                        background: bg,
                        border: isActive
                          ? "2px solid var(--sos-text)"
                          : isToday
                          ? "1px solid var(--sos-blue)"
                          : "1px solid transparent",
                        borderRadius: 3,
                        opacity: isFuture ? 0 : 1,
                        cursor: isPast ? "pointer" : "default",
                        transition: "opacity 0.1s, border-color 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (isPast) (e.currentTarget as HTMLElement).style.opacity = "0.8";
                      }}
                      onMouseLeave={(e) => {
                        if (isPast) (e.currentTarget as HTMLElement).style.opacity = "1";
                      }}
                    />
                  );
                })}
              </div>
            ))}

            {/* Hint */}
            <div style={{ fontSize: 9, color: "var(--sos-text-subtle)", letterSpacing: "0.04em", marginTop: 4, marginBottom: 4 }}>
              Click any past day to add or update its score.
            </div>

            {/* Legend + link */}
            <div className="flex items-center justify-between mt-2">
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
                  <span style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.04em" }}>Score 7-8</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 10, background: "var(--sos-emerald)", borderRadius: 2 }} />
                  <span style={{ fontSize: 9, color: "var(--sos-text-dim)", letterSpacing: "0.04em" }}>Score 9-10</span>
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

      {popover && (
        <ScorePopover
          popover={popover}
          saving={saving}
          onScore={handleScore}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}

type FeedItem = {
  id: string;
  type: "diagnosis" | "scorecard";
  goal: string;
  insight: string;
  score: number;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function IntelligenceFeed({ base }: { base: string }) {
  const diagnoses = useQuery<{ id: number; goal: string; leverageScore: number; result: { strategicDiagnosis?: string }; createdAt: string }[]>({
    queryKey: ["diagnosis-history"],
    queryFn: () => fetch(`${base}/api/diagnosis/history`).then((r) => r.json()),
  });

  const scorecards = useQuery<{ id: number; goal: string; overallScore: number; result: { strategicSummary?: string }; createdAt: string }[]>({
    queryKey: ["scorecard-history"],
    queryFn: () => fetch(`${base}/api/scorecard/history`).then((r) => r.json()),
  });

  const items = useMemo<FeedItem[]>(() => {
    const d: FeedItem[] = (diagnoses.data ?? []).slice(0, 6).map((x) => ({
      id: `d-${x.id}`,
      type: "diagnosis" as const,
      goal: x.goal || "Strategic Diagnosis",
      insight: x.result?.strategicDiagnosis?.slice(0, 140) ?? "",
      score: x.leverageScore,
      createdAt: x.createdAt,
    }));
    const s: FeedItem[] = (scorecards.data ?? []).slice(0, 6).map((x) => ({
      id: `s-${x.id}`,
      type: "scorecard" as const,
      goal: x.goal || "Scorecard",
      insight: x.result?.strategicSummary?.slice(0, 140) ?? "",
      score: x.overallScore,
      createdAt: x.createdAt,
    }));
    return [...d, ...s]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [diagnoses.data, scorecards.data]);

  const isLoading = diagnoses.isLoading && scorecards.isLoading;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="label-caps">Recent Intelligence</div>
        <div className="flex items-center gap-1.5">
          <span className="status-pip" style={{ background: "var(--sos-emerald)" }} />
          <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Live Feed</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse p-4" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", height: 72 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
          <span className="material-symbols-outlined" style={{ color: "var(--sos-text-dim)", fontSize: 24, display: "block", marginBottom: 8 }}>query_stats</span>
          <div style={{ fontSize: 12, color: "var(--sos-text-muted)" }}>No intelligence yet. Run a Diagnosis or Scorecard to populate your feed.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const isDiag = item.type === "diagnosis";
            const accentColor = isDiag ? "var(--sos-emerald)" : "var(--sos-blue)";
            const href = isDiag ? "/diagnosis" : "/scorecard";
            return (
              <Link key={item.id} href={href}>
                <div
                  className="flex gap-4 px-5 py-4 cursor-pointer transition-all duration-100"
                  style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", borderLeft: `2px solid ${accentColor}` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--sos-row-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--sos-surface)"; }}
                >
                  <div className="flex flex-col justify-center shrink-0" style={{ width: 72 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: accentColor, textTransform: "uppercase", marginBottom: 4 }}>
                      {isDiag ? "Diagnosis" : "Scorecard"}
                    </div>
                    <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 700, color: accentColor, lineHeight: 1 }}>
                      {item.score}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sos-text)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.goal}
                    </div>
                    {item.insight && (
                      <div style={{ fontSize: 11, color: "var(--sos-text-dim)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {item.insight}{item.insight.length >= 140 ? "…" : ""}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{timeAgo(item.createdAt)}</span>
                    <span className="material-symbols-outlined" style={{ color: "var(--sos-text-dim)", fontSize: 13 }}>arrow_forward</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
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

  const handleScoreUpdate = (date: string, score: number) => {
    setActivity((prev) =>
      prev.some((a) => a.date === date)
        ? prev.map((a) => a.date === date ? { ...a, score, hasContent: true } : a)
        : [...prev, { date, score, hasContent: true }]
    );
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

        {/* Leverage Score Trend + Scorecard Profile — side by side */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="mb-0">
            <LeverageScoreTrend base={base} />
          </div>
          <div className="mb-0">
            <ScorecardRadar base={base} />
          </div>
        </div>

        {/* Execution Heatmap */}
        <ExecutionHeatmap activity={activity} loading={activityLoading} base={base} onScoreUpdate={handleScoreUpdate} />

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

        {/* Recent Intelligence Feed */}
        <IntelligenceFeed base={base} />

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
