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
import { SignalFlowDiagram } from "../../components/SignalFlowDiagram";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { VOICE_CODE } from "../code-snippets";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

export const Voice: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneContainer sceneIndex={5}>
      {/* Title */}
      <Sequence durationInFrames={1514} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="The Voice"
            subtitle="Wiring oscillators, filter, and envelope into a single signal chain"
            color={COLORS.VIOLET}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Signal chain diagram */}
      <Sequence from={0} durationInFrames={443} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "160px 40px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SignalFlowDiagram
            delay={0}
            activeBlocks={["osc1", "osc2", "mixer", "filter", "amp", "output"]}
            showPulse
          />
        </AbsoluteFill>
      </Sequence>

      {/* MIDI to frequency */}
      <Sequence from={443} durationInFrames={366} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "210px 80px" }}>
          <NeonBox color={COLORS.VIOLET} delay={0} width={700}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.VIOLET,
                marginBottom: 16,
              }}
            >
              MIDI → Frequency Conversion
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 20,
                color: COLORS.TEXT_PRIMARY,
                lineHeight: 1.8,
              }}
            >
              <span style={{ color: COLORS.CYAN }}>freq</span> = 440 × 2
              <sup style={{ fontSize: 14 }}>
                (<span style={{ color: COLORS.GREEN }}>midiNote</span> − 69) / 12
              </sup>
            </div>
            <div style={{ marginTop: 20 }}>
              <KeyPoint
                text="MIDI 69 = A4 = 440 Hz (reference pitch)"
                delay={40}
                color={COLORS.VIOLET}
              />
              <KeyPoint
                text="Each semitone = multiply by 2^(1/12)"
                delay={70}
                color={COLORS.VIOLET}
              />
            </div>
          </NeonBox>
        </AbsoluteFill>
      </Sequence>

      {/* Voice code */}
      <Sequence from={809} durationInFrames={705} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div style={{ maxWidth: 700 }}>
            <CodeBlock
              code={VOICE_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[5, 6, 7, 8, 12, 13, 14]}
              charsPerFrame={3}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
      <SceneNarration segments={NARRATION[5].segments} />
    </SceneContainer>
  );
};
