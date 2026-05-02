import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";

const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

type Note = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  linkedDate: string | null;
  linkedGoalId: number | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

type Goal = { id: number; title: string; type: string };

const NOTE_COLORS: { label: string; value: string | null; hex: string }[] = [
  { label: "Default", value: null, hex: "var(--sos-border)" },
  { label: "Emerald", value: "emerald", hex: "var(--sos-emerald)" },
  { label: "Blue", value: "blue", hex: "var(--sos-blue)" },
  { label: "Amber", value: "amber", hex: "#f59e0b" },
  { label: "Rose", value: "rose", hex: "#f43f5e" },
  { label: "Purple", value: "purple", hex: "#8b5cf6" },
];

function noteAccent(color: string | null): string {
  return NOTE_COLORS.find((c) => c.value === color)?.hex ?? "var(--sos-border)";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatLinkedDate(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// ── Note Modal ────────────────────────────────────────────────────────────────

type ModalProps = {
  note?: Note;
  goals: Goal[];
  onSave: (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: () => void;
  onClose: () => void;
  saving: boolean;
};

function NoteModal({ note, goals, onSave, onDelete, onClose, saving }: ModalProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [linkedDate, setLinkedDate] = useState(note?.linkedDate ?? "");
  const [linkedGoalId, setLinkedGoalId] = useState<number | null>(note?.linkedGoalId ?? null);
  const [color, setColor] = useState<string | null>(note?.color ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

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
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    setTags([...tags, tag]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  function handleSave() {
    onSave({
      title: title.trim(),
      body: body.trim(),
      tags,
      pinned,
      linkedDate: linkedDate || null,
      linkedGoalId,
      color,
    });
  }

  const accent = noteAccent(color);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 580,
          maxHeight: "92dvh",
          background: "var(--sos-surface)",
          borderTop: `3px solid ${accent}`,
          border: `1px solid var(--sos-border)`,
          borderTopColor: accent,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          margin: "0 0 0 0",
        }}
        className="md:mb-0 md:mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif" }}>
            {note ? "Edit Note" : "New Note"}
          </div>
          <div className="flex items-center gap-3">
            {/* Pin toggle */}
            <button
              onClick={() => setPinned(!pinned)}
              title={pinned ? "Unpin" : "Pin note"}
              style={{ background: "none", border: "none", cursor: "pointer", color: pinned ? "var(--sos-emerald)" : "var(--sos-text-dim)", display: "flex", alignItems: "center" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>push_pin</span>
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "1px solid var(--sos-ghost-border)", padding: "5px 8px", cursor: "pointer", color: "var(--sos-text-dim)", display: "flex", alignItems: "center" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            maxLength={300}
            style={{
              width: "100%", background: "none", border: "none", outline: "none",
              fontSize: 18, fontWeight: 700, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif",
              letterSpacing: "0.01em",
            }}
          />

          {/* Body */}
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your note, client observation, strategy thought, or anything worth keeping..."
            rows={8}
            style={{
              width: "100%", background: "none", border: "none", outline: "none",
              resize: "none", fontSize: 13, color: "var(--sos-text-secondary)", lineHeight: 1.7,
              fontFamily: "Inter, sans-serif",
            }}
          />

          {/* Divider */}
          <div style={{ height: 1, background: "var(--sos-border-s)" }} />

          {/* Tags */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>
              Tags
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "var(--sos-tab-active-bg)", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 5, letterSpacing: "0.04em" }}
                >
                  #{t}
                  <button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sos-text-muted)", fontSize: 12, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
                }}
                placeholder="Add tag, press Enter"
                maxLength={50}
                style={{
                  flex: 1, background: "var(--sos-bg)", border: "1px solid var(--sos-border)", outline: "none",
                  padding: "6px 10px", fontSize: 11, color: "var(--sos-text)", letterSpacing: "0.03em",
                }}
              />
              <button
                onClick={() => addTag(tagInput)}
                style={{ background: "var(--sos-surface-low)", border: "1px solid var(--sos-border)", padding: "6px 12px", cursor: "pointer", fontSize: 10, color: "var(--sos-text-dim)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Color accent */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>
              Accent Color
            </div>
            <div className="flex gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={String(c.value)}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  style={{
                    width: 22, height: 22, background: c.hex, border: color === c.value ? "2px solid var(--sos-text)" : "2px solid transparent",
                    cursor: "pointer", outline: "none", flexShrink: 0,
                    opacity: color === c.value ? 1 : 0.55,
                    transition: "opacity 0.15s, border-color 0.15s",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Context links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Link to date */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>
                Link to Date
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={linkedDate}
                  onChange={(e) => setLinkedDate(e.target.value)}
                  style={{
                    flex: 1, background: "var(--sos-bg)", border: "1px solid var(--sos-border)", outline: "none",
                    padding: "6px 10px", fontSize: 11, color: "var(--sos-text)", colorScheme: "dark",
                  }}
                />
                {linkedDate && (
                  <button onClick={() => setLinkedDate("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sos-text-muted)", fontSize: 16 }}>×</button>
                )}
              </div>
            </div>

            {/* Link to goal */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-dim)", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>
                Link to Goal
              </div>
              <select
                value={linkedGoalId ?? ""}
                onChange={(e) => setLinkedGoalId(e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  width: "100%", background: "var(--sos-bg)", border: "1px solid var(--sos-border)", outline: "none",
                  padding: "6px 10px", fontSize: 11, color: "var(--sos-text)", colorScheme: "dark",
                }}
              >
                <option value="">None</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>[{g.type}] {g.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 shrink-0 flex items-center justify-between" style={{ borderTop: "1px solid var(--sos-border)" }}>
          <div>
            {note && (
              confirmDelete ? (
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 10, color: "var(--sos-error)", letterSpacing: "0.04em" }}>Delete this note?</span>
                  <button
                    onClick={onDelete}
                    style={{ fontSize: 10, fontWeight: 700, color: "var(--sos-error)", background: "none", border: "1px solid var(--sos-error)", padding: "5px 12px", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{ fontSize: 10, color: "var(--sos-text-muted)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{ fontSize: 10, color: "var(--sos-text-muted)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sos-error)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sos-text-muted)"; }}
                >
                  Delete note
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              style={{ fontSize: 10, color: "var(--sos-text-dim)", background: "none", border: "1px solid var(--sos-ghost-border)", padding: "7px 16px", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (!title.trim() && !body.trim())}
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#121317", background: "var(--sos-emerald)", border: "none",
                padding: "7px 20px", cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "Space Grotesk, sans-serif",
                opacity: (!title.trim() && !body.trim()) ? 0.4 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Note Card ─────────────────────────────────────────────────────────────────

function NoteCard({ note, goals, onClick }: { note: Note; goals: Goal[]; onClick: () => void }) {
  const accent = noteAccent(note.color);
  const linkedGoal = note.linkedGoalId ? goals.find((g) => g.id === note.linkedGoalId) : null;
  const bodyPreview = note.body.slice(0, 220) + (note.body.length > 220 ? "…" : "");

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--sos-surface)",
        borderLeft: `3px solid ${accent}`,
        border: `1px solid var(--sos-border)`,
        borderLeftColor: accent,
        padding: "16px 18px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "border-color 0.1s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-text-dim)"; (e.currentTarget as HTMLElement).style.borderLeftColor = accent; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--sos-border)"; (e.currentTarget as HTMLElement).style.borderLeftColor = accent; }}
    >
      {/* Top row: title + pin */}
      <div className="flex items-start justify-between gap-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          {note.title ? (
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {note.title}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
              {bodyPreview}
            </div>
          )}
        </div>
        {note.pinned && (
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: 13, color: "var(--sos-emerald)", marginTop: 1 }}>push_pin</span>
        )}
      </div>

      {/* Body preview (only if title exists) */}
      {note.title && note.body && (
        <div style={{ fontSize: 12, color: "var(--sos-text-dim)", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
          {bodyPreview}
        </div>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {note.tags.slice(0, 5).map((t) => (
            <span key={t} style={{ fontSize: 9, color: "var(--sos-text-muted)", letterSpacing: "0.04em", background: "var(--sos-bg)", padding: "2px 6px" }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Context links */}
      {(note.linkedDate || linkedGoal) && (
        <div className="flex flex-wrap gap-3">
          {note.linkedDate && (
            <Link href={`/calendar?date=${note.linkedDate}`} onClick={(e) => e.stopPropagation()}>
              <span style={{ fontSize: 9, color: "var(--sos-blue)", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: 3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>today</span>
                {formatLinkedDate(note.linkedDate)}
              </span>
            </Link>
          )}
          {linkedGoal && (
            <Link href="/goals" onClick={(e) => e.stopPropagation()}>
              <span style={{ fontSize: 9, color: "#8b5cf6", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: 3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>flag</span>
                {linkedGoal.title.slice(0, 28)}{linkedGoal.title.length > 28 ? "…" : ""}
              </span>
            </Link>
          )}
        </div>
      )}

      {/* Footer: timestamp */}
      <div style={{ fontSize: 9, color: "var(--sos-text-subtle)", letterSpacing: "0.04em", marginTop: 2 }}>
        {timeAgo(note.updatedAt)}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editNote, setEditNote] = useState<Note | null | "new">(null);
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const r = await fetch(`${base}/api/notes`);
      const data = await r.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    fetch(`${base}/api/goals`)
      .then((r) => r.json())
      .then((data) => setGoals(Array.isArray(data) ? data : []))
      .catch(() => setGoals([]));
  }, [fetchNotes]);

  // Collect all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort();

  // Filter notes
  const filtered = notes.filter((n) => {
    if (activeTag && !n.tags.includes(activeTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((t) => t.includes(q))
      );
    }
    return true;
  });

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  async function handleSave(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
    setSaving(true);
    try {
      if (editNote === "new") {
        const r = await fetch(`${base}/api/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const created: Note = await r.json();
        setNotes((prev) => [created, ...prev]);
      } else if (editNote) {
        const r = await fetch(`${base}/api/notes/${editNote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const updated: Note = await r.json();
        setNotes((prev) => prev.map((n) => n.id === updated.id ? updated : n));
      }
      setEditNote(null);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editNote || editNote === "new") return;
    try {
      await fetch(`${base}/api/notes/${editNote.id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== (editNote as Note).id));
      setEditNote(null);
    } catch {
      // silent
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
            Notes
          </div>
          <div style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em", marginTop: 2 }}>
            {notes.length === 0 ? "No notes yet" : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <button
          onClick={() => setEditNote("new")}
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#121317", background: "var(--sos-emerald)", border: "none",
            padding: "8px 18px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
          New Note
        </button>
      </div>

      {/* Search + tag filters */}
      <div className="px-4 md:px-8 py-4 shrink-0" style={{ borderBottom: "1px solid var(--sos-border-s)" }}>
        {/* Search */}
        <div className="flex items-center gap-2 mb-3" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", padding: "8px 12px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--sos-text-dim)", flexShrink: 0 }}>search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 12, color: "var(--sos-text)", letterSpacing: "0.02em" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sos-text-muted)", fontSize: 16 }}>×</button>
          )}
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                style={{
                  fontSize: 9, letterSpacing: "0.06em", fontFamily: "Space Grotesk, sans-serif",
                  color: activeTag === tag ? "#121317" : "var(--sos-text-dim)",
                  background: activeTag === tag ? "var(--sos-emerald)" : "var(--sos-surface)",
                  border: `1px solid ${activeTag === tag ? "var(--sos-emerald)" : "var(--sos-border)"}`,
                  padding: "4px 10px", cursor: "pointer",
                  transition: "background 0.12s, color 0.12s",
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)", height: 140 }} />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--sos-text-dim)", marginBottom: 16 }}>sticky_note_2</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 6 }}>
              No notes yet
            </div>
            <div style={{ fontSize: 11, color: "var(--sos-text-muted)", textAlign: "center", maxWidth: 280, lineHeight: 1.6, marginBottom: 20 }}>
              Capture client observations, strategy thoughts, or anything worth keeping.
            </div>
            <button
              onClick={() => setEditNote("new")}
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#121317", background: "var(--sos-emerald)", border: "none",
                padding: "9px 22px", cursor: "pointer", fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              Write your first note
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div style={{ fontSize: 12, color: "var(--sos-text-muted)" }}>No notes match your filter.</div>
            <button onClick={() => { setSearch(""); setActiveTag(null); }} style={{ marginTop: 10, fontSize: 10, color: "var(--sos-blue)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {pinned.length > 0 && (
              <div className="mb-8">
                <div className="label-caps mb-4">Pinned</div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pinned.map((note) => (
                    <NoteCard key={note.id} note={note} goals={goals} onClick={() => setEditNote(note)} />
                  ))}
                </div>
              </div>
            )}

            {/* All / unpinned notes */}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && <div className="label-caps mb-4">All Notes</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {unpinned.map((note) => (
                    <NoteCard key={note.id} note={note} goals={goals} onClick={() => setEditNote(note)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {editNote !== null && (
        <NoteModal
          note={editNote === "new" ? undefined : editNote}
          goals={goals}
          onSave={handleSave}
          onDelete={editNote !== "new" ? handleDelete : undefined}
          onClose={() => setEditNote(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
