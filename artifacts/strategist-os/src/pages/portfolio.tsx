import { useGetPortfolio } from "@workspace/api-client-react";
import { useTheme } from "@/components/theme-provider";

export default function Portfolio() {
  const portfolio = useGetPortfolio();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (portfolio.isLoading) {
    return (
      <div className="flex flex-col h-full" style={{ background: "var(--sos-bg)" }}>
        <div className="flex-1 flex items-center justify-center">
          <div style={{ fontSize: 11, color: "var(--sos-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading portfolio...</div>
        </div>
      </div>
    );
  }

  const data = portfolio.data;
  if (!data) return null;

  const gridLine = isDark ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)";
  const sectionAlt = isDark ? "#121317" : "var(--sos-surface-low)";

  return (
    <div className="flex flex-col min-h-full" style={{ background: "var(--sos-surface-lowest)" }}>
      {/* Top navigation bar */}
      <nav
        className="flex items-center justify-between px-8 py-4 shrink-0 sticky top-0 z-10"
        style={{ background: "var(--sos-portfolio-nav-blur)", borderBottom: "1px solid var(--sos-border)", backdropFilter: "blur(12px)" }}
      >
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--sos-text)", letterSpacing: "0.04em" }}>
          Rayhan Patel
        </div>
        <div className="flex items-center gap-8">
          {["Systems", "Case Studies", "Philosophy", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              style={{ fontSize: 11, color: "var(--sos-text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", fontFamily: "Space Grotesk, sans-serif", transition: "color 0.1s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sos-text)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sos-text-dim)"; }}
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {data.bookingUrl && (
            <a
              href={data.bookingUrl}
              data-testid="link-book-consultation"
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "var(--sos-btn-text)", background: "var(--sos-btn-bg)", padding: "9px 18px", textDecoration: "none",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              Book Call
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="px-8 py-24 relative overflow-hidden" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.025,
          backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }} />

        <div className="max-w-5xl mx-auto relative">
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", color: "var(--sos-emerald)", textTransform: "uppercase", marginBottom: 20, fontFamily: "Space Grotesk, sans-serif" }}>
            Strategic Operating System
          </div>
          <h1
            style={{ fontSize: 56, fontWeight: 700, color: "var(--sos-text)", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 24, fontFamily: "Space Grotesk, sans-serif" }}
            data-testid="text-portfolio-name"
          >
            {data.name}
          </h1>
          <p
            style={{ fontSize: 18, color: "var(--sos-text-secondary)", maxWidth: 560, lineHeight: 1.65, marginBottom: 36 }}
            data-testid="text-portfolio-tagline"
          >
            {data.tagline}
          </p>

          <div className="flex items-center gap-4">
            {data.bookingUrl && (
              <a
                href={data.bookingUrl}
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: "var(--sos-btn-bg)", padding: "13px 28px", textDecoration: "none", fontFamily: "Space Grotesk, sans-serif" }}
                data-testid="link-book-consultation-hero"
              >
                Book a Strategy Call
              </a>
            )}
            <a
              href={`mailto:${data.contactEmail}`}
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-text-secondary)", border: "1px solid var(--sos-ghost-border)", padding: "13px 28px", textDecoration: "none", fontFamily: "Space Grotesk, sans-serif" }}
              data-testid="link-contact"
            >
              Get in Touch
            </a>
          </div>

          {/* Stat strip */}
          <div className="flex items-center gap-12 mt-16" style={{ borderTop: "1px solid var(--sos-border)", paddingTop: 24 }}>
            {[
              { value: "0.1%", label: "Operator Mindset" },
              { value: "AI", label: "Native Strategist" },
              { value: "MSc", label: "Data Science" },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--sos-text)", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: "var(--sos-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Positioning statement */}
      <div className="px-8 py-16" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--sos-text-muted)", textTransform: "uppercase", marginBottom: 16, fontFamily: "Space Grotesk, sans-serif" }}>
            Strategic Positioning
          </div>
          <p
            style={{ fontSize: 20, color: "var(--sos-text-body)", lineHeight: 1.65, fontWeight: 500, maxWidth: 760 }}
            data-testid="text-positioning-statement"
          >
            {data.positioningStatement}
          </p>
        </div>
      </div>

      {/* Featured Systems */}
      {data.systems.length > 0 && (
        <div id="systems" className="px-8 py-16" style={{ background: sectionAlt, borderBottom: "1px solid var(--sos-border)" }}>
          <div className="max-w-5xl mx-auto">
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--sos-text-muted)", textTransform: "uppercase", marginBottom: 24, fontFamily: "Space Grotesk, sans-serif" }}>
              Featured Systems
            </div>
            <div className="grid grid-cols-3 gap-4">
              {data.systems.map((system, i) => (
                <div
                  key={i}
                  className="p-6"
                  style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}
                  data-testid={`card-system-${i}`}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--sos-text)", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>{system.title}</div>
                  <p style={{ fontSize: 12, color: "var(--sos-text-dim)", marginBottom: 14, lineHeight: 1.65 }}>{system.description}</p>
                  <div style={{ fontSize: 11, color: "var(--sos-emerald)", fontWeight: 600, letterSpacing: "0.04em" }}>{system.outcome}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Philosophy */}
      <div id="philosophy" className="px-8 py-16" style={{ borderBottom: "1px solid var(--sos-border)" }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--sos-text-muted)", textTransform: "uppercase", marginBottom: 16, fontFamily: "Space Grotesk, sans-serif" }}>
            Philosophy
          </div>
          <div className="p-8" style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}>
            <p style={{ fontSize: 15, color: "var(--sos-text-body)", lineHeight: 1.75 }} data-testid="text-philosophy">
              {data.philosophy}
            </p>
          </div>
        </div>
      </div>

      {/* Case Studies */}
      {data.caseStudies.length > 0 && (
        <div id="case-studies" className="px-8 py-16" style={{ background: sectionAlt, borderBottom: "1px solid var(--sos-border)" }}>
          <div className="max-w-5xl mx-auto">
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--sos-text-muted)", textTransform: "uppercase", marginBottom: 24, fontFamily: "Space Grotesk, sans-serif" }}>
              Case Studies
            </div>
            <div className="grid grid-cols-2 gap-4">
              {data.caseStudies.map((cs, i) => (
                <div
                  key={i}
                  className="p-6"
                  style={{ background: "var(--sos-surface)", border: "1px solid var(--sos-border)" }}
                  data-testid={`card-case-study-${i}`}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-blue)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{cs.industry}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--sos-text)", marginBottom: 16, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.3 }}>{cs.title}</div>
                  <div className="space-y-4">
                    {[
                      { label: "Challenge", value: cs.challenge },
                      { label: "Approach", value: cs.approach },
                    ].map((item) => (
                      <div key={item.label}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{item.label}</div>
                        <p style={{ fontSize: 12, color: "var(--sos-text-secondary)", lineHeight: 1.6 }}>{item.value}</p>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid var(--sos-border)", paddingTop: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--sos-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Result</div>
                      <p style={{ fontSize: 12, color: "var(--sos-emerald)", fontWeight: 600, lineHeight: 1.6 }}>{cs.result}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div id="contact" className="px-8 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "var(--sos-text-muted)", textTransform: "uppercase", marginBottom: 16, fontFamily: "Space Grotesk, sans-serif" }}>
            Ready to work together?
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "var(--sos-text)", marginBottom: 14, fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}>
            Work that compounds.
          </h2>
          <p style={{ fontSize: 14, color: "var(--sos-text-dim)", marginBottom: 32, lineHeight: 1.7 }}>
            Strategic intelligence and AI systems built for operators who prioritise execution over activity.
          </p>
          <a
            href={`mailto:${data.contactEmail}`}
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sos-btn-text)", background: "var(--sos-btn-bg)", padding: "14px 36px", textDecoration: "none", fontFamily: "Space Grotesk, sans-serif", display: "inline-block" }}
            data-testid="link-cta-contact"
          >
            Send a Message
          </a>
        </div>
      </div>
    </div>
  );
}
