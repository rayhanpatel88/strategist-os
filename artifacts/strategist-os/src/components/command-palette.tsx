import { useEffect, useRef, useState } from "react";
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

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const debouncedQuery = useDebounce(query, 280);

  const { data, isFetching } = useQuery<SearchResult>({
    queryKey: ["search", debouncedQuery],
    queryFn: () =>
      fetch(`${basePath}/api/search?q=${encodeURIComponent(debouncedQuery)}`).then((r) => r.json()),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30000,
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const totalResults =
    (data?.diagnoses.length ?? 0) +
    (data?.scorecards.length ?? 0) +
    (data?.opportunities.length ?? 0);

  const hasQuery = debouncedQuery.trim().length >= 2;

  function go(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: "10vh", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 580,
          background: "var(--sos-surface)",
          border: "1px solid var(--sos-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4" style={{ borderBottom: "1px solid var(--sos-border)", height: 52 }}>
          <span className="material-symbols-outlined" style={{ color: "var(--sos-text-dim)", fontSize: 18, flexShrink: 0 }}>
            search
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search diagnoses, scorecards, opportunities…"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "var(--sos-text)",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1,
            }}
          />
          {isFetching && (
            <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Searching…
            </span>
          )}
          <kbd
            style={{
              fontSize: 10, color: "var(--sos-text-muted)", background: "var(--sos-surface-low)",
              border: "1px solid var(--sos-border)", padding: "2px 6px", letterSpacing: "0.04em",
              fontFamily: "Inter, sans-serif", flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {!hasQuery && (
            <div className="px-5 py-10 text-center">
              <span className="material-symbols-outlined" style={{ color: "var(--sos-text-dim)", fontSize: 28, display: "block", marginBottom: 8 }}>
                manage_search
              </span>
              <div style={{ fontSize: 12, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
                Type at least 2 characters to search your intelligence archive
              </div>
            </div>
          )}

          {hasQuery && !isFetching && totalResults === 0 && (
            <div className="px-5 py-10 text-center">
              <div style={{ fontSize: 12, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
                No results for "{debouncedQuery}"
              </div>
            </div>
          )}

          {data && data.diagnoses.length > 0 && (
            <ResultGroup label="Diagnoses" icon="biotech" color="var(--sos-emerald)">
              {data.diagnoses.map((item) => (
                <ResultRow
                  key={`d-${item.id}`}
                  title={item.goal || "Strategic Diagnosis"}
                  sub={item.industry}
                  score={item.leverageScore}
                  color="var(--sos-emerald)"
                  createdAt={item.createdAt}
                  onClick={() => go("/diagnosis")}
                />
              ))}
            </ResultGroup>
          )}

          {data && data.scorecards.length > 0 && (
            <ResultGroup label="Scorecards" icon="analytics" color="var(--sos-blue)">
              {data.scorecards.map((item) => (
                <ResultRow
                  key={`s-${item.id}`}
                  title={item.goal || "Scorecard"}
                  sub={item.industry}
                  score={item.overallScore}
                  color="var(--sos-blue)"
                  createdAt={item.createdAt}
                  onClick={() => go("/scorecard")}
                />
              ))}
            </ResultGroup>
          )}

          {data && data.opportunities.length > 0 && (
            <ResultGroup label="Opportunities" icon="trending_up" color="#a78bfa">
              {data.opportunities.map((item) => (
                <ResultRow
                  key={`o-${item.id}`}
                  title={item.positioningAngle || "Opportunity Stack"}
                  sub={item.inputSummary}
                  color="#a78bfa"
                  createdAt={item.createdAt}
                  onClick={() => go("/opportunity")}
                />
              ))}
            </ResultGroup>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-4 px-5 py-2.5"
          style={{ borderTop: "1px solid var(--sos-border)", background: "var(--sos-surface-low)" }}
        >
          <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
            <kbd style={{ fontFamily: "Inter, sans-serif", background: "var(--sos-surface)", border: "1px solid var(--sos-border)", padding: "1px 5px", marginRight: 4 }}>↵</kbd>
            open
          </span>
          <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
            <kbd style={{ fontFamily: "Inter, sans-serif", background: "var(--sos-surface)", border: "1px solid var(--sos-border)", padding: "1px 5px", marginRight: 4 }}>⌘K</kbd>
            toggle
          </span>
          {hasQuery && totalResults > 0 && (
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
              {totalResults} result{totalResults !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({
  label, icon, color, children,
}: { label: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="flex items-center gap-2 px-5 py-2"
        style={{ borderBottom: "1px solid var(--sos-border-s)", background: "var(--sos-surface-low)" }}
      >
        <span className="material-symbols-outlined" style={{ color, fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase" }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  title, sub, score, color, createdAt, onClick,
}: {
  title: string; sub?: string; score?: number; color: string; createdAt: string; onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-3 cursor-pointer transition-all"
      style={{ borderBottom: "1px solid var(--sos-border-s)", borderLeft: `2px solid ${color}` }}
      onClick={onClick}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--sos-row-hover)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: 13, fontWeight: 500, color: "var(--sos-text)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 11, color: "var(--sos-text-muted)", marginTop: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {score !== undefined && (
        <span
          style={{
            fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700,
            color, flexShrink: 0,
          }}
        >
          {score}
        </span>
      )}
      <span style={{ fontSize: 10, color: "var(--sos-text-muted)", flexShrink: 0 }}>
        {new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </span>
      <span className="material-symbols-outlined" style={{ color: "var(--sos-text-dim)", fontSize: 13, flexShrink: 0 }}>
        arrow_forward
      </span>
    </div>
  );
}
