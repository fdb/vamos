import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_SANS, FONT_MONO } from "../lib/fonts";
import { SPRING_BOUNCY, STAGGER_OFFSET } from "../lib/timing";

type BlockDef = {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type SignalFlowDiagramProps = {
  delay?: number;
  activeBlocks?: string[];
  showPulse?: boolean;
};

const BLOCKS: BlockDef[] = [
  { id: "osc1", label: "Osc 1", color: COLORS.CYAN, x: 60, y: 60, width: 120, height: 60 },
  { id: "osc2", label: "Osc 2", color: COLORS.CYAN, x: 60, y: 160, width: 120, height: 60 },
  { id: "noise", label: "Noise", color: COLORS.TEXT_DIM, x: 60, y: 260, width: 120, height: 60 },
  { id: "mixer", label: "Mixer", color: COLORS.AMBER, x: 280, y: 140, width: 120, height: 80 },
  { id: "filter", label: "Filter", color: COLORS.PINK, x: 500, y: 140, width: 120, height: 80 },
  { id: "amp", label: "Amp Env", color: COLORS.GREEN, x: 720, y: 140, width: 120, height: 80 },
  { id: "output", label: "Output", color: COLORS.CYAN, x: 940, y: 140, width: 120, height: 80 },
];

const CONNECTIONS: [string, string][] = [
  ["osc1", "mixer"],
  ["osc2", "mixer"],
  ["noise", "mixer"],
  ["mixer", "filter"],
  ["filter", "amp"],
  ["amp", "output"],
];

function getBlockCenter(block: BlockDef): { x: number; y: number } {
  return { x: block.x + block.width / 2, y: block.y + block.height / 2 };
}

export const SignalFlowDiagram: React.FC<SignalFlowDiagramProps> = ({
  delay = 0,
  activeBlocks,
  showPulse = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const blockMap = new Map(BLOCKS.map((b) => [b.id, b]));

  return (
    <svg width={1120} height={380} viewBox="0 0 1120 380">
      {/* Connection arrows */}
      {CONNECTIONS.map(([fromId, toId], i) => {
        const from = blockMap.get(fromId)!;
        const to = blockMap.get(toId)!;
        const fromCenter = getBlockCenter(from);
        const toCenter = getBlockCenter(to);

        const arrowOpacity = interpolate(
          adjustedFrame,
          [i * 12, i * 12 + 20],
          [0, 0.6],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        // Arrow from right edge of source to left edge of target
        const x1 = from.x + from.width;
        const y1 = fromCenter.y;
        const x2 = to.x;
        const y2 = toCenter.y;

        return (
          <g key={`${fromId}-${toId}`} opacity={arrowOpacity}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={COLORS.TEXT_DIM}
              strokeWidth={1.5}
            />
            {/* Arrowhead */}
            <polygon
              points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
              fill={COLORS.TEXT_DIM}
            />

            {/* Animated pulse dot */}
            {showPulse && (
              <circle
                cx={interpolate(
                  (adjustedFrame * 2 + i * 20) % 60,
                  [0, 60],
                  [x1, x2]
                )}
                cy={interpolate(
                  (adjustedFrame * 2 + i * 20) % 60,
                  [0, 60],
                  [y1, y2]
                )}
                r={3}
                fill={from.color || COLORS.CYAN}
                opacity={0.8}
                style={{
                  filter: `drop-shadow(0 0 4px ${from.color || COLORS.CYAN})`,
                }}
              />
            )}
          </g>
        );
      })}

      {/* Blocks */}
      {BLOCKS.map((block, i) => {
        const blockDelay = delay + i * 8;
        const scale = spring({
          frame: frame - blockDelay,
          fps,
          config: SPRING_BOUNCY,
        });

        const isActive =
          !activeBlocks || activeBlocks.includes(block.id);
        const opacity = isActive ? 1 : 0.2;

        return (
          <g
            key={block.id}
            transform={`translate(${block.x + block.width / 2}, ${block.y + block.height / 2}) scale(${scale}) translate(${-(block.x + block.width / 2)}, ${-(block.y + block.height / 2)})`}
            opacity={opacity}
          >
            {/* Glow */}
            <rect
              x={block.x - 2}
              y={block.y - 2}
              width={block.width + 4}
              height={block.height + 4}
              rx={10}
              fill="none"
              stroke={block.color}
              strokeWidth={1}
              opacity={0.3}
              style={{
                filter: `drop-shadow(0 0 8px ${block.color}44)`,
              }}
            />

            {/* Block background */}
            <rect
              x={block.x}
              y={block.y}
              width={block.width}
              height={block.height}
              rx={8}
              fill={`${block.color}15`}
              stroke={block.color}
              strokeWidth={1.5}
            />

            {/* Label */}
            <text
              x={block.x + block.width / 2}
              y={block.y + block.height / 2 + 5}
              textAnchor="middle"
              fontSize={16}
              fontWeight={600}
              fontFamily={FONT_SANS}
              fill={block.color}
            >
              {block.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
