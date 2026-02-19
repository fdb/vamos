import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FONT_SANS, FONT_MONO } from "../../lib/fonts";
import { PREMOUNT_FRAMES } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SectionTitle } from "../../components/SectionTitle";
import { CodeBlock } from "../../components/CodeBlock";
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { PHASOR_CODE } from "../code-snippets";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

export const Phasor: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneContainer sceneIndex={2}>
      {/* Title */}
      <Sequence durationInFrames={1036} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="The Phasor"
            subtitle="A phase accumulator — the heartbeat of every oscillator"
            color={COLORS.CYAN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Phase ramp visualization */}
      <Sequence from={0} durationInFrames={394} premountFor={PREMOUNT_FRAMES}>
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
                fontSize: 22,
                color: COLORS.TEXT_DIM,
                marginBottom: 16,
                opacity: interpolate(frame, [0, 20], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Phase: 0 → 1 ramp (repeating)
            </div>
            <WaveformVisualizer
              type="phasor"
              width={550}
              height={220}
              delay={10}
              color={COLORS.CYAN}
              periods={3}
            />
            <div style={{ marginTop: 20 }}>
              <KeyPoint
                text="Increments by freq / sampleRate each sample"
                delay={80}
                color={COLORS.CYAN}
              />
              <KeyPoint
                text="Wraps at 1.0 → creates periodic signal"
                delay={110}
                color={COLORS.CYAN}
              />
            </div>
          </div>

          {/* Formula box */}
          <NeonBox color={COLORS.CYAN} delay={40} width={380}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 18,
                color: COLORS.TEXT_PRIMARY,
                lineHeight: 2,
              }}
            >
              <div>
                <span style={{ color: COLORS.CYAN }}>increment</span> = freq /{" "}
                sampleRate
              </div>
              <div>
                <span style={{ color: COLORS.CYAN }}>phase</span> += increment
              </div>
              <div>
                <span style={{ color: COLORS.PINK }}>if</span> (phase {">"}{" "}
                1.0) phase -= 1.0
              </div>
            </div>
          </NeonBox>
        </AbsoluteFill>
      </Sequence>

      {/* Code walkthrough */}
      <Sequence from={394} durationInFrames={287} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div style={{ maxWidth: 700 }}>
            <CodeBlock
              code={PHASOR_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[6, 7, 10, 11, 12]}
              charsPerFrame={3}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Waveform from phasor */}
      <Sequence from={681} durationInFrames={355} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "210px 80px",
            flexDirection: "row",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.TEXT_DIM,
                marginBottom: 12,
                opacity: interpolate(frame - 681, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Phasor → Saw: 2 × phase − 1
            </div>
            <WaveformVisualizer
              type="saw"
              width={500}
              height={200}
              delay={10}
              color={COLORS.GREEN}
              periods={3}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.TEXT_DIM,
                marginBottom: 12,
                opacity: interpolate(frame - 681, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Phasor → Sine: sin(2π × phase)
            </div>
            <WaveformVisualizer
              type="sine"
              width={500}
              height={200}
              delay={30}
              color={COLORS.PINK}
              periods={3}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
      <SceneNarration segments={NARRATION[2].segments} />
    </SceneContainer>
  );
};
