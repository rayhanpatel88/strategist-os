import { Switch, Route, Router as WouterRouter, Link, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { useEffect, useMemo, useRef, useState } from "react";
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
import StrategyCard from "@/pages/strategy-card";
import CommandPalette from "@/components/command-palette";

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

function Sidebar({ onSearchOpen, onClose }: { onSearchOpen: () => void; onClose?: () => void }) {
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
            StrategistAI
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

      {/* Search trigger */}
      <button
        onClick={() => { onClose?.(); onSearchOpen(); }}
        className="flex items-center gap-3 w-full transition-all duration-100"
        style={{
          padding: "9px 20px",
          background: "none",
          border: "none",
          borderBottom: "1px solid var(--sos-border-s)",
          cursor: "pointer",
          textAlign: "left",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--sos-nav-hover-bg)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
      >
        <span className="material-symbols-outlined shrink-0" style={{ color: "var(--sos-text-dim)", fontSize: 15 }}>search</span>
        <span style={{ fontSize: 11, color: "var(--sos-text-dim)", flex: 1, fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.04em" }}>Search…</span>
        <kbd style={{ fontSize: 9, color: "var(--sos-text-muted)", background: "var(--sos-surface-low)", border: "1px solid var(--sos-border)", padding: "1px 5px", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>⌘K</kbd>
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path} onClick={onClose}>
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
                    title={`${unplannedDays} day${unplannedDays === 1 ? "" : "s"} unplanned. Click to plan today.`}
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [showSearch, setShowSearch] = useState(false);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location, isMobile]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile top bar */}
      {isMobile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, height: 52,
          background: "var(--sos-sidebar-bg)", borderBottom: "1px solid var(--sos-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px",
          flexShrink: 0,
        }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: "var(--sos-text-secondary)" }}
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
            </button>
            <img
              src={isDark ? `${basePath}/logos/logo-s-light.png` : `${basePath}/logos/logo-s-dark.svg`}
              alt="" style={{ width: 26, height: 26, objectFit: "contain" }}
            />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--sos-text)", letterSpacing: "0.01em" }}>
              StrategistAI
            </span>
          </div>
          <button
            onClick={() => setShowSearch(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: "var(--sos-text-secondary)" }}
            aria-label="Search"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
          </button>
        </div>
      )}

      {/* Overlay backdrop for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 45 }}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <div style={isMobile ? {
        position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        overflowY: "auto",
      } : { display: "flex", flexShrink: 0 }}>
        <Sidebar
          onSearchOpen={() => { setSidebarOpen(false); setShowSearch(true); }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <main
        className="flex-1 overflow-y-auto"
        style={isMobile ? { paddingTop: 52, width: "100%", minWidth: 0 } : {}}
      >
        {children}
      </main>

      {showSearch && <CommandPalette onClose={() => setShowSearch(false)} />}
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

function AuthPageShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--sos-bg)" }}>
      <header
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--sos-border)" }}
      >
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src={isDark ? `${basePath}/logos/logo-s-light.png` : `${basePath}/logos/logo-s-dark.svg`}
              alt=""
              style={{ width: 28, height: 28, objectFit: "contain" }}
            />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--sos-text)", letterSpacing: "0.01em" }}>
              StrategistAI
            </span>
          </div>
        </Link>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34,
            background: "none",
            border: "1px solid var(--sos-border)",
            cursor: "pointer",
            color: "var(--sos-text-dim)",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-text-dim)";
            (e.currentTarget as HTMLElement).style.color = "var(--sos-text)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-border)";
            (e.currentTarget as HTMLElement).style.color = "var(--sos-text-dim)";
          }}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            {isDark ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthPageShell>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </AuthPageShell>
  );
}

function SignUpPage() {
  return (
    <AuthPageShell>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </AuthPageShell>
  );
}

function getClerkAppearance(isDark: boolean) {
  const logoImageUrl = isDark
    ? `${window.location.origin}${basePath}/logos/logo-s-light.png`
    : `${window.location.origin}${basePath}/logos/logo-s-dark.svg`;

  return {
    theme: shadcn,
    cssLayerName: "clerk",
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: `${window.location.origin}${basePath}/`,
      logoImageUrl,
    },
    variables: isDark ? {
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
    } : {
      colorPrimary: "#2aab40",
      colorForeground: "#0d0e12",
      colorMutedForeground: "#6b7280",
      colorDanger: "#c0392b",
      colorBackground: "#f5f6f8",
      colorInput: "#ffffff",
      colorInputForeground: "#0d0e12",
      colorNeutral: "#9ca3af",
      fontFamily: "Inter, sans-serif",
      borderRadius: "0px",
    },
    elements: isDark ? {
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
      headerTitle: { color: "#e3e2e7", fontFamily: "Space Grotesk, sans-serif", fontWeight: "700", letterSpacing: "-0.01em" },
      headerSubtitle: { color: "#8e9192", fontFamily: "Inter, sans-serif" },
      socialButtonsBlockButtonText: { color: "#e3e2e7", fontFamily: "Inter, sans-serif" },
      formFieldLabel: { color: "#8e9192", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" as const, fontFamily: "Inter, sans-serif", fontWeight: "700" },
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
      socialButtonsBlockButton: { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#e3e2e7", borderRadius: "0", fontFamily: "Inter, sans-serif" },
      formButtonPrimary: { background: "#72fe88", color: "#0d0e12", fontWeight: "700", fontFamily: "Inter, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" as const, borderRadius: "0" },
      formFieldInput: { background: "#0d0e12", borderColor: "rgba(255,255,255,0.1)", color: "#e3e2e7", borderRadius: "0", fontFamily: "Inter, sans-serif" },
      footerAction: { background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.07)" },
      dividerLine: { background: "rgba(255,255,255,0.07)" },
      alert: { background: "rgba(255,180,171,0.05)", borderColor: "rgba(255,180,171,0.2)", borderRadius: "0" },
      otpCodeFieldInput: { background: "#0d0e12", borderColor: "rgba(255,255,255,0.1)", color: "#e3e2e7", borderRadius: "0", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.15em" },
    } : {
      rootBox: "w-full flex justify-center",
      cardBox: {
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.1)",
        borderRadius: "0",
        width: "440px",
        maxWidth: "100%",
        overflow: "hidden",
      },
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: { color: "#0d0e12", fontFamily: "Space Grotesk, sans-serif", fontWeight: "700", letterSpacing: "-0.01em" },
      headerSubtitle: { color: "#6b7280", fontFamily: "Inter, sans-serif" },
      socialButtonsBlockButtonText: { color: "#0d0e12", fontFamily: "Inter, sans-serif" },
      formFieldLabel: { color: "#6b7280", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" as const, fontFamily: "Inter, sans-serif", fontWeight: "700" },
      footerActionLink: { color: "#2aab40", fontFamily: "Inter, sans-serif" },
      footerActionText: { color: "#6b7280", fontFamily: "Inter, sans-serif" },
      dividerText: { color: "#9ca3af", fontFamily: "Inter, sans-serif" },
      identityPreviewEditButton: { color: "#2aab40" },
      identityPreviewText: { color: "#0d0e12" },
      formFieldSuccessText: { color: "#2aab40" },
      formFieldErrorText: { color: "#c0392b" },
      alertText: { color: "#0d0e12", fontFamily: "Inter, sans-serif" },
      logoBox: { display: "flex", justifyContent: "center", padding: "8px 0 4px" },
      logoImage: { height: "40px", width: "40px" },
      socialButtonsBlockButton: { borderColor: "rgba(0,0,0,0.12)", background: "#f8f9fa", color: "#0d0e12", borderRadius: "0", fontFamily: "Inter, sans-serif" },
      formButtonPrimary: { background: "#2aab40", color: "#ffffff", fontWeight: "700", fontFamily: "Inter, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" as const, borderRadius: "0" },
      formFieldInput: { background: "#f5f6f8", borderColor: "rgba(0,0,0,0.12)", color: "#0d0e12", borderRadius: "0", fontFamily: "Inter, sans-serif" },
      footerAction: { background: "rgba(0,0,0,0.02)", borderTop: "1px solid rgba(0,0,0,0.07)" },
      dividerLine: { background: "rgba(0,0,0,0.1)" },
      alert: { background: "rgba(192,57,43,0.05)", borderColor: "rgba(192,57,43,0.2)", borderRadius: "0" },
      otpCodeFieldInput: { background: "#f5f6f8", borderColor: "rgba(0,0,0,0.12)", color: "#0d0e12", borderRadius: "0", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.15em" },
    },
  };
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const appearance = useMemo(() => getClerkAppearance(isDark), [isDark]);

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={appearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to StrategistAI",
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
            <Route path="/p/:userId" component={StrategyCard} />
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
