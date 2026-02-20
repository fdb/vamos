import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS } from "../lib/colors";
import { SPRING_SMOOTH } from "../lib/timing";

type WaveformType =
  | "saw" | "saw-polyblep" | "saw-zoomed" | "saw-zoomed-polyblep"
  | "sine" | "triangle" | "square" | "phasor"
  | "rectangle" | "pulse" | "sharktooth" | "saturated";

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
  /** Shape parameter (0-1) for waveform morphing. Controls pulse width, drive, etc. */
  shapeValue?: number;
  /** Optional label displayed below the waveform */
  label?: string;
};

function generateWaveform(
  type: WaveformType,
  numPoints: number,
  periods: number,
  shapeValue: number = 0
): number[] {
  const values: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * periods;
    const phase = t % 1;

    switch (type) {
      case "saw":
        values.push(2 * phase - 1);
        break;
      case "saw-polyblep": {
        // Apply PolyBLEP anti-aliasing correction
        const dt = 1 / (numPoints / periods); // normalized increment
        const naive = 2 * phase - 1;
        // PolyBLEP correction near discontinuity
        let blep = 0;
        if (phase < dt) {
          const t = phase / dt;
          blep = t + t - t * t - 1;
        } else if (phase > 1 - dt) {
          const t = (phase - 1) / dt;
          blep = t * t + t + t + 1;
        }
        values.push(naive - blep);
        break;
      }
      case "saw-zoomed": {
        // Zoomed view near the wrap point discontinuity
        // Map i to a narrow phase range around the wrap (0.85 to 1.15 of one period)
        const zoomPhase = 0.85 + (i / numPoints) * 0.3;
        const wrappedPhase = zoomPhase >= 1 ? zoomPhase - 1 : zoomPhase;
        values.push(2 * wrappedPhase - 1);
        break;
      }
      case "saw-zoomed-polyblep": {
        const dt = 0.02; // simulate reasonable increment
        const zoomPhase = 0.85 + (i / numPoints) * 0.3;
        const wrappedPhase = zoomPhase >= 1 ? zoomPhase - 1 : zoomPhase;
        const naive = 2 * wrappedPhase - 1;
        let blep = 0;
        if (wrappedPhase < dt) {
          const t = wrappedPhase / dt;
          blep = t + t - t * t - 1;
        } else if (wrappedPhase > 1 - dt) {
          const t = (wrappedPhase - 1) / dt;
          blep = t * t + t + t + 1;
        }
        values.push(naive - blep);
        break;
      }
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
      case "rectangle": {
        // PWM square: shape controls pulse width from 50% to 99%
        const pw = 0.5 + shapeValue * 0.49;
        values.push(phase < pw ? 1 : -1);
        break;
      }
      case "pulse": {
        // Narrow pulse: shape controls width from 5% to 45%
        const pw = 0.05 + shapeValue * 0.40;
        values.push(phase < pw ? 1 : -1);
        break;
      }
      case "sharktooth": {
        // Asymmetric triangle: shape moves the peak position
        const midpoint = 0.1 + shapeValue * 0.8;
        if (phase < midpoint) {
          values.push(2 * phase / midpoint - 1);
        } else {
          values.push(1 - 2 * (phase - midpoint) / (1 - midpoint));
        }
        break;
      }
      case "saturated": {
        // tanh waveshaping on saw: shape controls drive (1.5x to 6x)
        const saw = 2 * phase - 1;
        const drive = 1.5 + shapeValue * 4.5;
        values.push(Math.tanh(drive * saw));
        break;
      }
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
  shapeValue = 0,
  label,
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

  const values = generateWaveform(type, numPoints, periods, shapeValue);
  const path = valuesToPath(values, width, height);

  // Calculate path length for trace animation
  const totalLength = numPoints * 2;
  const visibleLength = traceMode ? reveal * totalLength : totalLength;

  const overlayValues = overlay
    ? generateWaveform(overlay.type, numPoints, periods, shapeValue)
    : null;
  const overlayPath = overlayValues
    ? valuesToPath(overlayValues, width, height)
    : null;

  const svgHeight = label ? height + 28 : height;

  return (
    <svg width={width} height={svgHeight} viewBox={`0 0 ${width} ${svgHeight}`}>
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

      {/* Optional label */}
      {label && (
        <text
          x={width / 2}
          y={height + 20}
          fontSize={14}
          fill={color}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          opacity={reveal}
        >
          {label}
        </text>
      )}
    </svg>
  );
};
