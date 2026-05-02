import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type UserProfile = {
  displayName: string;
  preferredIndustry: string;
  strategicFocus: string;
  defaultAssets: string;
  defaultConstraints: string;
  updatedAt?: string;
};

function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div
      className="flex items-center justify-between px-8 py-4 shrink-0"
      style={{ borderBottom: "1px solid var(--sos-border)" }}
    >
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--sos-text)", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" }}>
          {title}
        </span>
        {sub && <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2, letterSpacing: "0.04em" }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--sos-border-s)" }}>
      {children}
    </div>
  );
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--sos-text-dim)", textTransform: "uppercase" }}>
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: "var(--sos-text-muted)", letterSpacing: "0.02em" }}>{hint}</div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--sos-input-bg)",
  border: "none",
  borderBottom: "1px solid var(--sos-input-border)",
  color: "var(--sos-text)",
  fontSize: 13,
  padding: "10px 0",
  outline: "none",
  fontFamily: "Inter, sans-serif",
  lineHeight: 1.5,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical" as const,
  minHeight: 72,
  borderBottom: "1px solid var(--sos-input-border)",
};

export default function Settings() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch(`${basePath}/api/settings`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const [form, setForm] = useState<UserProfile>({
    displayName: "",
    preferredIndustry: "",
    strategicFocus: "",
    defaultAssets: "",
    defaultConstraints: "",
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || "",
        preferredIndustry: profile.preferredIndustry || "",
        strategicFocus: profile.strategicFocus || "",
        defaultAssets: profile.defaultAssets || "",
        defaultConstraints: profile.defaultConstraints || "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (data: UserProfile) => {
      const res = await fetch(`${basePath}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: "Profile saved" });
    },
    onError: () => {
      toast({ title: "Failed to save profile", variant: "destructive" });
    },
  });

  const handleSave = () => mutation.mutate(form);

  const displayEmail = isLoaded ? user?.primaryEmailAddress?.emailAddress || "" : "";
  const clerkName = isLoaded ? user?.fullName || "" : "";

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ height: "100%" }}>
        <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Account Settings" sub="Manage your profile and Diagnosis defaults" />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div style={{ maxWidth: 600 }} className="space-y-10">

          {/* Account Info (read-only from Clerk) */}
          <div>
            <SectionLabel>Account</SectionLabel>
            <div className="space-y-5">
              <div
                className="flex items-center gap-4 p-4"
                style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}
              >
                <div
                  style={{
                    width: 40, height: 40, flexShrink: 0,
                    background: "var(--sos-emerald)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "Space Grotesk, sans-serif", fontWeight: 700,
                    fontSize: 15, color: "#0d0e12",
                  }}
                >
                  {(clerkName || displayEmail).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sos-text)" }}>
                    {clerkName || displayEmail}
                  </div>
                  {clerkName && (
                    <div style={{ fontSize: 11, color: "var(--sos-text-muted)", marginTop: 2 }}>
                      {displayEmail}
                    </div>
                  )}
                </div>
                <div style={{ marginLeft: "auto", fontSize: 10, letterSpacing: "0.08em", color: "var(--sos-emerald)", textTransform: "uppercase", fontWeight: 600 }}>
                  Active
                </div>
              </div>

              <Field label="Display name" hint="Shown in the sidebar. Defaults to your Clerk name if left blank.">
                <input
                  style={inputStyle}
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder={clerkName || "Your name"}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--sos-text)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--sos-input-border)"; }}
                />
              </Field>
            </div>
          </div>

          {/* Strategic Profile */}
          <div>
            <SectionLabel>Strategic Profile</SectionLabel>
            <div className="space-y-5">
              <Field label="Preferred industry" hint="Pre-fills the Industry field in every new Diagnosis session.">
                <input
                  style={inputStyle}
                  value={form.preferredIndustry}
                  onChange={(e) => setForm({ ...form, preferredIndustry: e.target.value })}
                  placeholder="e.g. AI Consulting, SaaS, Research, FinTech"
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--sos-text)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--sos-input-border)"; }}
                />
              </Field>

              <Field label="Strategic focus area" hint="A brief statement of what you are primarily working toward right now.">
                <textarea
                  style={textareaStyle}
                  value={form.strategicFocus}
                  onChange={(e) => setForm({ ...form, strategicFocus: e.target.value })}
                  placeholder="e.g. Build a £10k/month AI consulting business leveraging my MSc Data Science background"
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--sos-text)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--sos-input-border)"; }}
                />
              </Field>
            </div>
          </div>

          {/* Diagnosis Defaults */}
          <div>
            <SectionLabel>Diagnosis Defaults</SectionLabel>
            <div className="space-y-5">
              <div
                className="flex items-start gap-3 p-3"
                style={{ background: "rgba(114,254,136,0.04)", border: "1px solid rgba(114,254,136,0.15)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--sos-emerald)", flexShrink: 0, marginTop: 1 }}>
                  auto_awesome
                </span>
                <span style={{ fontSize: 11, color: "var(--sos-text-secondary)", lineHeight: 1.6 }}>
                  These values pre-fill the Diagnosis form automatically, saving you time on every session. You can still override them per-session.
                </span>
              </div>

              <Field label="Default assets" hint="Skills, credentials, tools, relationships, and existing revenue you always bring to every session.">
                <textarea
                  style={textareaStyle}
                  value={form.defaultAssets}
                  onChange={(e) => setForm({ ...form, defaultAssets: e.target.value })}
                  placeholder="e.g. MSc Data Science, Python, AI/ML expertise, LinkedIn audience, existing consulting clients"
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--sos-text)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--sos-input-border)"; }}
                />
              </Field>

              <Field label="Default constraints" hint="Recurring limits that apply to most of your strategy sessions.">
                <textarea
                  style={{ ...textareaStyle, minHeight: 56 }}
                  value={form.defaultConstraints}
                  onChange={(e) => setForm({ ...form, defaultConstraints: e.target.value })}
                  placeholder="e.g. 20 hours/week, no external funding, solo operator"
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--sos-text)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--sos-input-border)"; }}
                />
              </Field>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-4 pb-8">
            <button
              onClick={handleSave}
              disabled={mutation.isPending}
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#0d0e12", background: mutation.isPending ? "rgba(114,254,136,0.5)" : "var(--sos-emerald)",
                border: "none", padding: "11px 32px", cursor: mutation.isPending ? "not-allowed" : "pointer",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              {mutation.isPending ? "Saving..." : "Save profile"}
            </button>
            {saved && (
              <span style={{ fontSize: 11, color: "var(--sos-emerald)", letterSpacing: "0.06em", fontFamily: "Space Grotesk, sans-serif" }}>
                Saved
              </span>
            )}
            {profile?.updatedAt && (
              <span style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.04em", marginLeft: "auto" }}>
                Last saved {new Date(profile.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>

          {/* Strategy Card */}
          {isLoaded && user && (
            <StrategyCardShare userId={user.id} />
          )}

        </div>
      </div>
    </div>
  );
}

function StrategyCardShare({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const cardUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/p/${userId}`;

  function handleCopy() {
    navigator.clipboard.writeText(cardUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div style={{ paddingTop: 32, borderTop: "1px solid var(--sos-border)", paddingBottom: 32 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--sos-text-dim)", textTransform: "uppercase", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--sos-border-s)" }}>
        Strategy Card: Public Profile
      </div>
      <div style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
        Share your Strategy Card with clients, investors, or collaborators. They can see your scores and strategic focus without accessing your workspace.
      </div>
      <div
        className="flex items-center gap-3"
        style={{ background: "var(--sos-surface-low)", border: "1px solid var(--sos-border)", padding: "10px 16px", marginBottom: 12 }}
      >
        <span style={{ fontSize: 12, color: "var(--sos-text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "Inter, sans-serif" }}>
          {cardUrl}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: copied ? "#0d0e12" : "var(--sos-text)",
            background: copied ? "var(--sos-emerald)" : "transparent",
            border: "1px solid var(--sos-border)", padding: "9px 24px", cursor: "pointer",
            fontFamily: "Space Grotesk, sans-serif", transition: "all 0.15s",
          }}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <a
          href={cardUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--sos-text-dim)", textDecoration: "none", fontFamily: "Space Grotesk, sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          Preview
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
        </a>
      </div>
    </div>
  );
}
