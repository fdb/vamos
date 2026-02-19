import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_MONO } from "../lib/fonts";
import { SPRING_SMOOTH } from "../lib/timing";

type ADSRVisualizerProps = {
  width?: number;
  height?: number;
  delay?: number;
  attackTime?: number;
  decayTime?: number;
  sustainLevel?: number;
  sustainTime?: number;
  releaseTime?: number;
  showOvershoot?: boolean;
  showLabels?: boolean;
  showDot?: boolean;
};

export const ADSRVisualizer: React.FC<ADSRVisualizerProps> = ({
  width = 700,
  height = 300,
  delay = 0,
  attackTime = 0.15,
  decayTime = 0.2,
  sustainLevel = 0.7,
  sustainTime = 0.3,
  releaseTime = 0.25,
  showOvershoot = true,
  showLabels = true,
  showDot = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const padding = { top: 30, right: 30, bottom: 50, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const totalTime = attackTime + decayTime + sustainTime + releaseTime;
  const toX = (t: number) => padding.left + (t / totalTime) * plotW;
  const toY = (v: number) => padding.top + (1 - v) * plotH;

  const overshootTarget = 1.2;

  // Phase durations for progressive drawing (in frames)
  const phaseDurations = [45, 35, 30, 35]; // A, D, S, R
  const phaseStarts = [0, 45, 80, 110];

  const reveal = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
    durationInFrames: 90,
  });

  // Generate envelope path points
  const attackEnd = attackTime;
  const decayEnd = attackTime + decayTime;
  const sustainEnd = attackTime + decayTime + sustainTime;

  // Calculate phase progress
  const adjustedFrame = Math.max(0, frame - delay);
  const attackProgress = interpolate(adjustedFrame, [phaseStarts[0], phaseStarts[0] + phaseDurations[0]], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const decayProgress = interpolate(adjustedFrame, [phaseStarts[1], phaseStarts[1] + phaseDurations[1]], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sustainProgress = interpolate(adjustedFrame, [phaseStarts[2], phaseStarts[2] + phaseDurations[2]], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const releaseProgress = interpolate(adjustedFrame, [phaseStarts[3], phaseStarts[3] + phaseDurations[3]], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Build path segments
  const segments: string[] = [];
  let dotX = toX(0);
  let dotY = toY(0);

  // Attack: 0 → 1.0 (exponential through overshoot)
  if (attackProgress > 0) {
    const points: string[] = [`M ${toX(0)} ${toY(0)}`];
    const steps = Math.floor(attackProgress * 30);
    for (let i = 1; i <= steps; i++) {
      const t = i / 30;
      const expVal = showOvershoot
        ? 1 - Math.exp(-5 * t) * (1 - overshootTarget * (1 - Math.exp(-5 * t)))
        : 1 - Math.exp(-5 * t);
      const val = Math.min(showOvershoot ? overshootTarget : 1, expVal);
      const actualVal = Math.min(1.0, val);
      points.push(`L ${toX(t * attackTime)} ${toY(actualVal)}`);
      dotX = toX(t * attackTime);
      dotY = toY(actualVal);
    }
    segments.push(points.join(" "));
  }

  // Decay: 1.0 → sustain
  if (decayProgress > 0) {
    const points: string[] = [`M ${toX(attackEnd)} ${toY(1.0)}`];
    const steps = Math.floor(decayProgress * 20);
    for (let i = 1; i <= steps; i++) {
      const t = i / 20;
      const val = sustainLevel + (1.0 - sustainLevel) * Math.exp(-4 * t);
      points.push(`L ${toX(attackEnd + t * decayTime)} ${toY(val)}`);
      dotX = toX(attackEnd + t * decayTime);
      dotY = toY(val);
    }
    segments.push(points.join(" "));
  }

  // Sustain: flat
  if (sustainProgress > 0) {
    const endX = toX(decayEnd + sustainProgress * sustainTime);
    segments.push(
      `M ${toX(decayEnd)} ${toY(sustainLevel)} L ${endX} ${toY(sustainLevel)}`
    );
    dotX = endX;
    dotY = toY(sustainLevel);
  }

  // Release: sustain → 0
  if (releaseProgress > 0) {
    const points: string[] = [`M ${toX(sustainEnd)} ${toY(sustainLevel)}`];
    const steps = Math.floor(releaseProgress * 20);
    for (let i = 1; i <= steps; i++) {
      const t = i / 20;
      const val = sustainLevel * Math.exp(-4 * t);
      points.push(`L ${toX(sustainEnd + t * releaseTime)} ${toY(val)}`);
      dotX = toX(sustainEnd + t * releaseTime);
      dotY = toY(val);
    }
    segments.push(points.join(" "));
  }

  const phaseColors = [COLORS.GREEN, COLORS.AMBER, COLORS.CYAN, COLORS.PINK];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Background grid */}
      <rect
        x={padding.left}
        y={padding.top}
        width={plotW}
        height={plotH}
        fill="none"
        stroke={COLORS.TEXT_DIM}
        strokeWidth={0.5}
        opacity={0.2}
      />

      {/* Overshoot target line */}
      {showOvershoot && (
        <>
          <line
            x1={padding.left}
            y1={toY(1.0)}
            x2={toX(attackEnd)}
            y2={toY(1.0)}
            stroke={COLORS.AMBER}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={interpolate(attackProgress, [0.5, 1], [0, 0.5], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
          <text
            x={padding.left - 5}
            y={toY(1.0) + 4}
            fontSize={11}
            fill={COLORS.AMBER}
            textAnchor="end"
            opacity={interpolate(attackProgress, [0.5, 1], [0, 0.6], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
            fontFamily={FONT_MONO}
          >
            1.2
          </text>
        </>
      )}

      {/* Sustain level line */}
      <line
        x1={padding.left}
        y1={toY(sustainLevel)}
        x2={padding.left + plotW}
        y2={toY(sustainLevel)}
        stroke={COLORS.TEXT_DIM}
        strokeWidth={0.5}
        strokeDasharray="3 6"
        opacity={0.3}
      />

      {/* noteOn / noteOff markers */}
      <line
        x1={toX(0)}
        y1={padding.top}
        x2={toX(0)}
        y2={padding.top + plotH}
        stroke={COLORS.GREEN}
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.5 * reveal}
      />
      <line
        x1={toX(sustainEnd)}
        y1={padding.top}
        x2={toX(sustainEnd)}
        y2={padding.top + plotH}
        stroke={COLORS.PINK}
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.5 * (sustainProgress > 0 ? 1 : 0)}
      />

      {/* Phase paths with different colors */}
      {segments.map((d, i) => (
        <React.Fragment key={i}>
          <path
            d={d}
            fill="none"
            stroke={phaseColors[i]}
            strokeWidth={2.5}
            style={{ filter: `drop-shadow(0 0 4px ${phaseColors[i]}66)` }}
          />
          <path d={d} fill="none" stroke={phaseColors[i]} strokeWidth={6} opacity={0.15} />
        </React.Fragment>
      ))}

      {/* Tracing dot */}
      {showDot && adjustedFrame > 0 && (
        <circle
          cx={dotX}
          cy={dotY}
          r={5}
          fill="white"
          style={{ filter: "drop-shadow(0 0 6px white)" }}
        />
      )}

      {/* Phase labels */}
      {showLabels && (
        <>
          {[
            { label: "A", x: toX(attackTime / 2), progress: attackProgress },
            { label: "D", x: toX(attackEnd + decayTime / 2), progress: decayProgress },
            { label: "S", x: toX(decayEnd + sustainTime / 2), progress: sustainProgress },
            { label: "R", x: toX(sustainEnd + releaseTime / 2), progress: releaseProgress },
          ].map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - 15}
              fontSize={16}
              fill={phaseColors[i]}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontWeight={700}
              opacity={p.progress > 0 ? 1 : 0.2}
            >
              {p.label}
            </text>
          ))}
        </>
      )}

      {/* noteOn/noteOff labels */}
      <text
        x={toX(0)}
        y={height - 2}
        fontSize={11}
        fill={COLORS.GREEN}
        textAnchor="middle"
        fontFamily={FONT_MONO}
        opacity={0.7 * reveal}
      >
        noteOn
      </text>
      {sustainProgress > 0 && (
        <text
          x={toX(sustainEnd)}
          y={height - 2}
          fontSize={11}
          fill={COLORS.PINK}
          textAnchor="middle"
          fontFamily={FONT_MONO}
          opacity={0.7}
        >
          noteOff
        </text>
      )}
    </svg>
  );
};
