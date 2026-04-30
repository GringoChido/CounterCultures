"use client";

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface PipelineJourneyProps {
  dealLabel?: string;
  dealId?: string;
  clientName?: string;
  dealValue?: string;
  /** 0-4 index: discovery, design, close, fulfillment, delivered. Animation flies to this phase then pulses. */
  targetPhase?: number;
  speed?: number;
  className?: string;
}

// Counter Cultures brand typography
const FONT_BODY =
  "var(--font-body), 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_DISPLAY =
  "var(--font-display), 'Cormorant Garamond', Georgia, serif";
const FONT_MONO =
  "var(--font-mono), 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";

// Counter Cultures brand palette
const BRAND = {
  copper: "#B87333",
  terracotta: "#C4725A",
  sage: "#7A8B6F",
  stone: "#A89F91",
  sand: "#D4C5A9",
  charcoal: "#1A1A1A",
  linen: "#F5F0EB",
};

// Pipeline phases — the full journey from first contact to delivery
const PHASES = [
  { id: "discovery", title: "Discovery", count: 3, accent: BRAND.copper },
  { id: "design", title: "Design & Scope", count: 2, accent: "#8B5CF6" },
  { id: "close", title: "Proposal / Negotiation", count: 1, accent: BRAND.terracotta },
  { id: "fulfillment", title: "Fulfillment", count: 2, accent: BRAND.sage },
  { id: "delivered", title: "Delivered", count: 4, accent: "#10B981" },
];

const COL_WIDTH = 210;
const COL_GAP = 16;
const BOARD_TOP = 100;
const BOARD_LEFT = 60;
const CARD_W = 190;
const CARD_H = 80;

function phaseCenter(index: number) {
  const x = BOARD_LEFT + index * (COL_WIDTH + COL_GAP) + COL_WIDTH / 2;
  const y = BOARD_TOP + 80;
  return { x, y };
}

function pseudoRandom(i: number) {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

function PlaceholderCard({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      style={{
        width: CARD_W,
        height: 68,
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 8,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        opacity,
      }}
    >
      <div
        style={{
          width: "65%",
          height: 8,
          borderRadius: 4,
          background: "rgba(255,255,255,0.10)",
        }}
      />
      <div
        style={{
          width: "40%",
          height: 6,
          borderRadius: 4,
          background: "rgba(255,255,255,0.06)",
        }}
      />
      <div style={{ flex: 1 }} />
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
        }}
      />
    </div>
  );
}

