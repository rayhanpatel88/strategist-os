import { useEffect } from "react";

const CALENDLY_URL = "https://calendly.com/rayhanpatel88/30min";

export default function BookMeeting() {
  useEffect(() => {
    const existingScript = document.getElementById("calendly-widget-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "calendly-widget-script";
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.head.appendChild(script);
    }
    return () => {
      const s = document.getElementById("calendly-widget-script");
      if (s) s.remove();
    };
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--sos-border)" }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--sos-text)",
              textTransform: "uppercase",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            Book a Meeting
          </span>
          <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2 }}>
            30-minute strategy session. Pick a time that works.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-pip" style={{ background: "var(--sos-emerald)" }} />
          <span
            style={{
              fontSize: 10,
              color: "var(--sos-text-dim)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Calendar live
          </span>
        </div>
      </div>

      {/* Calendly inline embed */}
      <div className="flex-1 overflow-hidden">
        <div
          className="calendly-inline-widget"
          data-url={CALENDLY_URL}
          style={{
            width: "100%",
            height: "100%",
            minHeight: 600,
          }}
        />
      </div>
    </div>
  );
}
