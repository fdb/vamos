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
import { SPRING_SMOOTH, SPRING_BOUNCY, PREMOUNT_FRAMES } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { Badge } from "../../components/Badge";
import { SignalFlowDiagram } from "../../components/SignalFlowDiagram";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

const FILTER_TYPES = [
  { label: "Sallen-Key I", color: COLORS.CYAN },
  { label: "Sallen-Key II", color: COLORS.CYAN },
  { label: "SVF Low-Pass", color: COLORS.GREEN },
  { label: "SVF High-Pass", color: COLORS.GREEN },
  { label: "Comb", color: COLORS.AMBER },
  { label: "Vowel", color: COLORS.PINK },
  { label: "DJ", color: COLORS.VIOLET },
  { label: "Resampling", color: COLORS.AMBER },
];

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: SPRING_SMOOTH });
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const episodeOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const SEG0_END = 532;

  return (
    <SceneContainer sceneIndex={0} totalScenes={5} showProgressBar={false}>
      {/* Segment 0: Title + Signal Flow */}
      <Sequence durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Episode badge */}
          <div
            style={{
              position: "absolute",
              top: 180,
              opacity: episodeOpacity,
              fontFamily: FONT_MONO,
              fontSize: 18,
              color: COLORS.TEXT_DIM,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Episode 4 — The Filter
          </div>

          {/* VAMOS title */}
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 140,
              fontWeight: 800,
              color: COLORS.CYAN,
              letterSpacing: "-0.02em",
              transform: `scale(${titleScale})`,
              opacity: titleOpacity,
              textShadow: `0 0 40px ${COLORS.CYAN}66, 0 0 80px ${COLORS.CYAN}33`,
            }}
          >
            VAMOS
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 28,
              color: COLORS.TEXT_PRIMARY,
              opacity: subtitleOpacity,
              marginTop: -10,
            }}
          >
            Sculpting Sound with Filters
          </div>

          {/* Signal flow — filter lights up as narrator mentions it */}
          <div style={{ position: "absolute", bottom: 120, opacity: subtitleOpacity }}>
            <SignalFlowDiagram
              delay={100}
              activeBlocks={[
                "osc1",
                "osc2",
                "noise",
                "mixer",
                ...(frame >= 180 ? ["filter"] : []),
              ]}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Eight filter types */}
      <Sequence from={SEG0_END} durationInFrames={870 - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Filter type grid */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 16,
              maxWidth: 900,
              marginBottom: 60,
            }}
          >
            {FILTER_TYPES.map((ft, i) => {
              const itemDelay = 20 + i * 8;
              const itemReveal = spring({
                frame: frame - itemDelay,
                fps,
                config: SPRING_BOUNCY,
              });
              return (
                <div
                  key={i}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 8,
                    border: `2px solid ${ft.color}`,
                    backgroundColor: `${ft.color}12`,
                    opacity: itemReveal,
                    transform: `scale(${itemReveal})`,
                    boxShadow: `0 0 15px ${ft.color}22`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: 18,
                      fontWeight: 600,
                      color: ft.color,
                    }}
                  >
                    {ft.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Signal flow with filter active */}
          <SignalFlowDiagram
            delay={100}
            activeBlocks={["osc1", "osc2", "noise", "mixer", "filter"]}
            showPulse
          />
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[0].segments} />
    </SceneContainer>
  );
};
