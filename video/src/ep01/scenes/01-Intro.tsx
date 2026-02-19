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
import { SPRING_SMOOTH, SPRING_BOUNCY, PREMOUNT_FRAMES, STAGGER_OFFSET } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { Badge } from "../../components/Badge";
import { SignalFlowDiagram } from "../../components/SignalFlowDiagram";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleScale = spring({ frame, fps, config: SPRING_SMOOTH });
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtitle entrance
  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Episode tag
  const episodeOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tocItems = [
    "Project Setup",
    "Phasor",
    "Oscillator + PolyBLEP",
    "ADSR Envelope",
    "Voice",
    "8-Voice Synth",
    "Plugin Integration",
  ];

  return (
    <SceneContainer sceneIndex={0} showProgressBar={false}>
      {/* Main title section */}
      <Sequence durationInFrames={751} premountFor={PREMOUNT_FRAMES}>
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
            Episode 1 — Foundation
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
            Building a Polyphonic Synthesizer from Scratch
          </div>

          {/* Tech badges */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 40,
              opacity: subtitleOpacity,
            }}
          >
            <Badge label="C++20" color={COLORS.CYAN} delay={60} />
            <Badge label="JUCE 8" color={COLORS.PINK} delay={70} />
            <Badge label="VST3 / AU" color={COLORS.GREEN} delay={80} />
            <Badge label="CMake" color={COLORS.AMBER} delay={90} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Signal flow preview */}
      <Sequence from={751} durationInFrames={347} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 80,
          }}
        >
          <div style={{ marginBottom: 40 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 28,
                color: COLORS.TEXT_DIM,
                textAlign: "center",
                marginBottom: 30,
                opacity: interpolate(frame - 751, [0, 20], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Signal Flow Architecture
            </div>
            <SignalFlowDiagram delay={15} showPulse />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Table of contents */}
      <Sequence from={1098} durationInFrames={270} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ width: 500 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 32,
                fontWeight: 700,
                color: COLORS.TEXT_PRIMARY,
                marginBottom: 30,
                opacity: interpolate(frame - 1098, [0, 20], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              What We're Building
            </div>
            {tocItems.map((item, i) => {
              const itemDelay = i * 12;
              const itemOpacity = interpolate(
                frame - 1098,
                [itemDelay + 15, itemDelay + 30],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const itemX = interpolate(
                frame - 1098,
                [itemDelay + 15, itemDelay + 30],
                [-20, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 14,
                    opacity: itemOpacity,
                    transform: `translateX(${itemX}px)`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 14,
                      color: COLORS.CYAN,
                      width: 24,
                      textAlign: "right",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: 22,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    {item}
                  </span>
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
