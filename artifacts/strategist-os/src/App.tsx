import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Diagnosis from "@/pages/diagnosis";
import Scorecard from "@/pages/scorecard";
import Prompts from "@/pages/prompts";
import Opportunity from "@/pages/opportunity";
import Workflows from "@/pages/workflows";
import Planner from "@/pages/planner";
import Portfolio from "@/pages/portfolio";
import Calendar from "@/pages/calendar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const navItems = [
  { path: "/", label: "Command Centre", icon: "grid_view" },
  { path: "/diagnosis", label: "Diagnosis", icon: "biotech" },
  { path: "/scorecard", label: "Scorecard", icon: "analytics" },
  { path: "/prompts", label: "Arsenal", icon: "bolt" },
  { path: "/opportunity", label: "Opportunities", icon: "trending_up" },
  { path: "/workflows", label: "Workflows", icon: "account_tree" },
  { path: "/planner", label: "Planner", icon: "calendar_month" },
  { path: "/calendar", label: "Calendar", icon: "today" },
  { path: "/portfolio", label: "Portfolio", icon: "web_asset" },
];

function useWeeklyUnplanned(): number {
  const [count, setCount] = useState(0);
  const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

  useEffect(() => {
    fetch(`${base}/api/calendar/activity`)
      .then((r) => r.json())
      .then((data: { date: string; hasContent: boolean }[]) => {
        if (!Array.isArray(data)) return;
        const activityMap = new Map(data.map((a) => [a.date, a.hasContent]));
        const today = new Date();
        const dow = (today.getDay() + 6) % 7;
        let unplanned = 0;
        for (let i = 0; i <= dow; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - dow + i);
          const ds = d.toISOString().split("T")[0];
          if (!activityMap.get(ds)) unplanned++;
        }
        setCount(unplanned);
      })
      .catch(() => {});
  }, [base]);

  return count;
}

function Sidebar() {
  const [location, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const base = import.meta.env.BASE_URL;
  const unplannedDays = useWeeklyUnplanned();

  return (
    <aside
      className="flex flex-col h-full shrink-0"
      style={{ width: 220, background: "var(--sos-sidebar-bg)", borderRight: "1px solid var(--sos-border)" }}
    >
      {/* Logo */}
      <div
        className="px-5 pt-5 pb-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid var(--sos-border)", minHeight: 68 }}
      >
        <img
          src={`${base}logos/${isDark ? "logo-s-light" : "logo-s-dark"}.svg`}
          alt=""
          style={{ width: 32, height: 32, flexShrink: 0 }}
        />
        <div>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--sos-text)", letterSpacing: "0.01em" }}>
            StrategistOS
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--sos-text-muted)", textTransform: "uppercase", fontWeight: 500 }}>
            Strategy System
          </div>
        </div>
      </div>

      {/* System status bar */}
      <div className="px-5 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--sos-border-s)" }}>
        <span className="status-pip" style={{ background: "var(--sos-emerald)" }} />
        <span style={{ fontSize: 10, color: "var(--sos-text-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Systems ready</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className="flex items-center gap-3 cursor-pointer transition-all duration-100"
                style={{
                  padding: "9px 20px",
                  borderLeft: isActive ? "2px solid var(--sos-nav-active-border)" : "2px solid transparent",
                  background: isActive ? "var(--sos-nav-active-bg)" : "transparent",
                }}
                data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--sos-nav-hover-bg)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ color: isActive ? "var(--sos-text)" : "var(--sos-text-dim)", fontSize: 15 }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: "0.04em",
                    color: isActive ? "var(--sos-text)" : "var(--sos-text-dim)",
                    fontFamily: "Space Grotesk, sans-serif",
                    flex: 1,
                  }}
                >
                  {item.label}
                </span>
                {item.path === "/calendar" && unplannedDays > 0 && (
                  <span
                    title={`${unplannedDays} day${unplannedDays === 1 ? "" : "s"} unplanned — click to plan today`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate("/calendar?autoplan=today");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      background: unplannedDays >= 3 ? "var(--sos-error)" : "#f59e0b",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: "Space Grotesk, sans-serif",
                      letterSpacing: 0,
                      padding: "0 4px",
                      lineHeight: 1,
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  >
                    {unplannedDays}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--sos-border)" }}>
        <div style={{ fontSize: 12, color: "var(--sos-text-secondary)", fontWeight: 600, marginBottom: 1 }}>Rayhan Patel</div>
        <div style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.03em", marginBottom: 14 }}>MSc Data Science · AI Strategist</div>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 10, color: "var(--sos-text-dim)", background: "none",
            border: "1px solid var(--sos-border)", padding: "6px 12px",
            cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase",
            fontFamily: "Space Grotesk, sans-serif", width: "100%",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-text-dim)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-border)"; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            {isDark ? "light_mode" : "dark_mode"}
          </span>
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/diagnosis" component={Diagnosis} />
        <Route path="/scorecard" component={Scorecard} />
        <Route path="/prompts" component={Prompts} />
        <Route path="/opportunity" component={Opportunity} />
        <Route path="/workflows" component={Workflows} />
        <Route path="/planner" component={Planner} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/portfolio" component={Portfolio} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="strategist-os-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
