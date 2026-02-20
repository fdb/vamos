import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_MONO } from "../lib/fonts";
import { SPRING_SMOOTH } from "../lib/timing";

type SpectrumMode = "aliased" | "clean" | "white-noise" | "pink-noise" | "detuned-saw";

type SpectrumVisualizerProps = {
  mode: SpectrumMode;
  width?: number;
  height?: number;
  delay?: number;
  color?: string;
  numBars?: number;
  /** Hide the Nyquist line (useful for noise spectra) */
  hideNyquist?: boolean;
  /** Color for Osc2 bars in detuned-saw mode */
  secondaryColor?: string;
};

// Deterministic pseudo-random values for aliased energy above Nyquist.
// Pre-computed so they are stable across frames.
const ALIASED_AMPLITUDES = [
  0.32, 0.18, 0.27, 0.35, 0.14, 0.29, 0.22, 0.38, 0.16, 0.31, 0.25, 0.19,
];

function generateSpectrum(
  mode: SpectrumMode,
  numBars: number
): number[] {
  // Noise spectrum modes
  if (mode === "white-noise") {
    // White noise: equal energy at all frequencies (flat spectrum)
    return Array(numBars).fill(0.6);
  }
  if (mode === "pink-noise") {
    // Pink noise: -3dB/octave rolloff (energy ∝ 1/f)
    const bars: number[] = [];
    for (let i = 0; i < numBars; i++) {
      const f = i + 1;
      bars.push(0.8 / Math.sqrt(f));
    }
    return bars;
  }

  // Detuned-saw: paired bars (Osc1 + Osc2) at each harmonic
  if (mode === "detuned-saw") {
    const numHarmonics = Math.floor(numBars / 2);
    const bars: number[] = [];
    for (let i = 0; i < numHarmonics; i++) {
      const harmonic = i + 1;
      const amp = 1 / harmonic;
      bars.push(amp);  // Osc1
      bars.push(amp * 0.9);  // Osc2 (slightly lower — visually distinct)
    }
    return bars;
  }

  const nyquistBar = Math.floor(numBars * 0.625); // ~bar 20 of 32
  const bars: number[] = [];

  for (let i = 0; i < numBars; i++) {
    if (i < nyquistBar) {
      // Harmonics with 1/n decay (sawtooth spectrum)
      const harmonic = i + 1;
      bars.push(1 / harmonic);
    } else if (mode === "aliased") {
      // Spurious aliased energy folded back above Nyquist
      const aliasIndex = (i - nyquistBar) % ALIASED_AMPLITUDES.length;
      bars.push(ALIASED_AMPLITUDES[aliasIndex]);
    } else {
      // Clean: no energy above Nyquist
      bars.push(0.01);
    }
  }

  return bars;
}

export const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({
  mode,
  width = 450,
  height = 200,
  delay = 0,
  color = COLORS.CYAN,
  numBars = 32,
  hideNyquist = false,
  secondaryColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bars = generateSpectrum(mode, numBars);
  const nyquistBar = Math.floor(numBars * 0.625);

  const padding = { top: 10, right: 15, bottom: 35, left: 15 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const gap = 2;
  const barWidth = (plotW - gap * (numBars - 1)) / numBars;

  // Nyquist line x position (between bars)
  const nyquistX =
    padding.left + nyquistBar * (barWidth + gap) - gap / 2;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
      }}
    >
      {/* Bars */}
      <div
        style={{
          position: "absolute",
          left: padding.left,
          top: padding.top,
          width: plotW,
          height: plotH,
          display: "flex",
          alignItems: "flex-end",
          gap,
        }}
      >
        {bars.map((amplitude, i) => {
          const barReveal = spring({
            frame: frame - delay - i * 1.5,
            fps,
            config: SPRING_SMOOTH,
            durationInFrames: 30,
          });

          const barHeight = amplitude * plotH * barReveal;
          const isNoiseMode = mode === "white-noise" || mode === "pink-noise";
          const isAboveNyquist = i >= nyquistBar;
          const isDetunedSecondary = mode === "detuned-saw" && i % 2 === 1 && secondaryColor;
          const barColor = isDetunedSecondary
            ? secondaryColor
            : !isNoiseMode && isAboveNyquist && mode === "aliased"
              ? COLORS.PINK
              : color;

          return (
            <div
              key={i}
              style={{
                width: barWidth,
                height: Math.max(0, barHeight),
                backgroundColor: barColor,
                borderRadius: 1,
                boxShadow: `0 0 6px ${barColor}66, 0 0 2px ${barColor}44`,
              }}
            />
          );
        })}
      </div>

      {/* Nyquist dashed line */}
      {!hideNyquist && (
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            pointerEvents: "none",
          }}
        >
          <line
            x1={nyquistX}
            y1={padding.top}
            x2={nyquistX}
            y2={padding.top + plotH}
            stroke={COLORS.TEXT_DIM}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.7}
          />
          <text
            x={nyquistX}
            y={padding.top - 2}
            fontSize={11}
            fill={COLORS.TEXT_DIM}
            textAnchor="middle"
            fontFamily={FONT_MONO}
            opacity={0.7}
          >
            Nyquist
          </text>
        </svg>
      )}

      {/* X axis label */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          left: padding.left,
          right: padding.right,
          textAlign: "center",
          fontFamily: FONT_MONO,
          fontSize: 12,
          color: COLORS.TEXT_DIM,
          opacity: 0.6,
        }}
      >
        {"Frequency \u2192"}
      </div>
    </div>
  );
};
