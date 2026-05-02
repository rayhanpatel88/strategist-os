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
  const map = new Map(activity.map((a) => [a.date, a]));

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
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

  useEffect(() => {
    fetch(`${base}/api/calendar/activity`)
      .then((r) => r.json())
      .then((data: ActivityEntry[]) => setActivity(data))
      .catch(() => setActivity([]))
      .finally(() => setActivityLoading(false));
  }, [base]);

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
