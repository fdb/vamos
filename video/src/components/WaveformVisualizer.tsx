import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS } from "../lib/colors";
import { SPRING_SMOOTH } from "../lib/timing";

type WaveformType = "saw" | "sine" | "triangle" | "square" | "phasor";

type WaveformVisualizerProps = {
  type: WaveformType;
  width?: number;
  height?: number;
  delay?: number;
  traceMode?: boolean;
  color?: string;
  strokeWidth?: number;
  periods?: number;
  overlay?: { type: WaveformType; color: string };
};

function generateWaveform(
  type: WaveformType,
  numPoints: number,
  periods: number
): number[] {
  const values: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * periods;
    const phase = t % 1;

    switch (type) {
      case "saw":
        values.push(2 * phase - 1);
        break;
      case "sine":
        values.push(Math.sin(2 * Math.PI * t));
        break;
      case "triangle":
        values.push(phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase);
        break;
      case "square":
        values.push(phase < 0.5 ? 1 : -1);
        break;
      case "phasor":
        values.push(phase);
        break;
    }
  }
  return values;
}

function valuesToPath(
  values: number[],
  width: number,
  height: number,
  yOffset: number = 0
): string {
  const padding = 20;
  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;
  const midY = height / 2 + yOffset;

  return values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * plotWidth;
      const y = midY - (v * plotHeight) / 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  type,
  width = 600,
  height = 250,
  delay = 0,
  traceMode = true,
  color = COLORS.CYAN,
  strokeWidth = 2.5,
  periods = 3,
  overlay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numPoints = 400;

  const reveal = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
    durationInFrames: 60,
  });

  const values = generateWaveform(type, numPoints, periods);
  const path = valuesToPath(values, width, height);

  // Calculate path length for trace animation
  const totalLength = numPoints * 2;
  const visibleLength = traceMode ? reveal * totalLength : totalLength;

  const overlayValues = overlay
    ? generateWaveform(overlay.type, numPoints, periods)
    : null;
  const overlayPath = overlayValues
    ? valuesToPath(overlayValues, width, height)
    : null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid lines */}
      <line
        x1={20}
        y1={height / 2}
        x2={width - 20}
        y2={height / 2}
        stroke={COLORS.TEXT_DIM}
        strokeWidth={0.5}
        opacity={0.3}
      />
      <line
        x1={20}
        y1={20}
        x2={20}
        y2={height - 20}
        stroke={COLORS.TEXT_DIM}
        strokeWidth={0.5}
        opacity={0.3}
      />

      {/* Axis labels */}
      <text x={8} y={height / 2 + 4} fontSize={10} fill={COLORS.TEXT_DIM} opacity={0.5}>
        0
      </text>
      <text x={8} y={25} fontSize={10} fill={COLORS.TEXT_DIM} opacity={0.5}>
        1
      </text>
      <text x={2} y={height - 18} fontSize={10} fill={COLORS.TEXT_DIM} opacity={0.5}>
        -1
      </text>

      {/* Overlay waveform */}
      {overlayPath && overlay && (
        <path
          d={overlayPath}
          fill="none"
          stroke={overlay.color}
          strokeWidth={strokeWidth}
          opacity={0.4}
          strokeDasharray={totalLength}
          strokeDashoffset={totalLength - visibleLength}
        />
      )}

      {/* Main waveform */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={totalLength}
        strokeDashoffset={totalLength - visibleLength}
        style={{
          filter: `drop-shadow(0 0 6px ${color}66)`,
        }}
      />

      {/* Glow effect */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 4}
        opacity={0.15}
        strokeDasharray={totalLength}
        strokeDashoffset={totalLength - visibleLength}
      />
    </svg>
  );
};
