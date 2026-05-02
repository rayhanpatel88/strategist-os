type Props = {
  onClose: () => void;
};

type ShortcutRow = {
  keys: string[];
  label: string;
};

type Section = {
  title: string;
  rows: ShortcutRow[];
};

const SECTIONS: Section[] = [
  {
    title: "Global",
    rows: [
      { keys: ["⌘", "K"], label: "Open search" },
      { keys: ["N"], label: "Quick note capture" },
      { keys: ["?"], label: "Show keyboard shortcuts" },
      { keys: ["ESC"], label: "Close any modal or panel" },
    ],
  },
  {
    title: "Navigation",
    rows: [
      { keys: ["⌘", "K"], label: "Jump to any page via search" },
    ],
  },
  {
    title: "Calendar",
    rows: [
      { keys: ["← Prev", "→ Next"], label: "Navigate between days" },
    ],
  },
  {
    title: "Notes",
    rows: [
      { keys: ["N"], label: "Quick-capture a note from anywhere" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 22,
        height: 20,
        padding: "0 6px",
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "Inter, monospace",
        color: "var(--sos-text)",
        background: "var(--sos-bg)",
        border: "1px solid var(--sos-border)",
        boxShadow: "inset 0 -1px 0 var(--sos-border)",
        letterSpacing: 0,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </kbd>
  );
}

export default function ShortcutsModal({ onClose }: Props) {
  return (
    <>
      <style>{`
        @keyframes sos-sm-in {
          from { opacity: 0; transform: scale(0.97) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 80, backdropFilter: "blur(2px)" }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 81,
          width: 480,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100vh - 64px)",
          overflowY: "auto",
          background: "var(--sos-surface)",
          border: "1px solid var(--sos-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          animation: "sos-sm-in 0.18s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 14px",
            borderBottom: "1px solid var(--sos-border)",
            position: "sticky",
            top: 0,
            background: "var(--sos-surface)",
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 14, fontWeight: 700, color: "var(--sos-text)", letterSpacing: "0.01em" }}>
              Keyboard Shortcuts
            </div>
            <div style={{ fontSize: 10, color: "var(--sos-text-dim)", marginTop: 2, letterSpacing: "0.04em" }}>
              Press ? anytime to show this guide
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sos-text-dim)", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Sections */}
        <div style={{ padding: "8px 0 20px" }}>
          {SECTIONS.map((section) => (
            <div key={section.title} style={{ marginBottom: 4 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--sos-text-dim)",
                  fontFamily: "Space Grotesk, sans-serif",
                  padding: "12px 20px 6px",
                }}
              >
                {section.title}
              </div>
              {section.rows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 20px",
                    borderTop: i === 0 ? "1px solid var(--sos-border-s)" : "none",
                    borderBottom: "1px solid var(--sos-border-s)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--sos-text-body)", flex: 1 }}>
                    {row.label}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    {row.keys.map((k, ki) => (
                      <span key={ki} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Kbd>{k}</Kbd>
                        {ki < row.keys.length - 1 && (
                          <span style={{ fontSize: 9, color: "var(--sos-text-muted)" }}>+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--sos-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            bottom: 0,
            background: "var(--sos-surface)",
          }}
        >
          <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
            Mac: use ⌘ — Windows/Linux: use Ctrl
          </span>
          <button
            onClick={onClose}
            style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "var(--sos-text-dim)", background: "none",
              border: "1px solid var(--sos-ghost-border)", padding: "6px 14px", cursor: "pointer",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
