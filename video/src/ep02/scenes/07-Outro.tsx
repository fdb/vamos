import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FONT_SANS, FONT_MONO } from "../../lib/fonts";
import { SPRING_SMOOTH, SPRING_BOUNCY } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
import { SignalFlowDiagram } from "../../components/SignalFlowDiagram";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

const WAVEFORM_RECAP = [
  { type: "saw" as const, color: COLORS.CYAN },
  { type: "sine" as const, color: COLORS.GREEN },
  { type: "triangle" as const, color: COLORS.GREEN },
  { type: "rectangle" as const, color: COLORS.PINK },
  { type: "pulse" as const, color: COLORS.VIOLET },
  { type: "sharktooth" as const, color: COLORS.CYAN },
  { type: "saturated" as const, color: COLORS.AMBER },
];

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const nextOpacity = interpolate(frame, [300, 330], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneContainer sceneIndex={6} totalScenes={7} showProgressBar={false}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* 7 waveform thumbnails in a row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 50,
            opacity: titleOpacity,
          }}
        >
          {WAVEFORM_RECAP.map((wf, i) => {
            const itemReveal = spring({
              frame: frame - i * 6,
              fps,
              config: SPRING_BOUNCY,
            });
            return (
              <div
                key={i}
                style={{
                  opacity: itemReveal,
                  transform: `scale(${itemReveal})`,
                }}
              >
                <WaveformVisualizer
                  type={wf.type}
                  width={100}
                  height={60}
                  color={wf.color}
                  delay={i * 6}
                  periods={2}
                  strokeWidth={1.5}
                  shapeValue={0.5}
                />
              </div>
            );
          })}
        </div>

        {/* Recap items */}
        {[
          "7 waveforms, each anti-aliased",
          "Shape control for tonal range",
          "PolyBLEP + integration + waveshaping",
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
              opacity: interpolate(frame, [i * 10 + 60, i * 10 + 80], [0, 1], {
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

        {/* Next episode teaser */}
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.CYAN,
            opacity: nextOpacity,
            transform: `scale(${spring({ frame: frame - 300, fps, config: SPRING_SMOOTH })})`,
            textShadow: `0 0 20px ${COLORS.CYAN}66`,
            marginTop: 40,
          }}
        >
          Next: Episode 3 — Noise, Mixer & Osc2
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
          Second oscillator · White & pink noise · Three-source mixer
        </div>

        {/* Signal flow teaser */}
        <div
          style={{
            marginTop: 30,
            opacity: nextOpacity,
          }}
        >
          <SignalFlowDiagram
            delay={320}
            activeBlocks={["osc2", "noise", "mixer"]}
            showPulse
          />
        </div>
      </AbsoluteFill>
      <SceneNarration segments={NARRATION[6].segments} />
    </SceneContainer>
  );
};
