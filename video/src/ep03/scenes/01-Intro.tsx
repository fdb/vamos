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

  // Segment boundary — aligned to narration 03-intro-1 startFrame
  const SEG0_END = 455;

  // Three sources to preview
  const sources = [
    { label: "Oscillator 2", color: COLORS.CYAN },
    { label: "Noise", color: COLORS.AMBER },
    { label: "Mixer", color: COLORS.GREEN },
  ];

  return (
    <SceneContainer sceneIndex={0} totalScenes={5} showProgressBar={false}>
      {/* Segment 0: Recap + Preview */}
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
            Episode 3 — Noise, Mixer & Osc2
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
            Completing the Sound Sources
          </div>

          {/* Badges */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 40,
              opacity: subtitleOpacity,
            }}
          >
            <Badge label="Osc 2" color={COLORS.CYAN} delay={60} />
            <Badge label="Noise" color={COLORS.AMBER} delay={70} />
            <Badge label="Mixer" color={COLORS.GREEN} delay={80} />
          </div>

          {/* Signal flow with Osc1 lit, new blocks dimmed → all light up */}
          <div style={{ position: "absolute", bottom: 120, opacity: subtitleOpacity }}>
            <SignalFlowDiagram delay={100} activeBlocks={["osc1"]} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: These are simpler but essential */}
      <Sequence from={SEG0_END} durationInFrames={900 - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Three source blocks animate in */}
          <div
            style={{
              display: "flex",
              gap: 60,
              marginBottom: 60,
            }}
          >
            {sources.map((src, i) => {
              const itemDelay = i * 15;
              const itemReveal = spring({
                frame: frame - SEG0_END - itemDelay,
                fps,
                config: SPRING_BOUNCY,
              });
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    opacity: itemReveal,
                    transform: `scale(${itemReveal})`,
                  }}
                >
                  <div
                    style={{
                      width: 160,
                      height: 80,
                      borderRadius: 12,
                      border: `2px solid ${src.color}`,
                      backgroundColor: `${src.color}15`,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      boxShadow: `0 0 20px ${src.color}33`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 20,
                        fontWeight: 600,
                        color: src.color,
                      }}
                    >
                      {src.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Signal flow with all sources lit */}
          <SignalFlowDiagram
            delay={SEG0_END + 60}
            activeBlocks={["osc1", "osc2", "noise", "mixer"]}
            showPulse
          />
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[0].segments} />
    </SceneContainer>
  );
};
