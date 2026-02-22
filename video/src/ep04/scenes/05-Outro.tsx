import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FONT_SANS, FONT_MONO } from "../../lib/fonts";
import { SPRING_SMOOTH, PREMOUNT_FRAMES } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SignalFlowDiagram } from "../../components/SignalFlowDiagram";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 620;

  const recapItems = [
    "Eight filter types — Sallen-Key, SVF, Comb, Vowel, DJ, Resampling",
    "Tanh saturation for the MS-20's screaming character",
    "Per-source routing and keyboard tracking",
  ];

  return (
    <SceneContainer sceneIndex={4} totalScenes={5}>
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Signal flow with filter active */}
          <SignalFlowDiagram
            delay={0}
            activeBlocks={["osc1", "osc2", "noise", "mixer", "filter", "amp", "output"]}
            showPulse
          />

          {/* Recap checkmarks */}
          <div style={{ marginTop: 50, maxWidth: 700 }}>
            {recapItems.map((item, i) => {
              const itemDelay = 30 + i * 30;
              const reveal = spring({
                frame: frame - itemDelay,
                fps,
                config: SPRING_SMOOTH,
              });
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 14,
                    opacity: reveal,
                    transform: `translateX(${(1 - reveal) * 20}px)`,
                  }}
                >
                  <span style={{ color: COLORS.GREEN, fontSize: 18 }}>
                    {"\u2713"}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: 18,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Next episode teaser */}
          <div
            style={{
              position: "absolute",
              bottom: 120,
              opacity: interpolate(frame, [200, 240], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 14,
                color: COLORS.TEXT_DIM,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Next
            </div>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 28,
                fontWeight: 700,
                color: COLORS.CYAN,
                textAlign: "center",
                textShadow: `0 0 20px ${COLORS.CYAN}44`,
              }}
            >
              Episode 5 — Modulators
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[4].segments} />
    </SceneContainer>
  );
};
