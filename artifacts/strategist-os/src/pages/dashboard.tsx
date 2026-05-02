import { useGetSessionsSummary, useListSessions, useDeleteSession, getListSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

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

export default function Dashboard() {
  const summary = useGetSessionsSummary();
  const sessions = useListSessions();
  const deleteSession = useDeleteSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
