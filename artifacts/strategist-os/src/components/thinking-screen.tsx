import { useState, useEffect } from "react";

interface ThinkingScreenProps {
  stages: string[];
  title: string;
  subtitle: string;
}

export function ThinkingScreen({ stages, title, subtitle }: ThinkingScreenProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [dots, setDots] = useState(1);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stageMs = Math.floor((18000) / stages.length);
    const stageTimer = setInterval(() => {
      setCurrentStage((prev) => Math.min(prev + 1, stages.length - 1));
    }, stageMs);
    const dotsTimer = setInterval(() => setDots((d) => (d % 3) + 1), 480);
    const elapsedTimer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearInterval(stageTimer);
      clearInterval(dotsTimer);
      clearInterval(elapsedTimer);
    };
  }, [stages.length]);

  const progressPct = Math.min(((currentStage + 1) / stages.length) * 100, 96);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center"
      style={{ background: "var(--sos-bg)", padding: "48px 32px" }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span
            className="status-pip"
            style={{
              background: "var(--sos-emerald)",
              boxShadow: "0 0 8px var(--sos-emerald)",
              animation: "pulse 1.4s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--sos-text)",
                fontFamily: "Space Grotesk, sans-serif",
                letterSpacing: "0.01em",
              }}
            >
              {title}
              {".".repeat(dots)}
            </div>
            <div style={{ fontSize: 10, color: "var(--sos-text-muted)", marginTop: 2, letterSpacing: "0.04em" }}>
              {subtitle}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 2,
            background: "var(--sos-track-bg)",
            marginBottom: 32,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 2,
              width: `${progressPct}%`,
              background: "var(--sos-emerald)",
              transition: "width 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 8px var(--sos-emerald)",
            }}
          />
        </div>

        {/* Stages */}
        <div className="space-y-3 mb-10">
          {stages.map((stage, i) => {
            const isDone = i < currentStage;
            const isActive = i === currentStage;
            const isPending = i > currentStage;

            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  style={{
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: isDone
                      ? "none"
                      : isActive
                      ? "1px solid var(--sos-emerald)"
                      : "1px solid var(--sos-ghost-border)",
                    background: isDone ? "var(--sos-emerald)" : "transparent",
                    transition: "all 0.3s ease",
                  }}
                >
                  {isDone && (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 10, color: "#0d0e12", fontVariationSettings: "'FILL' 1" }}
                    >
                      check
                    </span>
                  )}
                  {isActive && (
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        background: "var(--sos-emerald)",
                        animation: "pulse 1s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: isDone
                      ? "var(--sos-text-muted)"
                      : isActive
                      ? "var(--sos-text)"
                      : "var(--sos-text-subtle)",
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: isActive ? "Space Grotesk, sans-serif" : "inherit",
                    transition: "color 0.3s ease",
                    letterSpacing: isActive ? "0.01em" : 0,
                  }}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div
            style={{
              fontSize: 9,
              color: "var(--sos-text-subtle)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "Space Grotesk, sans-serif",
            }}
          >
            gpt-5.1 · strategic advisor model
          </div>
          <div
            style={{
              fontSize: 9,
              color: "var(--sos-text-subtle)",
              letterSpacing: "0.08em",
              fontFamily: "Space Grotesk, sans-serif",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {elapsed}s
          </div>
        </div>
      </div>
    </div>
  );
}
