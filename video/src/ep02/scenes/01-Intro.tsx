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
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
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

  // Segment boundaries (from audio durations)
  const SEG0_END = 449;

  // Three deep dive previews for segment 1
  const deepDives = [
    { type: "rectangle" as const, label: "Rectangle / PWM", color: COLORS.PINK },
    { type: "triangle" as const, label: "Triangle Integration", color: COLORS.GREEN },
    { type: "saturated" as const, label: "Saturated / tanh", color: COLORS.AMBER },
  ];

  return (
    <SceneContainer sceneIndex={0} totalScenes={7} showProgressBar={false}>
      {/* Segment 0: Recap + Goal */}
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
            Episode 2 — Waveforms
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
            Expanding the Sound Palette
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
            <Badge label="7 Types" color={COLORS.CYAN} delay={60} />
            <Badge label="Shape Control" color={COLORS.PINK} delay={70} />
            <Badge label="PolyBLEP" color={COLORS.GREEN} delay={80} />
          </div>

          {/* Signal flow with Osc1 highlighted */}
          <div style={{ position: "absolute", bottom: 120, opacity: subtitleOpacity }}>
            <SignalFlowDiagram delay={100} activeBlocks={["osc1"]} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: The Approach — three deep dive previews */}
      <Sequence from={SEG0_END} durationInFrames={909 - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: "80px",
          }}
        >
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.TEXT_PRIMARY,
              marginBottom: 40,
              opacity: interpolate(frame - SEG0_END, [0, 20], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Three Deep Dives
          </div>
          <div
            style={{
              display: "flex",
              gap: 40,
              alignItems: "flex-start",
            }}
          >
            {deepDives.map((dd, i) => {
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
                  <WaveformVisualizer
                    type={dd.type}
                    width={240}
                    height={140}
                    color={dd.color}
                    delay={itemDelay + 10}
                    periods={2}
                    shapeValue={0.5}
                  />
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 14,
                      color: dd.color,
                      marginTop: 8,
                    }}
                  >
                    {dd.label}
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[0].segments} />
    </SceneContainer>
  );
};
