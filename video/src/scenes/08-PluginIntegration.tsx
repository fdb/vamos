import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_SANS, FONT_MONO } from "../lib/fonts";
import { PREMOUNT_FRAMES, SPRING_SMOOTH } from "../lib/timing";
import { SceneContainer } from "../components/SceneContainer";
import { SectionTitle } from "../components/SectionTitle";
import { CodeBlock } from "../components/CodeBlock";
import { KeyPoint } from "../components/KeyPoint";
import { NeonBox } from "../components/NeonBox";
import { Badge } from "../components/Badge";
import { PROCESS_BLOCK_CODE } from "../lib/code-snippets";
import { SceneNarration } from "../components/SceneNarration";
import { NARRATION } from "../lib/narration";

export const PluginIntegration: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneContainer sceneIndex={7}>
      {/* Title */}
      <Sequence durationInFrames={1050} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Plugin Integration"
            subtitle="Connecting DSP to JUCE AudioProcessor"
            color={COLORS.PINK}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Parameter flow diagram */}
      <Sequence from={60} durationInFrames={500} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "210px 80px",
            alignItems: "center",
          }}
        >
          {/* Flow: APVTS → SynthParams → Synth → Voice */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {[
              { label: "APVTS", color: COLORS.PINK, desc: "30+ params" },
              { label: "SynthParams", color: COLORS.AMBER, desc: "struct pack" },
              { label: "Synth", color: COLORS.CYAN, desc: "setParameters()" },
              { label: "Voices", color: COLORS.GREEN, desc: "per-voice copy" },
            ].map((block, i) => {
              const blockReveal = spring({
                frame: frame - 60 - i * 20,
                fps,
                config: SPRING_SMOOTH,
              });

              return (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 24,
                        color: COLORS.TEXT_DIM,
                        opacity: interpolate(frame - 60, [i * 20, i * 20 + 15], [0, 0.6], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                        }),
                      }}
                    >
                      →
                    </div>
                  )}
                  <div
                    style={{
                      padding: "16px 24px",
                      borderRadius: 8,
                      border: `1px solid ${block.color}`,
                      backgroundColor: `${block.color}11`,
                      textAlign: "center",
                      transform: `scale(${blockReveal})`,
                      minWidth: 150,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 18,
                        fontWeight: 700,
                        color: block.color,
                      }}
                    >
                      {block.label}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 13,
                        color: COLORS.TEXT_DIM,
                        marginTop: 4,
                      }}
                    >
                      {block.desc}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
            <Badge label="SmoothedValue" color={COLORS.AMBER} delay={120} />
            <Badge label="No audio clicks" color={COLORS.GREEN} delay={140} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* processBlock code */}
      <Sequence from={450} durationInFrames={600} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div style={{ maxWidth: 700 }}>
            <CodeBlock
              code={PROCESS_BLOCK_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[5, 6, 9, 10]}
              charsPerFrame={2}
            />
          </div>
          <div style={{ marginTop: 24 }}>
            <KeyPoint
              text="Pack APVTS → SynthParams every processBlock call"
              delay={200}
              color={COLORS.PINK}
            />
            <KeyPoint
              text="4 smoothed params: volume, filterFreq, osc1Gain, osc2Gain"
              delay={230}
              color={COLORS.AMBER}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
      <SceneNarration segments={NARRATION[7].segments} />
    </SceneContainer>
  );
};
