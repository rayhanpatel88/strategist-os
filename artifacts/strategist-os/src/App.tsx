import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
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

  return (
    <aside
      className="flex flex-col h-full shrink-0"
      style={{ width: 220, background: "#0d0e12", borderRight: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-white font-semibold text-sm tracking-wide mb-0.5" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          StrategistOS
        </div>
        <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", fontWeight: 500 }}>
          Intelligence Command
        </div>
      </div>

      {/* System status bar */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="status-pip" style={{ background: "#72fe88" }} />
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>All systems operational</span>
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
                  borderLeft: isActive ? "2px solid #ffffff" : "2px solid transparent",
                  background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                }}
                data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.35)", fontSize: 16 }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: "0.08em",
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.38)",
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
      <div className="px-5 py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginBottom: 2 }}>Rayhan Patel</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: "0.05em" }}>MSc Data Science · AI Strategist</div>
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
