import { useEffect, useRef, useState } from "react";

const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

type Props = {
  onClose: () => void;
};

export default function QuickNote({ onClose }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag) || tags.length >= 5) return;
    setTags((t) => [...t, tag]);
    setTagInput("");
  }

  async function handleSave() {
    if (!title.trim() && !body.trim()) return;
    setSaving(true);
    try {
      await fetch(`${base}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), tags }),
      });
      setSaved(true);
      setTimeout(() => onClose(), 800);
    } catch {
      setSaving(false);
    }
  }

  const canSave = (title.trim() || body.trim()) && !saving && !saved;

  return (
    <>
      <style>{`
        @keyframes sos-qn-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Backdrop — click outside to close */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 75, background: "transparent" }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 76,
          width: 360,
          maxWidth: "calc(100vw - 32px)",
          background: "var(--sos-surface)",
          border: "1px solid var(--sos-emerald)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          animation: "sos-qn-in 0.2s ease",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid var(--sos-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--sos-emerald)", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
              Quick Note
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <kbd style={{ fontSize: 9, color: "var(--sos-text-muted)", background: "var(--sos-bg)", border: "1px solid var(--sos-border)", padding: "1px 5px", fontFamily: "Inter, sans-serif" }}>
              ESC
            </kbd>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sos-text-dim)", fontSize: 18, lineHeight: 1, padding: "0 2px" }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); bodyRef.current?.focus(); } }}
          placeholder="Title (optional)"
          maxLength={300}
          style={{
            padding: "12px 14px 4px",
            background: "none", border: "none", outline: "none",
            fontSize: 15, fontWeight: 700, color: "var(--sos-text)",
            fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.01em",
            width: "100%",
          }}
        />

        {/* Body */}
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's on your mind?"
          rows={5}
          style={{
            padding: "6px 14px 12px",
            background: "none", border: "none", outline: "none",
            resize: "none", fontSize: 12, color: "var(--sos-text-secondary)",
            lineHeight: 1.65, fontFamily: "Inter, sans-serif", width: "100%",
          }}
        />

        {/* Tags row */}
        <div style={{ padding: "0 14px 12px", borderTop: "1px solid var(--sos-border-s)", paddingTop: 10 }}>
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 7 }}>
              {tags.map((t) => (
                <span
                  key={t}
                  style={{ fontSize: 9, color: "var(--sos-text-muted)", background: "var(--sos-bg)", padding: "2px 7px", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  #{t}
                  <button
                    onClick={() => setTags((ts) => ts.filter((x) => x !== t))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sos-text-dim)", fontSize: 11, lineHeight: 1, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
            }}
            placeholder="Add tag, Enter to confirm"
            maxLength={40}
            style={{
              width: "100%", background: "var(--sos-bg)", border: "1px solid var(--sos-border-s)",
              outline: "none", padding: "5px 9px", fontSize: 10, color: "var(--sos-text)",
              letterSpacing: "0.03em",
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px 12px",
            borderTop: "1px solid var(--sos-border)",
          }}
        >
          <span style={{ fontSize: 9, color: "var(--sos-text-muted)", letterSpacing: "0.04em" }}>
            Saved to Notes
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={onClose}
              style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: saved ? "var(--sos-emerald)" : "#121317",
                background: saved ? "rgba(114,254,136,0.12)" : canSave ? "var(--sos-emerald)" : "var(--sos-surface-low)",
                border: saved ? "1px solid var(--sos-emerald)" : "none",
                padding: "7px 18px", cursor: canSave ? "pointer" : "not-allowed",
                fontFamily: "Space Grotesk, sans-serif",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {saved ? "Saved" : saving ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
