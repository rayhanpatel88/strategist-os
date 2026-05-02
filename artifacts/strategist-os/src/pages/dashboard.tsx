import { useGetSessionsSummary, useListSessions, useDeleteSession, getListSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-6">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">{label}</div>
      <div className="text-3xl font-bold text-foreground tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
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
        toast({ title: "Session deleted" });
      },
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Command Centre</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your strategic intelligence overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summary.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-lg p-6">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Total Sessions"
              value={summary.data?.totalSessions ?? 0}
              sub="strategy sessions run"
            />
            <StatCard
              label="Avg Leverage Score"
              value={summary.data?.averageLeverageScore ? `${Math.round(summary.data.averageLeverageScore)}/100` : "—"}
              sub="across all diagnoses"
            />
            <StatCard
              label="Top Industry"
              value={summary.data?.topIndustries?.[0]?.industry ?? "—"}
              sub={summary.data?.topIndustries?.[0] ? `${summary.data.topIndustries[0].count} sessions` : undefined}
            />
            <StatCard
              label="System Status"
              value="Active"
              sub="all modules operational"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Run Analysis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/diagnosis", label: "Strategic Diagnosis", desc: "Analyse your position" },
            { href: "/scorecard", label: "Optimisation Score", desc: "Score 8 dimensions" },
            { href: "/opportunity", label: "Opportunity Stack", desc: "Find your positioning" },
            { href: "/planner", label: "Execution Plan", desc: "Convert goals to action" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className="bg-card border border-card-border rounded-lg p-4 cursor-pointer hover:border-primary/40 hover:bg-card/80 transition-all group"
                data-testid={`card-quick-action-${item.href.replace("/", "")}`}
              >
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Recent Sessions</h2>
          <Link href="/diagnosis">
            <span className="text-xs text-primary hover:underline cursor-pointer">New Session</span>
          </Link>
        </div>

        {sessions.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-card-border rounded-lg p-4">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : sessions.data && sessions.data.length > 0 ? (
          <div className="space-y-3">
            {sessions.data.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between"
                data-testid={`card-session-${session.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{session.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {session.industry} · {new Date(session.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  {session.leverageScore != null && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary tabular-nums">{Math.round(session.leverageScore)}</div>
                      <div className="text-xs text-muted-foreground">leverage</div>
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors text-xs"
                    data-testid={`button-delete-session-${session.id}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-lg p-12 text-center">
            <div className="text-muted-foreground text-sm">No strategy sessions yet.</div>
            <Link href="/diagnosis">
              <span className="text-primary text-sm mt-2 inline-block cursor-pointer hover:underline">Run your first diagnosis</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
