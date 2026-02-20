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
import { SignalFlowDiagram } from "../../components/SignalFlowDiagram";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

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

  // Recap items
  const recapItems = [
    "Oscillator 2 with transpose & detune",
    "White & pink noise generators",
    "Three-source mixer",
  ];

  return (
    <SceneContainer sceneIndex={4} totalScenes={5} showProgressBar={false}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Signal flow — all sources lit */}
        <div style={{ marginBottom: 40, opacity: titleOpacity }}>
          <SignalFlowDiagram
            delay={10}
            activeBlocks={["osc1", "osc2", "noise", "mixer"]}
            showPulse
          />
        </div>

        {/* Recap checkmarks */}
        {recapItems.map((item, i) => (
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
            color: COLORS.PINK,
            opacity: nextOpacity,
            transform: `scale(${spring({ frame: frame - 300, fps, config: SPRING_SMOOTH })})`,
            textShadow: `0 0 20px ${COLORS.PINK}66`,
            marginTop: 40,
          }}
        >
          Next: Episode 4 — The Filter
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
          Sallen-Key MS-20 · SVF · Vowel · Comb · 8 filter types
        </div>

        {/* Signal flow teaser — filter pulsing */}
        <div
          style={{
            marginTop: 30,
            opacity: nextOpacity,
          }}
        >
          <SignalFlowDiagram
            delay={320}
            activeBlocks={["filter"]}
            showPulse
          />
        </div>
      </AbsoluteFill>
      <SceneNarration segments={NARRATION[4].segments} />
    </SceneContainer>
  );
};
