import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FONT_SANS, FONT_MONO } from "../../lib/fonts";
import { PREMOUNT_FRAMES } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SectionTitle } from "../../components/SectionTitle";
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";
import { TRIANGLE_INTEGRATION_CODE } from "../code-snippets";

export const Triangle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1737;
  const SEG0_END = 499;
  const SEG1_END = 1316;

  return (
    <SceneContainer sceneIndex={3} totalScenes={7}>
      {/* Title */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Triangle — The Integration Trick"
            subtitle="Building one clean waveform from another"
            color={COLORS.GREEN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: The Problem — triangle + derivative view */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* Triangle waveform */}
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 18,
                color: COLORS.GREEN,
                marginBottom: 8,
                opacity: interpolate(frame, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Triangle Wave
            </div>
            <WaveformVisualizer
              type="triangle"
              width={450}
              height={150}
              delay={10}
              color={COLORS.GREEN}
              strokeWidth={2.5}
              periods={3}
            />

            {/* Derivative (square wave) */}
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 18,
                color: COLORS.PINK,
                marginTop: 20,
                marginBottom: 8,
                opacity: interpolate(frame, [80, 100], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Its Derivative (slope)
            </div>
            <WaveformVisualizer
              type="square"
              width={450}
              height={150}
              delay={90}
              color={COLORS.PINK}
              strokeWidth={2.5}
              periods={3}
            />
          </div>

          <div style={{ maxWidth: 380, paddingTop: 30 }}>
            <NeonBox color={COLORS.PINK} delay={120} width={350}>
              <KeyPoint
                text="Looks smooth — no visible jumps"
                delay={130}
                color={COLORS.GREEN}
                icon="✓"
              />
              <KeyPoint
                text="But the slope changes direction instantly"
                delay={160}
                color={COLORS.PINK}
                icon="✗"
              />
              <KeyPoint
                text="Slope discontinuities create aliasing too"
                delay={190}
                color={COLORS.PINK}
                icon="!"
              />
            </NeonBox>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: The Solution — integration animation */}
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
            {/* Step 1: PolyBLEP square */}
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 14,
                color: COLORS.TEXT_DIM,
                marginBottom: 4,
                opacity: interpolate(frame - SEG0_END, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Step 1: Generate clean PolyBLEP square
            </div>
            <WaveformVisualizer
              type="square"
              width={420}
              height={120}
              delay={10}
              color={COLORS.CYAN}
              periods={3}
            />

            {/* Arrow */}
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 20,
                color: COLORS.TEXT_DIM,
                textAlign: "center",
                margin: "8px 0",
                opacity: interpolate(frame - SEG0_END, [60, 80], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              ↓ integrate
            </div>

            {/* Step 2: Triangle result */}
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 14,
                color: COLORS.TEXT_DIM,
                marginBottom: 4,
                opacity: interpolate(frame - SEG0_END, [80, 95], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Step 2: Get a bandlimited triangle
            </div>
            <WaveformVisualizer
              type="triangle"
              width={420}
              height={120}
              delay={90}
              color={COLORS.GREEN}
              periods={3}
            />
          </div>

          <NeonBox color={COLORS.GREEN} delay={100} width={380}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: COLORS.TEXT_PRIMARY }}>
              <div style={{ color: COLORS.GREEN, fontWeight: 600, marginBottom: 10 }}>
                Leaky Integrator
              </div>
              <div style={{ color: COLORS.AMBER, marginBottom: 8 }}>
                out = out × 0.999 + square × 4·dt
              </div>
              <KeyPoint
                text="Square is already bandlimited"
                delay={140}
                color={COLORS.CYAN}
              />
              <KeyPoint
                text="Integration preserves that property"
                delay={170}
                color={COLORS.CYAN}
              />
              <KeyPoint
                text="0.999 leak prevents DC drift"
                delay={200}
                color={COLORS.AMBER}
              />
            </div>
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
              code={TRIANGLE_INTEGRATION_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[3, 6, 7]}
              charsPerFrame={3}
            />
          </div>
          <div style={{ flex: 1, maxWidth: 400, paddingTop: 30 }}>
            <NeonBox color={COLORS.GREEN} delay={60} width={350}>
              <KeyPoint
                text="Build clean waveforms from other clean waveforms"
                delay={80}
                color={COLORS.GREEN}
                icon="★"
              />
            </NeonBox>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[3].segments} />
    </SceneContainer>
  );
};
