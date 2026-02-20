import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FONT_MONO } from "../../lib/fonts";
import { PREMOUNT_FRAMES } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SectionTitle } from "../../components/SectionTitle";
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
import { WaveshapingVisualizer } from "../../components/WaveshapingVisualizer";
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";
import { SATURATED_CODE } from "../code-snippets";

export const Saturated: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1473;
  const SEG0_END = 748;
  const SEG1_END = 1127;

  return (
    <SceneContainer sceneIndex={4} totalScenes={7}>
      {/* Title */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Saturated — Waveshaping"
            subtitle="Pushing a saw wave through tanh for warmth and grit"
            color={COLORS.AMBER}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: The Concept — three-panel waveshaping visualizer */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 60px",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <WaveshapingVisualizer
            width={900}
            height={280}
            delay={20}
            drive={3}
            color={COLORS.CYAN}
          />
          <div style={{ display: "flex", gap: 30, marginTop: 10 }}>
            <KeyPoint
              text="tanh: S-curve that squashes extremes"
              delay={80}
              color={COLORS.AMBER}
            />
            <KeyPoint
              text="Middle stays linear, peaks get softened"
              delay={110}
              color={COLORS.AMBER}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Shape Controls Drive — morphing waveform */}
      <Sequence from={SEG0_END} durationInFrames={SEG1_END - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* Drive sweep animation */}
            {(() => {
              const driveSweep = interpolate(
                frame - SEG0_END,
                [30, SEG1_END - SEG0_END - 30],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const driveVal = 1.5 + driveSweep * 4.5;
              return (
                <>
                  <WaveformVisualizer
                    type="saturated"
                    width={500}
                    height={200}
                    delay={10}
                    color={COLORS.AMBER}
                    strokeWidth={3}
                    periods={3}
                    shapeValue={driveSweep}
                    traceMode={false}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      marginTop: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 16,
                        color: COLORS.TEXT_DIM,
                      }}
                    >
                      Drive
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        backgroundColor: `${COLORS.TEXT_DIM}22`,
                        borderRadius: 4,
                        maxWidth: 300,
                      }}
                    >
                      <div
                        style={{
                          width: `${driveSweep * 100}%`,
                          height: "100%",
                          backgroundColor: COLORS.AMBER,
                          borderRadius: 4,
                          boxShadow: `0 0 8px ${COLORS.AMBER}66`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 18,
                        fontWeight: 700,
                        color: COLORS.AMBER,
                        minWidth: 60,
                      }}
                    >
                      {driveVal.toFixed(1)}x
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <NeonBox color={COLORS.AMBER} delay={30} width={320}>
            <KeyPoint
              text="1.5x → subtle warmth"
              delay={50}
              color={COLORS.GREEN}
            />
            <KeyPoint
              text="6x → almost a square wave"
              delay={80}
              color={COLORS.PINK}
            />
            <KeyPoint
              text="More drive = more harmonics"
              delay={110}
              color={COLORS.AMBER}
            />
          </NeonBox>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 2: The Code */}
      <Sequence from={SEG1_END} durationInFrames={SCENE_TOTAL - SEG1_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, maxWidth: 600 }}>
            <CodeBlock
              code={SATURATED_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[6, 7]}
              charsPerFrame={3}
            />
          </div>
          <div style={{ flex: 1, maxWidth: 380, paddingTop: 20 }}>
            <NeonBox color={COLORS.AMBER} delay={60} width={350}>
              <KeyPoint
                text="Anti-alias first, then shape"
                delay={80}
                color={COLORS.AMBER}
                icon="★"
              />
            </NeonBox>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[4].segments} />
    </SceneContainer>
  );
};
