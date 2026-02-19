import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FONT_SANS, FONT_MONO } from "../../lib/fonts";
import { PREMOUNT_FRAMES, STAGGER_OFFSET } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SectionTitle } from "../../components/SectionTitle";
import { CodeBlock } from "../../components/CodeBlock";
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
import { SpectrumVisualizer } from "../../components/SpectrumVisualizer";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { NAIVE_SAW, POLYBLEP_CODE } from "../code-snippets";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

export const Oscillator: React.FC = () => {
  const frame = useCurrentFrame();

  // Placeholder durations — will be updated after audio generation
  const SCENE_TOTAL = 2877;
  const SEG0_END = 596;
  const SEG1_END = 1440;
  const SEG2_END = 1886;
  const SEG3_END = 2401;

  return (
    <SceneContainer sceneIndex={3}>
      {/* Title */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="The Oscillator"
            subtitle="Naive waveforms alias — PolyBLEP fixes discontinuities"
            color={COLORS.GREEN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: The aliasing problem */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
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
                text="Hard jump at the wrap point"
                delay={60}
                color={COLORS.PINK}
                icon="✗"
              />
              <KeyPoint
                text="Creates frequencies above Nyquist → aliasing"
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

      {/* Segment 1: PolyBLEP explanation */}
      <Sequence from={SEG0_END} durationInFrames={SEG1_END - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 24,
              fontWeight: 600,
              color: COLORS.GREEN,
              marginBottom: 20,
              opacity: interpolate(frame - SEG0_END, [0, 15], [0, 1], {
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
              text="Smooths the discontinuity — like sanding down a sharp corner"
              delay={60}
              color={COLORS.GREEN}
            />
            <KeyPoint
              text="Computational cost: ~2 extra multiplications per sample"
              delay={90}
              color={COLORS.GREEN}
            />
          </NeonBox>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 2: PolyBLEP code */}
      <Sequence from={SEG1_END} durationInFrames={SEG2_END - SEG1_END} premountFor={PREMOUNT_FRAMES}>
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

      {/* Segment 3: Before/After comparison with zoomed waveforms + spectrum */}
      <Sequence from={SEG2_END} durationInFrames={SEG3_END - SEG2_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "180px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          {/* Left: Naive */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.PINK,
                marginBottom: 12,
                opacity: interpolate(frame - SEG2_END, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Naive Saw (aliased)
            </div>
            <WaveformVisualizer
              type="saw-zoomed"
              width={420}
              height={160}
              delay={10}
              color={COLORS.PINK}
              strokeWidth={2.5}
              periods={1}
            />
            <div style={{ marginTop: 12 }}>
              <SpectrumVisualizer
                mode="aliased"
                width={420}
                height={140}
                delay={30}
                color={COLORS.PINK}
              />
            </div>
          </div>

          {/* Right: PolyBLEP */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.GREEN,
                marginBottom: 12,
                opacity: interpolate(frame - SEG2_END, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              PolyBLEP (clean)
            </div>
            <WaveformVisualizer
              type="saw-zoomed-polyblep"
              width={420}
              height={160}
              delay={30}
              color={COLORS.GREEN}
              strokeWidth={2.5}
              periods={1}
            />
            <div style={{ marginTop: 12 }}>
              <SpectrumVisualizer
                mode="clean"
                width={420}
                height={140}
                delay={50}
                color={COLORS.GREEN}
              />
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 4: Transition to Envelope */}
      <Sequence from={SEG3_END} durationInFrames={SCENE_TOTAL - SEG3_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 80,
          }}
        >
          <NeonBox color={COLORS.CYAN} delay={0} width={700}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 24,
                fontWeight: 600,
                color: COLORS.CYAN,
                marginBottom: 16,
              }}
            >
              What's Next?
            </div>
            <KeyPoint
              text="We have clean waveforms ✓"
              delay={20}
              color={COLORS.GREEN}
              icon="✓"
            />
            <KeyPoint
              text="But a constant tone isn't musical..."
              delay={50}
              color={COLORS.TEXT_DIM}
            />
            <KeyPoint
              text="We need to shape the sound over time → Envelopes"
              delay={80}
              color={COLORS.AMBER}
              icon="→"
            />
          </NeonBox>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[3].segments} />
    </SceneContainer>
  );
};
