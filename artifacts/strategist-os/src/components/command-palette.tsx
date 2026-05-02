import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type SearchResult = {
  diagnoses: { id: number; goal: string; industry: string; leverageScore: number; createdAt: string }[];
  scorecards: { id: number; goal: string; industry: string; overallScore: number; createdAt: string }[];
  opportunities: { id: number; inputSummary: string; positioningAngle: string; createdAt: string }[];
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

type Action = {
  id: string;
  label: string;
  sub?: string;
  icon: string;
  color?: string;
  group: string;
  path: string;
};

const ACTIONS: Action[] = [
  { id: "nav-dashboard",   label: "Command Centre",    sub: "Dashboard overview",              icon: "grid_view",       group: "Navigate", path: "/dashboard" },
  { id: "nav-diagnosis",   label: "Diagnosis",         sub: "Find your real bottlenecks",      icon: "biotech",         group: "Navigate", path: "/diagnosis" },
  { id: "nav-scorecard",   label: "Scorecard",         sub: "8-dimension positioning map",     icon: "analytics",       group: "Navigate", path: "/scorecard" },
  { id: "nav-opportunity", label: "Opportunities",     sub: "Demand-skill gap analysis",       icon: "trending_up",     group: "Navigate", path: "/opportunity" },
  { id: "nav-planner",     label: "Planner",           sub: "7-day sprint engine",             icon: "calendar_month",  group: "Navigate", path: "/planner" },
  { id: "nav-calendar",    label: "Calendar",          sub: "Daily schedule planner",          icon: "today",           group: "Navigate", path: "/calendar" },
  { id: "nav-prompts",     label: "Prompt Arsenal",    sub: "Reusable AI prompt library",      icon: "bolt",            group: "Navigate", path: "/prompts" },
  { id: "nav-workflows",   label: "Workflows",         sub: "Systemise repeatable work",       icon: "account_tree",    group: "Navigate", path: "/workflows" },
  { id: "nav-portfolio",   label: "Book a Meeting",    sub: "Portfolio and scheduling",        icon: "event",           group: "Navigate", path: "/portfolio" },
  { id: "nav-settings",    label: "Settings",          sub: "Profile and preferences",         icon: "manage_accounts", group: "Navigate", path: "/settings" },
  { id: "act-diagnosis",   label: "New Diagnosis",     sub: "Start a fresh strategy session",  icon: "add_circle",      color: "var(--sos-emerald)", group: "Quick Actions", path: "/diagnosis" },
  { id: "act-calendar",    label: "Today's Plan",      sub: `Open ${getTodayStr()} in Calendar`, icon: "event_available", color: "var(--sos-blue)", group: "Quick Actions", path: `/calendar?date=${getTodayStr()}` },
  { id: "act-scorecard",   label: "Run Scorecard",     sub: "Start a new positioning check",  icon: "analytics",       color: "#a78bfa",            group: "Quick Actions", path: "/scorecard" },
  { id: "act-prompts",     label: "Generate Prompt",   sub: "Open the prompt generator",      icon: "auto_awesome",    color: "#f59e0b",            group: "Quick Actions", path: "/prompts" },
];

function filterActions(query: string): Action[] {
  if (!query.trim()) return ACTIONS;
  const q = query.toLowerCase();
  return ACTIONS.filter(
    (a) =>
      a.label.toLowerCase().includes(q) ||
      (a.sub ?? "").toLowerCase().includes(q) ||
      a.group.toLowerCase().includes(q)
  );
}

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const debouncedQuery = useDebounce(query, 240);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const { data: searchData, isFetching } = useQuery<SearchResult>({
    queryKey: ["search", debouncedQuery],
    queryFn: () =>
      fetch(`${basePath}/api/search?q=${encodeURIComponent(debouncedQuery)}`).then((r) => r.json()),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30000,
  });

  const hasQuery = query.trim().length >= 2;
  const filteredActions = filterActions(query);

  const searchResults: { type: "search"; label: string; sub?: string; score?: number; color: string; path: string; createdAt: string }[] = [];
  if (searchData) {
    searchData.diagnoses.forEach((d) => searchResults.push({ type: "search", label: d.goal || "Strategic Diagnosis", sub: d.industry, score: d.leverageScore, color: "var(--sos-emerald)", path: "/diagnosis", createdAt: d.createdAt }));
    searchData.scorecards.forEach((s) => searchResults.push({ type: "search", label: s.goal || "Scorecard", sub: s.industry, score: s.overallScore, color: "var(--sos-blue)", path: "/scorecard", createdAt: s.createdAt }));
    searchData.opportunities.forEach((o) => searchResults.push({ type: "search", label: o.positioningAngle || "Opportunity Stack", sub: o.inputSummary, color: "#a78bfa", path: "/opportunity", createdAt: o.createdAt }));
  }

  const totalItems = filteredActions.length + searchResults.length;

  useEffect(() => { setSelectedIdx(0); }, [query]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const go = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, totalItems - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIdx < filteredActions.length) {
          go(filteredActions[selectedIdx].path);
        } else {
          const sr = searchResults[selectedIdx - filteredActions.length];
          if (sr) go(sr.path);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selectedIdx, filteredActions, searchResults, go, totalItems]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const groups = Array.from(new Set(filteredActions.map((a) => a.group)));

  let actionGlobalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: "8vh", background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "calc(100% - 2rem)",
          maxWidth: 620,
          margin: "0 1rem",
          background: "var(--sos-surface)",
          border: "1px solid var(--sos-border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "80vh",
        }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)", height: 54 }}>
          <span className="material-symbols-outlined shrink-0" style={{ color: "var(--sos-text-dim)", fontSize: 18 }}>
            {hasQuery ? "search" : "bolt"}
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to a module…"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: 14, color: "var(--sos-text)", fontFamily: "Inter, sans-serif", lineHeight: 1,
            }}
          />
          {isFetching && (
            <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>
              Searching
            </span>
          )}
          <kbd style={{ fontSize: 10, color: "var(--sos-text-muted)", background: "var(--sos-surface-low)", border: "1px solid var(--sos-border)", padding: "2px 6px", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
            ESC
          </kbd>
        </div>

        {/* Scrollable results */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1 }}>
          {/* Quick Actions / Navigation */}
          {filteredActions.length > 0 && groups.map((group) => {
            const items = filteredActions.filter((a) => a.group === group);
            return (
              <div key={group}>
                <div className="flex items-center gap-2 px-4 py-1.5" style={{ background: "var(--sos-surface-low)", borderBottom: "1px solid var(--sos-border-s)" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sos-text-dim)" }}>
                    {group}
                  </span>
                </div>
                {items.map((action) => {
                  const idx = actionGlobalIdx++;
                  const isActive = selectedIdx === idx;
                  return (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                      style={{
                        borderBottom: "1px solid var(--sos-border-s)",
                        borderLeft: `2px solid ${isActive ? (action.color ?? "var(--sos-text-dim)") : "transparent"}`,
                        background: isActive ? "var(--sos-row-hover)" : "transparent",
                        transition: "background 0.08s",
                      }}
                      onClick={() => go(action.path)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                    >
                      <span
                        className="material-symbols-outlined shrink-0"
                        style={{ fontSize: 16, color: action.color ?? "var(--sos-text-dim)" }}
                      >
                        {action.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sos-text)", lineHeight: 1.3 }}>
                          {action.label}
                        </div>
                        {action.sub && (
                          <div style={{ fontSize: 11, color: "var(--sos-text-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {action.sub}
                          </div>
                        )}
                      </div>
                      <span className="material-symbols-outlined shrink-0" style={{ fontSize: 13, color: "var(--sos-text-dim)" }}>
                        arrow_forward
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Search results */}
          {hasQuery && searchResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-4 py-1.5" style={{ background: "var(--sos-surface-low)", borderBottom: "1px solid var(--sos-border-s)" }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sos-text-dim)" }}>
                  Archive Results
                </span>
                <span style={{ fontSize: 9, color: "var(--sos-text-muted)", marginLeft: "auto", letterSpacing: "0.06em" }}>
                  {searchResults.length} found
                </span>
              </div>
              {searchResults.map((item, i) => {
                const idx = filteredActions.length + i;
                const isActive = selectedIdx === idx;
                return (
                  <div
                    key={`sr-${i}`}
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                    style={{
                      borderBottom: "1px solid var(--sos-border-s)",
                      borderLeft: `2px solid ${isActive ? item.color : "transparent"}`,
                      background: isActive ? "var(--sos-row-hover)" : "transparent",
                      transition: "background 0.08s",
                    }}
                    onClick={() => go(item.path)}
                    onMouseEnter={() => setSelectedIdx(idx)}
                  >
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sos-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.label}
                      </div>
                      {item.sub && (
                        <div style={{ fontSize: 11, color: "var(--sos-text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.sub}
                        </div>
                      )}
                    </div>
                    {item.score !== undefined && (
                      <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: item.color, flexShrink: 0 }}>
                        {item.score}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: "var(--sos-text-muted)", flexShrink: 0 }}>
                      {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                    <span className="material-symbols-outlined shrink-0" style={{ color: "var(--sos-text-dim)", fontSize: 13 }}>arrow_forward</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* No results state */}
          {hasQuery && !isFetching && filteredActions.length === 0 && searchResults.length === 0 && (
            <div className="px-5 py-10 text-center">
              <div style={{ fontSize: 12, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
                No matches for "{query}"
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2 shrink-0"
          style={{ borderTop: "1px solid var(--sos-border)", background: "var(--sos-surface-low)" }}
        >
          <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
            <kbd style={{ fontFamily: "Inter, sans-serif", background: "var(--sos-surface)", border: "1px solid var(--sos-border)", padding: "1px 5px", marginRight: 4 }}>↑↓</kbd>
            navigate
          </span>
          <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
            <kbd style={{ fontFamily: "Inter, sans-serif", background: "var(--sos-surface)", border: "1px solid var(--sos-border)", padding: "1px 5px", marginRight: 4 }}>↵</kbd>
            open
          </span>
          <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
            <kbd style={{ fontFamily: "Inter, sans-serif", background: "var(--sos-surface)", border: "1px solid var(--sos-border)", padding: "1px 5px", marginRight: 4 }}>⌘K</kbd>
            toggle
          </span>
          {totalItems > 0 && (
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
              {selectedIdx + 1} / {totalItems}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
