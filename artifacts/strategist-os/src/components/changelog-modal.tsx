import { useEffect, useRef, useState } from "react";
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

// ── What's New Banner ─────────────────────────────────────────────────────────

export function WhatsNewBanner({ onOpen, onDismiss }: { onOpen: () => void; onDismiss: () => void }) {
  const latest = changelog[0];
  const highlights = latest.items.filter((i) => i.type === "new").slice(0, 3);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(true), 80);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <>
      <style>{`
        @keyframes sos-banner-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 80,
          width: 340,
          background: "var(--sos-surface)",
          border: "1px solid var(--sos-emerald)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(114,254,136,0.06)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px 10px",
            borderBottom: "1px solid var(--sos-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--sos-emerald)", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
              What's New — v{latest.version}
            </span>
          </div>
          <button
            onClick={onDismiss}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sos-text-dim)", fontSize: 18, lineHeight: 1, padding: "0 4px" }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>

        {/* Summary line */}
        <div style={{ padding: "8px 14px 0", fontSize: 11, color: "var(--sos-text-dim)", fontStyle: "italic", letterSpacing: "0.02em" }}>
          {latest.summary}
        </div>

        {/* Highlights */}
        <div style={{ padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: 9 }}>
          {highlights.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{
                fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
                color: typeColor[item.type],
                border: `1px solid ${typeColor[item.type]}`,
                padding: "1px 5px",
                flexShrink: 0,
                marginTop: 3,
                fontFamily: "Space Grotesk, sans-serif",
                opacity: 0.9,
              }}>
                {typeLabel[item.type]}
              </span>
              <span style={{ fontSize: 11, color: "var(--sos-text-secondary)", lineHeight: 1.55 }}>
                {item.text}
              </span>
            </div>
          ))}
          {latest.items.length > highlights.length && (
            <div style={{ fontSize: 10, color: "var(--sos-text-dim)", paddingLeft: 1, letterSpacing: "0.02em" }}>
              +{latest.items.length - highlights.length} more in the full changelog
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px 12px",
            borderTop: "1px solid var(--sos-border)",
          }}
        >
          <button
            onClick={onDismiss}
            style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}
          >
            Dismiss
          </button>
          <button
            onClick={onOpen}
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#121317",
              background: "var(--sos-emerald)",
              border: "none",
              padding: "7px 16px",
              cursor: "pointer",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            See all updates
          </button>
        </div>
      </div>
    </>
  );
}

// ── Full Changelog Modal ──────────────────────────────────────────────────────

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
          maxWidth: 540,
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
              <div className="flex items-center gap-3 mb-1">
                <span
                  style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    color: i === 0 ? "#121317" : "var(--sos-text-dim)",
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

              {/* Summary line */}
              {entry.summary && (
                <div style={{ fontSize: 11, color: "var(--sos-text-dim)", fontStyle: "italic", marginBottom: 10, letterSpacing: "0.02em" }}>
                  {entry.summary}
                </div>
              )}

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
