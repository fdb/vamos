import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_SANS, FONT_MONO } from "../lib/fonts";
import { SPRING_SMOOTH } from "../lib/timing";

type Route = {
  source: string;
  target: string;
  amount: number;
  color?: string;
};

type ModRoutingDiagramProps = {
  delay?: number;
  activeRoutes?: Route[];
  showDedicated?: boolean;
};

const SOURCES = [
  { id: "Env1", label: "Env 1", color: COLORS.GREEN },
  { id: "Env2Cyc", label: "Env2/Cyc", color: COLORS.GREEN },
  { id: "LFO", label: "LFO", color: COLORS.CYAN },
  { id: "Velocity", label: "Velocity", color: COLORS.AMBER },
  { id: "Modwheel", label: "Mod Wheel", color: COLORS.AMBER },
  { id: "Pressure", label: "Pressure", color: COLORS.AMBER },
  { id: "Slide", label: "Slide", color: COLORS.AMBER },
  { id: "Key", label: "Key", color: COLORS.VIOLET },
];

const TARGETS = [
  { id: "LPFrequency", label: "LP Cutoff" },
  { id: "HPFrequency", label: "HP Cutoff" },
  { id: "LPResonance", label: "Resonance" },
  { id: "Osc1Shape", label: "Osc1 Shape" },
  { id: "Osc1Gain", label: "Osc1 Gain" },
  { id: "Osc2Detune", label: "Osc2 Detune" },
  { id: "Osc2Gain", label: "Osc2 Gain" },
  { id: "NoiseGain", label: "Noise Gain" },
  { id: "LFORate", label: "LFO Rate" },
  { id: "CycEnvRate", label: "CycEnv Rate" },
  { id: "MainVolume", label: "Volume" },
];

const DEDICATED_ROUTES: Route[] = [
  { source: "Env2Cyc", target: "LPFrequency", amount: 0.8, color: COLORS.GREEN },
  { source: "Pressure", target: "LPFrequency", amount: 0.15, color: COLORS.AMBER },
  { source: "Env2Cyc", target: "PitchMod", amount: 0.0, color: COLORS.GREEN },
  { source: "LFO", target: "PitchMod", amount: 0.0, color: COLORS.CYAN },
  { source: "Velocity", target: "Osc1Shape", amount: 0.0, color: COLORS.AMBER },
];

const SVG_WIDTH = 900;
const SVG_HEIGHT = 460;
const SOURCE_X = 30;
const TARGET_X = SVG_WIDTH - 30;
const SOURCE_COL_W = 140;
const TARGET_COL_W = 130;

export const ModRoutingDiagram: React.FC<ModRoutingDiagramProps> = ({
  delay = 0,
  activeRoutes = [],
  showDedicated = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  const sourceYStart = 30;
  const sourceSpacing = 48;
  const targetYStart = 20;
  const targetSpacing = 38;

  function getSourceY(id: string): number {
    const idx = SOURCES.findIndex((s) => s.id === id);
    return sourceYStart + idx * sourceSpacing + sourceSpacing / 2;
  }

  function getTargetY(id: string): number {
    const idx = TARGETS.findIndex((t) => t.id === id);
    if (idx < 0) return SVG_HEIGHT / 2; // PitchMod or unknown
    return targetYStart + idx * targetSpacing + targetSpacing / 2;
  }

  // All routes to draw
  const allRoutes: (Route & { isDedicated: boolean; routeDelay: number })[] = [];

  if (showDedicated) {
    DEDICATED_ROUTES.forEach((r, i) => {
      allRoutes.push({ ...r, isDedicated: true, routeDelay: delay + 60 + i * 15 });
    });
  }

  activeRoutes.forEach((r, i) => {
    allRoutes.push({
      ...r,
      isDedicated: false,
      routeDelay: delay + 120 + i * 20,
    });
  });

  return (
    <div style={{ opacity: reveal }}>
      <svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
        {/* Source column */}
        {SOURCES.map((src, i) => {
          const y = sourceYStart + i * sourceSpacing;
          const itemDelay = delay + i * 5;
          const itemReveal = spring({ frame: frame - itemDelay, fps, config: SPRING_SMOOTH });

          return (
            <g key={src.id} opacity={itemReveal}>
              <rect
                x={SOURCE_X}
                y={y}
                width={SOURCE_COL_W}
                height={sourceSpacing - 8}
                rx={6}
                fill={`${src.color}12`}
                stroke={src.color}
                strokeWidth={1.5}
              />
              <text
                x={SOURCE_X + SOURCE_COL_W / 2}
                y={y + (sourceSpacing - 8) / 2 + 5}
                textAnchor="middle"
                fontSize={14}
                fontWeight={600}
                fontFamily={FONT_SANS}
                fill={src.color}
              >
                {src.label}
              </text>
            </g>
          );
        })}

        {/* Target column */}
        {TARGETS.map((tgt, i) => {
          const y = targetYStart + i * targetSpacing;
          const itemDelay = delay + 20 + i * 4;
          const itemReveal = spring({ frame: frame - itemDelay, fps, config: SPRING_SMOOTH });

          return (
            <g key={tgt.id} opacity={itemReveal}>
              <rect
                x={TARGET_X - TARGET_COL_W}
                y={y}
                width={TARGET_COL_W}
                height={targetSpacing - 6}
                rx={6}
                fill={`${COLORS.PINK}10`}
                stroke={COLORS.PINK}
                strokeWidth={1}
                strokeOpacity={0.5}
              />
              <text
                x={TARGET_X - TARGET_COL_W / 2}
                y={y + (targetSpacing - 6) / 2 + 5}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fontFamily={FONT_SANS}
                fill={COLORS.TEXT_PRIMARY}
              >
                {tgt.label}
              </text>
            </g>
          );
        })}

        {/* Column headers */}
        <text
          x={SOURCE_X + SOURCE_COL_W / 2} y={16}
          textAnchor="middle" fontSize={12} fontFamily="monospace"
          fill={COLORS.TEXT_DIM} letterSpacing="0.1em"
        >
          SOURCES
        </text>
        <text
          x={TARGET_X - TARGET_COL_W / 2} y={16}
          textAnchor="middle" fontSize={12} fontFamily="monospace"
          fill={COLORS.TEXT_DIM} letterSpacing="0.1em"
        >
          TARGETS
        </text>

        {/* Connection lines */}
        {allRoutes.map((route, i) => {
          const lineReveal = spring({
            frame: frame - route.routeDelay,
            fps,
            config: SPRING_SMOOTH,
          });

          const x1 = SOURCE_X + SOURCE_COL_W;
          const y1 = getSourceY(route.source);
          const x2 = TARGET_X - TARGET_COL_W;
          const y2 = getTargetY(route.target);

          const lineColor = route.color || COLORS.CYAN;
          const opacity = route.isDedicated ? 0.6 : 0.8;

          // Bezier control points for curved lines
          const cx1 = x1 + (x2 - x1) * 0.35;
          const cx2 = x1 + (x2 - x1) * 0.65;

          return (
            <g key={`route-${i}`} opacity={lineReveal * opacity}>
              <path
                d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={lineColor}
                strokeWidth={route.isDedicated ? 1.5 : 2}
                strokeDasharray={route.isDedicated ? "6,4" : "none"}
                style={{ filter: `drop-shadow(0 0 3px ${lineColor}44)` }}
              />
              {/* Amount label at midpoint */}
              {route.amount > 0 && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="monospace"
                  fill={lineColor}
                  opacity={0.8}
                >
                  {(route.amount * 100).toFixed(0)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
