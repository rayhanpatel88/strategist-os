import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Diagnosis from "@/pages/diagnosis";
import Scorecard from "@/pages/scorecard";
import Prompts from "@/pages/prompts";
import Opportunity from "@/pages/opportunity";
import Workflows from "@/pages/workflows";
import Planner from "@/pages/planner";
import Portfolio from "@/pages/portfolio";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const navItems = [
  { path: "/", label: "COMMAND_CENTRE", icon: "grid_view" },
  { path: "/diagnosis", label: "DIAGNOSIS", icon: "biotech" },
  { path: "/scorecard", label: "SCORECARD", icon: "analytics" },
  { path: "/prompts", label: "ARSENAL", icon: "bolt" },
  { path: "/opportunity", label: "OPPORTUNITIES", icon: "trending_up" },
  { path: "/workflows", label: "WORKFLOWS", icon: "account_tree" },
  { path: "/planner", label: "PLANNER", icon: "calendar_month" },
  { path: "/portfolio", label: "PORTFOLIO", icon: "web_asset" },
];

function Sidebar() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const base = import.meta.env.BASE_URL;

  return (
    <aside
      className="flex flex-col h-full shrink-0"
      style={{ width: 220, background: "var(--sos-sidebar-bg)", borderRight: "1px solid var(--sos-border)" }}
    >
      {/* Logo */}
      <div
        className="px-4 pt-4 pb-4 flex items-center"
        style={{ borderBottom: "1px solid var(--sos-border)", minHeight: 68 }}
      >
        {isDark ? (
          <img
            src={`${base}logos/logo-dark.png`}
            alt="StrategistOS"
            style={{ width: 148, height: "auto", mixBlendMode: "screen" }}
          />
        ) : (
          <div className="flex items-center gap-3">
            <img
              src={`${base}logos/logo-light.png`}
              alt="StrategistOS"
              style={{ width: 34, height: "auto" }}
            />
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--sos-text)", letterSpacing: "0.02em" }}>
                StrategistOS
              </div>
              <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--sos-text-muted)", textTransform: "uppercase", fontWeight: 500 }}>
                Intelligence Command
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System status bar */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--sos-border-s)" }}>
        <span className="status-pip" style={{ background: "var(--sos-emerald)" }} />
        <span style={{ fontSize: 10, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>All systems operational</span>
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
                  padding: "10px 20px",
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
                  style={{ color: isActive ? "var(--sos-text)" : "var(--sos-text-dim)", fontSize: 16 }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: "0.08em",
                    color: isActive ? "var(--sos-text)" : "var(--sos-text-dim)",
                    textTransform: "uppercase",
                    fontFamily: "Space Grotesk, sans-serif",
                  }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--sos-border)" }}>
        <div style={{ fontSize: 12, color: "var(--sos-text-secondary)", fontWeight: 600, marginBottom: 2 }}>Rayhan Patel</div>
        <div style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.05em", marginBottom: 14 }}>MSc Data Science · AI Strategist</div>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 10, color: "var(--sos-text-dim)", background: "none",
            border: "1px solid var(--sos-border)", padding: "6px 12px",
            cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase",
            fontFamily: "Space Grotesk, sans-serif", width: "100%",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-text-dim)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-border)"; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {isDark ? "light_mode" : "dark_mode"}
          </span>
          {isDark ? "Light Mode" : "Dark Mode"}
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