export function PipelineJourney({
  dealLabel = "Casa Terracotta — Master Bath",
  dealId = "CC-2847",
  clientName = "Arq. María López",
  dealValue = "$485K",
  targetPhase,
  speed = 1,
  className,
}: PipelineJourneyProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  // When targetPhase is set, only fly up to that phase then stop
  const maxFlights = targetPhase !== undefined ? targetPhase : 4;

  // 4 flights across 5 phases — wider gaps for timer interpolation
  const flights = [
    { start: 25, end: 55 },   // Discovery → Design
    { start: 70, end: 100 },  // Design → Close
    { start: 120, end: 150 }, // Close → Fulfillment
    { start: 165, end: 195 }, // Fulfillment → Delivered
  ].slice(0, maxFlights);
  const confettiStart = targetPhase === 4 ? 195 : -1; // Only confetti on delivered

  const centers = PHASES.map((_, i) => phaseCenter(i));

  // Card position interpolation across 5 phases
  let cx: number;
  let cy: number;
  let rotZ = 0;
  let scaleBoost = 1;
  let shadowAlpha = 0.25;
  let shadowBlur = 16;
  let currentPhaseIdx = 0;

  // Determine which phase/flight we're in
  if (flights.length === 0 || frame < flights[0].start) {
    // No flights (targetPhase=0) or before first flight — sit at phase 0
    const restPhase = targetPhase !== undefined ? targetPhase : 0;
    cx = centers[restPhase].x;
    cy = centers[restPhase].y;
    currentPhaseIdx = restPhase;
  } else {
    // Default to last reachable phase
    const lastPhase = flights.length;
    cx = centers[lastPhase].x;
    cy = centers[lastPhase].y;
    currentPhaseIdx = lastPhase;

    for (let f = 0; f < flights.length; f++) {
      const { start, end } = flights[f];
      if (frame >= start && frame < end) {
        // In flight
        const p = (frame - start) / (end - start);
        cx = interpolate(p, [0, 1], [centers[f].x, centers[f + 1].x]);
        const arc = Math.sin(p * Math.PI) * 60;
        cy = interpolate(p, [0, 1], [centers[f].y, centers[f + 1].y]) - arc;
        rotZ = Math.sin(p * Math.PI) * 2.5;
        scaleBoost = 1 + Math.sin(p * Math.PI) * 0.12;
        shadowAlpha = 0.25 + Math.sin(p * Math.PI) * 0.35;
        shadowBlur = 16 + Math.sin(p * Math.PI) * 50;
        currentPhaseIdx = f;
        break;
      } else if (frame >= flights[f].end && (f === flights.length - 1 || frame < flights[f + 1].start)) {
        // Resting in phase f+1
        cx = centers[f + 1].x;
        cy = centers[f + 1].y;
        currentPhaseIdx = f + 1;
        break;
      }
    }
  }

  // Landing micro-spring on each arrival
  const landings = flights.map((flight) =>
    spring({
      frame: frame - flight.end,
      fps,
      config: { damping: 10, stiffness: 180, mass: 0.7 },
      durationInFrames: 16,
    }),
  );

  let landingScale = 1;
  for (let f = 0; f < flights.length; f++) {
    const nextStart = f < flights.length - 1 ? flights[f + 1].start : Infinity;
    if (frame >= flights[f].end && frame < nextStart) {
      landingScale = interpolate(landings[f], [0, 1], [0.92, 1]);
    }
  }

  // Column flash on landing
  const flashes = flights.map((flight) =>
    interpolate(
      frame,
      [flight.end, flight.end + 3, flight.end + 14],
      [0, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ),
  );

  // Current accent color for the card
  const currentAccent = PHASES[currentPhaseIdx].accent;

  // Progress indicator — which phase we've completed
  const progressDots = PHASES.map((_, i) => {
    if (i === 0 && flights.length > 0 && frame >= flights[0].start) return "completed";
    if (i === 0 && flights.length === 0 && targetPhase !== undefined && targetPhase >= 0) return "active";
    for (let f = 0; f < flights.length; f++) {
      if (i === f + 1 && frame >= flights[f].end) return "completed";
    }
    if (i === currentPhaseIdx) return "active";
    return "pending";
  });

  // Timer visibility during Close phase wait (100–120 gap) — only when enough flights exist
  const hasTimerGap = flights.length >= 3;
  const waitStart = hasTimerGap ? flights[1].end : 0;
  const waitEnd = hasTimerGap ? flights[2].start : 1;
  const timerOpacity = hasTimerGap
    ? interpolate(
        frame,
        [waitStart + 2, waitStart + 7, waitEnd - 5, waitEnd],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 0;
  const timerDays = hasTimerGap
    ? Math.floor(
        interpolate(frame, [waitStart, waitEnd], [0, 14], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      )
    : 0;

  // Confetti particles
  const PARTICLE_COUNT = 42;
  const confettiFrame = frame - confettiStart;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: BRAND.charcoal,
        fontFamily: FONT_BODY,
        color: "white",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid bg */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(184,115,51,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(184,115,51,0.03) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Warm gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, rgba(184,115,51,0.06) 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: BOARD_LEFT,
          display: "flex",
          alignItems: "baseline",
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: BRAND.linen,
          }}
        >
          Deal Journey
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: BRAND.stone,
            opacity: 0.6,
          }}
        >
          From discovery to delivery
        </div>
      </div>

      {/* Progress dots under title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: BOARD_LEFT,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {progressDots.map((status, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: status === "active" ? 10 : 7,
                height: status === "active" ? 10 : 7,
                borderRadius: 999,
                background:
                  status === "completed"
                    ? PHASES[i].accent
                    : status === "active"
                      ? PHASES[i].accent
                      : "rgba(255,255,255,0.15)",
                boxShadow:
                  status === "active"
                    ? `0 0 12px ${PHASES[i].accent}`
                    : "none",
                transition: "all 0.3s ease",
              }}
            />
            {i < PHASES.length - 1 && (
              <div
                style={{
                  width: 24,
                  height: 1.5,
                  background:
                    status === "completed"
                      ? PHASES[i].accent
                      : "rgba(255,255,255,0.08)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Phase columns */}
      {PHASES.map((phase, i) => {
        // Flash on landing (flights[0] lands at col 1, flights[1] at col 2, etc.)
        const flash = i > 0 && i <= flashes.length ? flashes[i - 1] : 0;
        return (
          <div
            key={phase.id}
            style={{
              position: "absolute",
              top: BOARD_TOP,
              left: BOARD_LEFT + i * (COL_WIDTH + COL_GAP),
              width: COL_WIDTH,
              height: 420,
              borderRadius: 14,
              background: `rgba(255,255,255,${0.015 + flash * 0.06})`,
              border: `1px solid rgba(255,255,255,${0.05 + flash * 0.15})`,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: phase.accent,
                    boxShadow: flash > 0 ? `0 0 10px ${phase.accent}` : "none",
                  }}
                />
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: 0.85,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  {phase.title}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: FONT_MONO,
                  opacity: 0.4,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                {phase.count}
              </div>
            </div>
            {Array.from({ length: phase.count }).map((_, k) => (
              <PlaceholderCard key={k} opacity={0.5 + ((k * 13) % 30) / 100} />
            ))}
          </div>
        );
      })}

      {/* Flying deal card */}
      <div
        style={{
          position: "absolute",
          left: cx - CARD_W / 2,
          top: cy - CARD_H / 2,
          width: CARD_W,
          height: CARD_H,
          borderRadius: 12,
          background: "#1E1E22",
          border: `1px solid ${currentAccent}`,
          boxShadow: `0 ${shadowBlur / 2}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha}), 0 0 20px ${currentAccent}22, 0 0 0 1px rgba(255,255,255,0.03) inset`,
          transform: `rotate(${rotZ}deg) scale(${scaleBoost * landingScale})`,
          transformOrigin: "center center",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          willChange: "transform",
        }}
      >
        {/* Card header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: BRAND.stone,
              opacity: 0.6,
            }}
          >
            {dealId}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                color: BRAND.copper,
                fontWeight: 600,
              }}
            >
              {dealValue}
            </div>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: currentAccent,
                boxShadow: `0 0 10px ${currentAccent}`,
              }}
            />
          </div>
        </div>

        {/* Deal name */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            color: BRAND.linen,
          }}
        >
          {dealLabel}
        </div>

        {/* Card footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              opacity: timerOpacity,
              color: BRAND.terracotta,
            }}
          >
            Day {timerDays} / 14
          </div>
          <div
            style={{
              fontSize: 10,
              color: BRAND.sand,
              opacity: 0.5,
            }}
          >
            {clientName}
          </div>
        </div>
      </div>

      {/* Confetti — brand colored celebration */}
      {confettiFrame > 0 &&
        Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
          const angle = pseudoRandom(i + 1) * Math.PI * 2;
          const dist = 50 + pseudoRandom(i + 99) * 200;
          const drift = pseudoRandom(i + 7) * 35 - 17;
          const sizeR = pseudoRandom(i + 3);
          const size = 5 + sizeR * 7;
          const colorPick = pseudoRandom(i + 5);
          const color =
            colorPick < 0.25
              ? BRAND.copper
              : colorPick < 0.5
                ? BRAND.terracotta
                : colorPick < 0.75
                  ? BRAND.sage
                  : BRAND.sand;
          const lifespan = 50;
          const t = Math.min(confettiFrame / lifespan, 1);
          const eased = 1 - (1 - t) * (1 - t);
          const px =
            centers[4].x + Math.cos(angle) * dist * eased + drift * t;
          const py =
            centers[4].y +
            Math.sin(angle) * dist * eased +
            t * t * 180;
          const opacity = interpolate(t, [0, 0.7, 1], [1, 1, 0]);
          const rot = pseudoRandom(i + 11) * 360 + confettiFrame * 10;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: px - size / 2,
                top: py - size / 2,
                width: size,
                height: size * 0.6,
                background: color,
                borderRadius: 2,
                opacity,
                transform: `rotate(${rot}deg)`,
                willChange: "transform",
              }}
            />
          );
        })}
    </div>
  );
}
