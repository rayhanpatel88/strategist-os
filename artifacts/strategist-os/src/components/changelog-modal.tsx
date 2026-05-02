import { useEffect, useState } from "react";
import { changelog, CURRENT_VERSION, CHANGELOG_SEEN_KEY } from "@/data/changelog";

export function useChangelogBadge() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(CHANGELOG_SEEN_KEY);
    setHasUnread(seen !== CURRENT_VERSION);
  }, []);

  function markSeen() {
    localStorage.setItem(CHANGELOG_SEEN_KEY, CURRENT_VERSION);
    setHasUnread(false);
  }

  return { hasUnread, markSeen };
}

const typeLabel: Record<string, string> = {
  new: "NEW",
  improved: "IMPROVED",
  fix: "FIX",
};

const typeColor: Record<string, string> = {
  new: "var(--sos-emerald)",
  improved: "var(--sos-blue)",
  fix: "#f59e0b",
};

export default function ChangelogModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "88dvh",
          background: "var(--sos-surface)",
          border: "1px solid var(--sos-border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          margin: "0 1rem 1rem",
        }}
        className="md:mb-0"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--sos-border)" }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
              What's New
            </div>
            <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2, letterSpacing: "0.03em" }}>
              StrategistAI update history
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "1px solid var(--sos-ghost-border)", padding: "5px 8px", cursor: "pointer", color: "var(--sos-text-dim)", display: "flex", alignItems: "center" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
          </button>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {changelog.map((entry, i) => (
            <div key={entry.version}>
              {/* Version header */}
              <div className="flex items-center gap-3 mb-3">
                <span
                  style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    color: i === 0 ? "var(--sos-bg)" : "var(--sos-text-dim)",
                    background: i === 0 ? "var(--sos-emerald)" : "transparent",
                    border: i === 0 ? "none" : "1px solid var(--sos-border)",
                    padding: "2px 8px",
                    fontFamily: "Space Grotesk, sans-serif",
                  }}
                >
                  v{entry.version}
                </span>
                <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
                  {entry.date}
                </span>
                {i === 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-emerald)", textTransform: "uppercase" }}>
                    Latest
                  </span>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                {entry.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <span
                      style={{
                        fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
                        color: typeColor[item.type],
                        border: `1px solid ${typeColor[item.type]}`,
                        padding: "1px 5px",
                        flexShrink: 0,
                        marginTop: 2,
                        fontFamily: "Space Grotesk, sans-serif",
                        opacity: 0.9,
                      }}
                    >
                      {typeLabel[item.type]}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.55 }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {i < changelog.length - 1 && (
                <div style={{ marginTop: 20, height: 1, background: "var(--sos-border-s)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 shrink-0 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--sos-border)" }}
        >
          <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.03em" }}>
            Version {CURRENT_VERSION}
          </span>
          <button
            onClick={onClose}
            style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "var(--sos-text-dim)", background: "none",
              border: "1px solid var(--sos-ghost-border)", padding: "6px 14px",
              cursor: "pointer", fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
