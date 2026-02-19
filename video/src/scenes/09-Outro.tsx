import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_SANS, FONT_MONO } from "../lib/fonts";
import { SPRING_SMOOTH } from "../lib/timing";
import { SceneContainer } from "../components/SceneContainer";
import { SceneNarration } from "../components/SceneNarration";
import { NARRATION } from "../lib/narration";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: SPRING_SMOOTH });

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const nextOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const items = [
    "Phasor",
    "Oscillator + PolyBLEP",
    "ADSR Envelope",
    "Voice → Synth",
    "Plugin integration",
  ];

  return (
    <SceneContainer sceneIndex={8} showProgressBar={false}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Recap checkmarks */}
        <div style={{ marginBottom: 40 }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
                opacity: interpolate(frame, [i * 8, i * 8 + 12], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <span style={{ color: COLORS.GREEN, fontSize: 18 }}>✓</span>
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 20,
                  color: COLORS.TEXT_PRIMARY,
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Next episode teaser */}
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.CYAN,
            opacity: nextOpacity,
            transform: `scale(${spring({ frame: frame - 60, fps, config: SPRING_SMOOTH })})`,
            textShadow: `0 0 20px ${COLORS.CYAN}66`,
          }}
        >
          Next: Phase 2 — Sound Sources
        </div>

        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 16,
            color: COLORS.TEXT_DIM,
            marginTop: 16,
            opacity: nextOpacity,
          }}
        >
          7 waveforms · PolyBLEP · Noise generator
        </div>
      </AbsoluteFill>
      <SceneNarration segments={NARRATION[8].segments} />
    </SceneContainer>
  );
};
