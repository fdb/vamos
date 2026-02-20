import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_MONO } from "../lib/fonts";
import { SPRING_SMOOTH } from "../lib/timing";

type WaveshapingVisualizerProps = {
  width?: number;
  height?: number;
  delay?: number;
  /** Drive amount (1.5 to 6). Controls tanh steepness. */
  drive?: number;
  color?: string;
};

function valuesToPath(
  values: number[],
  plotWidth: number,
  plotHeight: number,
  offsetX: number,
  offsetY: number,
): string {
  return values
    .map((v, i) => {
      const x = offsetX + (i / (values.length - 1)) * plotWidth;
      const y = offsetY + plotHeight / 2 - (v * plotHeight) / 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export const WaveshapingVisualizer: React.FC<WaveshapingVisualizerProps> = ({
  width = 900,
  height = 280,
  delay = 0,
  drive = 3,
  color = COLORS.CYAN,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numPoints = 200;

  const reveal = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
    durationInFrames: 60,
  });

  const padding = 20;
  const gap = 40;
  const panelWidth = (width - 2 * padding - 2 * gap) / 3;
  const panelHeight = height - 2 * padding - 30; // leave room for labels
  const labelY = height - 8;

  // Panel 1: Input saw wave (3 periods)
  const sawValues: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    const phase = ((i / numPoints) * 3) % 1;
    sawValues.push(2 * phase - 1);
  }

  // Panel 2: tanh transfer function (S-curve)
  const tanhValues: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = ((i / (numPoints - 1)) * 2 - 1); // input: -1 to 1
    tanhValues.push(Math.tanh(drive * x));
  }

  // Panel 3: Output (saw through tanh)
  const outputValues: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    const phase = ((i / numPoints) * 3) % 1;
    const saw = 2 * phase - 1;
    outputValues.push(Math.tanh(drive * saw));
  }

  const panel1X = padding;
  const panel2X = padding + panelWidth + gap;
  const panel3X = padding + 2 * (panelWidth + gap);
  const panelY = padding;

  const sawPath = valuesToPath(sawValues, panelWidth, panelHeight, panel1X, panelY);
  const tanhPath = valuesToPath(tanhValues, panelWidth, panelHeight, panel2X, panelY);
  const outputPath = valuesToPath(outputValues, panelWidth, panelHeight, panel3X, panelY);

  const totalLength = numPoints * 2;
  const visibleLength = reveal * totalLength;

  // Arrow positions (between panels)
  const arrow1X = panel1X + panelWidth + gap / 2;
  const arrow2X = panel2X + panelWidth + gap / 2;
  const arrowY = panelY + panelHeight / 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Panel backgrounds */}
      {[panel1X, panel2X, panel3X].map((px, i) => (
        <rect
          key={i}
          x={px - 4}
          y={panelY - 4}
          width={panelWidth + 8}
          height={panelHeight + 8}
          rx={4}
          fill={`${COLORS.BG_PANEL}88`}
          stroke={`${COLORS.TEXT_DIM}22`}
          strokeWidth={1}
          opacity={reveal}
        />
      ))}

      {/* Center lines */}
      {[panel1X, panel2X, panel3X].map((px, i) => (
        <line
          key={i}
          x1={px}
          y1={panelY + panelHeight / 2}
          x2={px + panelWidth}
          y2={panelY + panelHeight / 2}
          stroke={COLORS.TEXT_DIM}
          strokeWidth={0.5}
          opacity={0.2 * reveal}
        />
      ))}

      {/* Panel 2: Diagonal reference line (linear = no shaping) */}
      <line
        x1={panel2X}
        y1={panelY + panelHeight}
        x2={panel2X + panelWidth}
        y2={panelY}
        stroke={COLORS.TEXT_DIM}
        strokeWidth={0.5}
        strokeDasharray="4 4"
        opacity={0.3 * reveal}
      />

      {/* Input saw wave */}
      <path
        d={sawPath}
        fill="none"
        stroke={COLORS.PINK}
        strokeWidth={2.5}
        strokeDasharray={totalLength}
        strokeDashoffset={totalLength - visibleLength}
        style={{ filter: `drop-shadow(0 0 4px ${COLORS.PINK}66)` }}
      />

      {/* tanh transfer curve */}
      <path
        d={tanhPath}
        fill="none"
        stroke={COLORS.AMBER}
        strokeWidth={2.5}
        strokeDasharray={totalLength}
        strokeDashoffset={totalLength - visibleLength}
        style={{ filter: `drop-shadow(0 0 4px ${COLORS.AMBER}66)` }}
      />

      {/* Output shaped wave */}
      <path
        d={outputPath}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={totalLength}
        strokeDashoffset={totalLength - visibleLength}
        style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
      />

      {/* Arrows between panels */}
      {[arrow1X, arrow2X].map((ax, i) => (
        <g key={i} opacity={reveal}>
          <line
            x1={ax - 10}
            y1={arrowY}
            x2={ax + 10}
            y2={arrowY}
            stroke={COLORS.TEXT_DIM}
            strokeWidth={1.5}
          />
          <polygon
            points={`${ax + 10},${arrowY} ${ax + 4},${arrowY - 4} ${ax + 4},${arrowY + 4}`}
            fill={COLORS.TEXT_DIM}
          />
        </g>
      ))}

      {/* Labels */}
      <text
        x={panel1X + panelWidth / 2}
        y={labelY}
        fontSize={13}
        fill={COLORS.PINK}
        textAnchor="middle"
        fontFamily={FONT_MONO}
        opacity={reveal}
      >
        Input (Saw)
      </text>
      <text
        x={panel2X + panelWidth / 2}
        y={labelY}
        fontSize={13}
        fill={COLORS.AMBER}
        textAnchor="middle"
        fontFamily={FONT_MONO}
        opacity={reveal}
      >
        tanh (drive={drive.toFixed(1)}x)
      </text>
      <text
        x={panel3X + panelWidth / 2}
        y={labelY}
        fontSize={13}
        fill={color}
        textAnchor="middle"
        fontFamily={FONT_MONO}
        opacity={reveal}
      >
        Output (Saturated)
      </text>
    </svg>
  );
};
