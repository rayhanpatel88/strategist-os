import { Switch, Route, Router as WouterRouter, Link, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/react";
import { shadcn } from "@clerk/themes";
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
import Landing from "@/pages/landing";
import Settings from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const navItems = [
  { path: "/dashboard", label: "Command Centre", icon: "grid_view" },
  { path: "/diagnosis", label: "Diagnosis", icon: "biotech" },
  { path: "/scorecard", label: "Scorecard", icon: "analytics" },
  { path: "/prompts", label: "Arsenal", icon: "bolt" },
  { path: "/opportunity", label: "Opportunities", icon: "trending_up" },
  { path: "/workflows", label: "Workflows", icon: "account_tree" },
  { path: "/planner", label: "Planner", icon: "calendar_month" },
  { path: "/calendar", label: "Calendar", icon: "today" },
  { path: "/portfolio", label: "Book a Meeting", icon: "event" },
  { path: "/settings", label: "Settings", icon: "manage_accounts" },
];

function useWeeklyUnplanned(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`${basePath}/api/calendar/activity`)
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
  }, []);

  return count;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Sidebar() {
  const [location, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const isDark = theme === "dark";
  const unplannedDays = useWeeklyUnplanned();

  const displayName = isLoaded
    ? user?.fullName ||
      user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
      "User"
    : "";
  const displayEmail = isLoaded
    ? user?.primaryEmailAddress?.emailAddress || ""
    : "";

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
          src={isDark ? `${basePath}/logos/logo-s-light.png` : `${basePath}/logos/logo-s-dark.svg`}
          alt=""
          style={{ width: 32, height: 32, flexShrink: 0, objectFit: "contain" }}
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
        {isLoaded && user && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "var(--sos-text-secondary)", fontWeight: 600, marginBottom: 2 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.03em" }}>
              {displayEmail}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
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
          <button
            onClick={() => signOut({ redirectUrl: `${window.location.origin}${basePath}/` })}
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
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>logout</span>
            Sign out
          </button>
        </div>
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

function HomeRedirect() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <Landing />;
  if (isSignedIn) return <Redirect to="/dashboard" />;
  return <Landing />;
}

function ProtectedPage({ component: Component }: { component: React.ComponentType }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--sos-bg)",
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--sos-text-muted)",
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          Loading...
        </span>
      </div>
    );
  }

  if (!isSignedIn) return <Redirect to="/" />;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function SignInPage() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-4"
      style={{ background: "var(--sos-bg)" }}
    >
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-4"
      style={{ background: "var(--sos-bg)" }}
    >
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: `${window.location.origin}${basePath}/`,
    logoImageUrl: `${window.location.origin}${basePath}/logos/logo-s-light.svg`,
  },
  variables: {
    colorPrimary: "#72fe88",
    colorForeground: "#e3e2e7",
    colorMutedForeground: "#8e9192",
    colorDanger: "#ffb4ab",
    colorBackground: "#121317",
    colorInput: "#0d0e12",
    colorInputForeground: "#e3e2e7",
    colorNeutral: "#444748",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: {
      background: "#1e1f23",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "0",
      width: "440px",
      maxWidth: "100%",
      overflow: "hidden",
    },
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: {
      color: "#e3e2e7",
      fontFamily: "Space Grotesk, sans-serif",
      fontWeight: "700",
      letterSpacing: "-0.01em",
    },
    headerSubtitle: { color: "#8e9192", fontFamily: "Inter, sans-serif" },
    socialButtonsBlockButtonText: { color: "#e3e2e7", fontFamily: "Inter, sans-serif" },
    formFieldLabel: {
      color: "#8e9192",
      fontSize: "11px",
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      fontFamily: "Inter, sans-serif",
      fontWeight: "700",
    },
    footerActionLink: { color: "#72fe88", fontFamily: "Inter, sans-serif" },
    footerActionText: { color: "#8e9192", fontFamily: "Inter, sans-serif" },
    dividerText: { color: "#444748", fontFamily: "Inter, sans-serif" },
    identityPreviewEditButton: { color: "#72fe88" },
    identityPreviewText: { color: "#e3e2e7" },
    formFieldSuccessText: { color: "#72fe88" },
    formFieldErrorText: { color: "#ffb4ab" },
    alertText: { color: "#e3e2e7", fontFamily: "Inter, sans-serif" },
    logoBox: { display: "flex", justifyContent: "center", padding: "8px 0 4px" },
    logoImage: { height: "40px", width: "40px" },
    socialButtonsBlockButton: {
      borderColor: "rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.03)",
      color: "#e3e2e7",
      borderRadius: "0",
      fontFamily: "Inter, sans-serif",
    },
    formButtonPrimary: {
      background: "#72fe88",
      color: "#0d0e12",
      fontWeight: "700",
      fontFamily: "Inter, sans-serif",
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      borderRadius: "0",
    },
    formFieldInput: {
      background: "#0d0e12",
      borderColor: "rgba(255,255,255,0.1)",
      color: "#e3e2e7",
      borderRadius: "0",
      fontFamily: "Inter, sans-serif",
    },
    footerAction: { background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.07)" },
    dividerLine: { background: "rgba(255,255,255,0.07)" },
    alert: {
      background: "rgba(255,180,171,0.05)",
      borderColor: "rgba(255,180,171,0.2)",
      borderRadius: "0",
    },
    otpCodeFieldInput: {
      background: "#0d0e12",
      borderColor: "rgba(255,255,255,0.1)",
      color: "#e3e2e7",
      borderRadius: "0",
      fontFamily: "Space Grotesk, sans-serif",
      letterSpacing: "0.15em",
    },
  },
};

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to StrategistOS",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start building your strategy system",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard" component={() => <ProtectedPage component={Dashboard} />} />
            <Route path="/diagnosis" component={() => <ProtectedPage component={Diagnosis} />} />
            <Route path="/scorecard" component={() => <ProtectedPage component={Scorecard} />} />
            <Route path="/prompts" component={() => <ProtectedPage component={Prompts} />} />
            <Route path="/opportunity" component={() => <ProtectedPage component={Opportunity} />} />
            <Route path="/workflows" component={() => <ProtectedPage component={Workflows} />} />
            <Route path="/planner" component={() => <ProtectedPage component={Planner} />} />
            <Route path="/calendar" component={() => <ProtectedPage component={Calendar} />} />
            <Route path="/portfolio" component={() => <ProtectedPage component={Portfolio} />} />
            <Route path="/settings" component={() => <ProtectedPage component={Settings} />} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="strategist-os-theme">
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
