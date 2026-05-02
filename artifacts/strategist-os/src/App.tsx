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
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const navItems = [
  { path: "/", label: "Command Centre", icon: "⬛" },
  { path: "/diagnosis", label: "Strategic Diagnosis", icon: "◈" },
  { path: "/scorecard", label: "Optimisation Scorecard", icon: "◎" },
  { path: "/prompts", label: "Prompt Arsenal", icon: "▤" },
  { path: "/opportunity", label: "Opportunity Stack", icon: "◆" },
  { path: "/workflows", label: "Workflow Designer", icon: "⊞" },
  { path: "/planner", label: "Execution Planner", icon: "▦" },
  { path: "/portfolio", label: "Portfolio Mode", icon: "◉" },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [location] = useLocation();

  return (
    <aside
      className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border shrink-0">
        {!collapsed && (
          <div>
            <div className="text-sm font-semibold text-foreground tracking-wide">StrategistOS</div>
            <div className="text-xs text-muted-foreground tracking-wider uppercase">AI Command Centre</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          data-testid="button-toggle-sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium mb-1 cursor-pointer transition-all duration-150 ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
                data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
              >
                <span className="text-xs w-4 shrink-0 flex items-center justify-center">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground">
            <div className="font-medium text-foreground/60">Rayhan Patel</div>
            <div className="text-muted-foreground/70">MSc Data Science · AI Strategist</div>
          </div>
        </div>
      )}
    </aside>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
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
