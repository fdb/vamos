import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_SANS, FONT_MONO } from "../lib/fonts";
import { PREMOUNT_FRAMES, STAGGER_OFFSET } from "../lib/timing";
import { SceneContainer } from "../components/SceneContainer";
import { SectionTitle } from "../components/SectionTitle";
import { CodeBlock } from "../components/CodeBlock";
import { WaveformVisualizer } from "../components/WaveformVisualizer";
import { KeyPoint } from "../components/KeyPoint";
import { NeonBox } from "../components/NeonBox";
import { NAIVE_SAW, POLYBLEP_CODE } from "../lib/code-snippets";
import { SceneNarration } from "../components/SceneNarration";
import { NARRATION } from "../lib/narration";

export const Oscillator: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneContainer sceneIndex={3}>
      {/* Title */}
      <Sequence durationInFrames={1815} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="The Oscillator"
            subtitle="Naive waveforms alias — PolyBLEP fixes discontinuities"
            color={COLORS.GREEN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Naive saw - the problem */}
      <Sequence from={0} durationInFrames={500} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "210px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 24,
                fontWeight: 600,
                color: COLORS.PINK,
                marginBottom: 16,
                opacity: interpolate(frame, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              The Problem: Naive Saw
            </div>
            <WaveformVisualizer
              type="saw"
              width={500}
              height={220}
              delay={10}
              color={COLORS.PINK}
              strokeWidth={3}
              periods={3}
            />
            <div style={{ marginTop: 16 }}>
              <KeyPoint
                text="Hard discontinuity at wrap point"
                delay={60}
                color={COLORS.PINK}
                icon="✗"
              />
              <KeyPoint
                text="Creates infinite harmonics → aliasing"
                delay={90}
                color={COLORS.PINK}
                icon="✗"
              />
            </div>
          </div>
          <div style={{ flex: 1, maxWidth: 480 }}>
            <CodeBlock code={NAIVE_SAW} delay={30} mode="typewriter" fontSize={18} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* PolyBLEP explanation */}
      <Sequence from={500} durationInFrames={549} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 24,
              fontWeight: 600,
              color: COLORS.GREEN,
              marginBottom: 20,
              opacity: interpolate(frame - 500, [0, 15], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            The Fix: PolyBLEP Anti-Aliasing
          </div>
          <NeonBox color={COLORS.GREEN} delay={15} width={800}>
            <KeyPoint
              text="Polynomial Band-Limited Step function"
              delay={30}
              color={COLORS.GREEN}
            />
            <KeyPoint
              text="Smooths the discontinuity with a polynomial residual"
              delay={60}
              color={COLORS.GREEN}
            />
            <KeyPoint
              text="Only costs ~2 extra operations per sample"
              delay={90}
              color={COLORS.GREEN}
            />
          </NeonBox>
        </AbsoluteFill>
      </Sequence>

      {/* PolyBLEP code */}
      <Sequence from={1049} durationInFrames={458} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div style={{ maxWidth: 700 }}>
            <CodeBlock
              code={POLYBLEP_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[2, 3, 6, 7, 12, 13]}
              charsPerFrame={3}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Before/After comparison */}
      <Sequence from={1507} durationInFrames={308} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "210px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.PINK,
                marginBottom: 12,
                opacity: interpolate(frame - 1507, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Before: Naive (aliases)
            </div>
            <WaveformVisualizer
              type="saw"
              width={450}
              height={200}
              delay={10}
              color={COLORS.PINK}
              strokeWidth={2}
              periods={4}
            />
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.GREEN,
                marginBottom: 12,
                opacity: interpolate(frame - 1507, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              After: PolyBLEP (clean)
            </div>
            <WaveformVisualizer
              type="saw"
              width={450}
              height={200}
              delay={30}
              color={COLORS.GREEN}
              strokeWidth={2}
              periods={4}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
      <SceneNarration segments={NARRATION[3].segments} />
    </SceneContainer>
  );
};
