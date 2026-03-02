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

const MOD_TOOLS = [
  { label: "LFO", color: COLORS.CYAN },
  { label: "Cycling Envelope", color: COLORS.GREEN },
  { label: "Mod Matrix", color: COLORS.PINK },
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

  const SEG0_END = 482; // intro-1 starts here

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
            Episode 5 — Modulators
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
            Bringing Sound to Life with Movement
          </div>

          {/* Signal flow with all blocks active */}
          <div style={{ position: "absolute", bottom: 120, opacity: subtitleOpacity }}>
            <SignalFlowDiagram
              delay={100}
              activeBlocks={[
                "osc1",
                "osc2",
                "noise",
                "mixer",
                "filter",
                "amp",
                "output",
              ]}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Three modulation tools */}
      <Sequence from={SEG0_END} durationInFrames={839 - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Badge grid */}
          <div
            style={{
              display: "flex",
              gap: 24,
              marginBottom: 80,
            }}
          >
            {MOD_TOOLS.map((tool, i) => (
              <Badge
                key={i}
                label={tool.label}
                color={tool.color}
                delay={20 + i * 15}
              />
            ))}
          </div>

          {/* Signal flow with animated mod connections hint */}
          <SignalFlowDiagram
            delay={60}
            activeBlocks={["osc1", "osc2", "noise", "mixer", "filter", "amp", "output"]}
            showPulse
          />
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[0].segments} />
    </SceneContainer>
  );
};
