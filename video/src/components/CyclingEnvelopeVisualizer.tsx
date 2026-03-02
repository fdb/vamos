import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_MONO } from "../lib/fonts";
import { SPRING_SMOOTH } from "../lib/timing";

type CyclingEnvelopeVisualizerProps = {
  midPoint?: number;
  hold?: number;
  width?: number;
  height?: number;
  delay?: number;
  color?: string;
  /** If true, midPoint animates from 0 → 0.5 → 1.0 over time */
  animate?: boolean;
};

function computeEnvelope(
  phase: number,
  midPoint: number,
  hold: number,
): number {
  const riseEnd = Math.max(0.001, Math.min(0.999, midPoint));
  const holdFrac = Math.max(0, Math.min(hold, 1 - riseEnd - 0.001));
  const fallStart = riseEnd + holdFrac;

  if (phase < riseEnd) {
    return phase / riseEnd;
  } else if (phase < fallStart) {
    return 1.0;
  } else {
    const fallDuration = 1.0 - fallStart;
    if (fallDuration < 0.001) return 0.0;
    return 1.0 - (phase - fallStart) / fallDuration;
  }
}

export const CyclingEnvelopeVisualizer: React.FC<CyclingEnvelopeVisualizerProps> = ({
  midPoint = 0.5,
  hold = 0.05,
  width = 600,
  height = 280,
  delay = 0,
  color = COLORS.CYAN,
  animate = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  // Animated midPoint: sweeps 0 → 0.5 → 1.0 over ~6 seconds (180 frames)
  const animatedMidPoint = animate
    ? interpolate(frame - delay, [30, 90, 120, 180], [0.05, 0.5, 0.5, 0.95], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : midPoint;

  const padL = 60;
  const padR = 20;
  const padT = 30;
  const padB = 50;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // Generate envelope path
  const points: string[] = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const phase = i / steps;
    const value = computeEnvelope(phase, animatedMidPoint, hold);
    const x = padL + phase * plotW;
    const y = padT + (1 - value) * plotH;
    points.push(`${x},${y}`);
  }

  // Phase markers
  const riseEnd = Math.max(0.001, Math.min(0.999, animatedMidPoint));
  const holdFrac = Math.max(0, Math.min(hold, 1 - riseEnd - 0.001));
  const fallStart = riseEnd + holdFrac;

  const riseX = padL + riseEnd * plotW;
  const fallX = padL + fallStart * plotW;

  return (
    <div style={{ opacity: reveal }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        <line
          x1={padL} y1={padT} x2={padL} y2={padT + plotH}
          stroke={COLORS.TEXT_DIM} strokeOpacity={0.2}
        />
        <line
          x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH}
          stroke={COLORS.TEXT_DIM} strokeOpacity={0.2}
        />
        {/* 1.0 line */}
        <line
          x1={padL} y1={padT} x2={padL + plotW} y2={padT}
          stroke={COLORS.TEXT_DIM} strokeOpacity={0.1} strokeDasharray="4,4"
        />

        {/* Phase region labels */}
        {/* Rise region */}
        <rect
          x={padL} y={padT} width={riseX - padL} height={plotH}
          fill={COLORS.CYAN} fillOpacity={0.04}
        />
        {/* Hold region */}
        {holdFrac > 0.01 && (
          <rect
            x={riseX} y={padT} width={fallX - riseX} height={plotH}
            fill={COLORS.GREEN} fillOpacity={0.04}
          />
        )}
        {/* Fall region */}
        <rect
          x={fallX} y={padT} width={padL + plotW - fallX} height={plotH}
          fill={COLORS.PINK} fillOpacity={0.04}
        />

        {/* Phase divider lines */}
        <line
          x1={riseX} y1={padT} x2={riseX} y2={padT + plotH}
          stroke={COLORS.TEXT_DIM} strokeOpacity={0.3} strokeDasharray="3,3"
        />
        {holdFrac > 0.01 && (
          <line
            x1={fallX} y1={padT} x2={fallX} y2={padT + plotH}
            stroke={COLORS.TEXT_DIM} strokeOpacity={0.3} strokeDasharray="3,3"
          />
        )}

        {/* Envelope curve */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />

        {/* Axis labels */}
        <text x={padL - 8} y={padT + 5} textAnchor="end" fill={COLORS.TEXT_DIM} fontSize={12} fontFamily="monospace">1</text>
        <text x={padL - 8} y={padT + plotH + 4} textAnchor="end" fill={COLORS.TEXT_DIM} fontSize={12} fontFamily="monospace">0</text>

        {/* Phase labels */}
        <text
          x={(padL + riseX) / 2} y={padT + plotH + 20}
          textAnchor="middle" fill={COLORS.CYAN} fontSize={13} fontFamily="monospace"
        >
          Rise
        </text>
        {holdFrac > 0.01 && (
          <text
            x={(riseX + fallX) / 2} y={padT + plotH + 20}
            textAnchor="middle" fill={COLORS.GREEN} fontSize={13} fontFamily="monospace"
          >
            Hold
          </text>
        )}
        <text
          x={(fallX + padL + plotW) / 2} y={padT + plotH + 20}
          textAnchor="middle" fill={COLORS.PINK} fontSize={13} fontFamily="monospace"
        >
          Fall
        </text>

        {/* MidPoint label */}
        <text
          x={width / 2} y={padT + plotH + 42}
          textAnchor="middle" fill={COLORS.TEXT_DIM} fontSize={14} fontFamily="monospace"
        >
          MidPoint = {animatedMidPoint.toFixed(2)}
        </text>
      </svg>
    </div>
  );
};
