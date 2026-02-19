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
import { PREMOUNT_FRAMES, SPRING_SMOOTH } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SectionTitle } from "../../components/SectionTitle";
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { Badge } from "../../components/Badge";
import { PROCESS_BLOCK_CODE, APVTS_PARAMS_CODE, SMOOTHED_VALUE_CODE } from "../code-snippets";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

export const PluginIntegration: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Durations derived from narration audio lengths
  const SCENE_TOTAL = 2844;
  const SEG0_END = 649;
  const SEG1_END = 1338;
  const SEG2_END = 1912;

  return (
    <SceneContainer sceneIndex={7}>
      {/* Title */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Plugin Integration"
            subtitle="Connecting our DSP engine to JUCE"
            color={COLORS.PINK}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: JUCE AudioProcessor — what it provides */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "210px 80px",
            alignItems: "center",
          }}
        >
          {/* What JUCE provides diagram */}
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.PINK,
              marginBottom: 24,
              opacity: interpolate(frame, [0, 15], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            JUCE AudioProcessor: The Bridge to Your DAW
          </div>

          {/* Flow: DAW → JUCE AudioProcessor → Our DSP */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {[
              { label: "Your DAW", color: COLORS.TEXT_DIM, desc: "Ableton, Logic, etc." },
              { label: "AudioProcessor", color: COLORS.PINK, desc: "JUCE entry point" },
              { label: "Our DSP Engine", color: COLORS.CYAN, desc: "Pure C++ synth" },
            ].map((block, i) => {
              const blockReveal = spring({
                frame: frame - i * 20,
                fps,
                config: SPRING_SMOOTH,
              });
              return (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 28,
                        color: COLORS.TEXT_DIM,
                        opacity: interpolate(frame, [i * 20, i * 20 + 15], [0, 0.6], {
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
                      padding: "20px 28px",
                      borderRadius: 8,
                      border: `1px solid ${block.color}`,
                      backgroundColor: `${block.color}11`,
                      textAlign: "center",
                      transform: `scale(${blockReveal})`,
                      minWidth: 180,
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

          <div style={{ marginTop: 30 }}>
            <NeonBox color={COLORS.PINK} delay={80} width={700}>
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 16,
                  color: COLORS.TEXT_DIM,
                  marginBottom: 8,
                }}
              >
                JUCE handles:
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Badge label="Audio I/O" color={COLORS.PINK} delay={100} />
                <Badge label="MIDI" color={COLORS.PINK} delay={110} />
                <Badge label="Plugin Formats" color={COLORS.PINK} delay={120} />
                <Badge label="GUI" color={COLORS.PINK} delay={130} />
                <Badge label="Parameters" color={COLORS.PINK} delay={140} />
                <Badge label="State Save/Load" color={COLORS.PINK} delay={150} />
              </div>
            </NeonBox>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: APVTS parameter system */}
      <Sequence from={SEG0_END} durationInFrames={SEG1_END - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 40,
          }}
        >
          <div style={{ flex: 1, maxWidth: 650 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                fontWeight: 600,
                color: COLORS.AMBER,
                marginBottom: 16,
                opacity: interpolate(frame - SEG0_END, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              APVTS: The Parameter System
            </div>
            <CodeBlock
              code={APVTS_PARAMS_CODE}
              delay={10}
              mode="typewriter"
              highlightLines={[5, 6, 7, 10, 11, 12]}
              charsPerFrame={3}
              fontSize={14}
            />
          </div>
          <div style={{ flex: 0.6, paddingTop: 20 }}>
            <NeonBox color={COLORS.AMBER} delay={200}>
              <KeyPoint
                text="30+ parameters"
                delay={220}
                color={COLORS.AMBER}
              />
              <KeyPoint
                text="Name, range, default value"
                delay={250}
                color={COLORS.AMBER}
              />
              <KeyPoint
                text="Auto save/load + DAW automation"
                delay={280}
                color={COLORS.GREEN}
                icon="✓"
              />
            </NeonBox>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 2: processBlock bridge */}
      <Sequence from={SEG1_END} durationInFrames={SEG2_END - SEG1_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            alignItems: "center",
          }}
        >
          {/* Parameter flow diagram */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 30 }}>
            {[
              { label: "APVTS", color: COLORS.PINK, desc: "30+ params" },
              { label: "SynthParams", color: COLORS.AMBER, desc: "struct pack" },
              { label: "Synth", color: COLORS.CYAN, desc: "setParameters()" },
              { label: "Voices", color: COLORS.GREEN, desc: "per-voice copy" },
            ].map((block, i) => {
              const blockReveal = spring({
                frame: frame - SEG1_END - i * 15,
                fps,
                config: SPRING_SMOOTH,
              });
              return (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 20,
                        color: COLORS.TEXT_DIM,
                        opacity: interpolate(frame - SEG1_END, [i * 15, i * 15 + 12], [0, 0.6], {
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
                      padding: "12px 20px",
                      borderRadius: 8,
                      border: `1px solid ${block.color}`,
                      backgroundColor: `${block.color}11`,
                      textAlign: "center",
                      transform: `scale(${blockReveal})`,
                      minWidth: 130,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 16,
                        fontWeight: 700,
                        color: block.color,
                      }}
                    >
                      {block.label}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 12,
                        color: COLORS.TEXT_DIM,
                        marginTop: 2,
                      }}
                    >
                      {block.desc}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div style={{ maxWidth: 700 }}>
            <CodeBlock
              code={PROCESS_BLOCK_CODE}
              delay={80}
              mode="typewriter"
              highlightLines={[5, 6, 9, 10]}
              charsPerFrame={2}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 3: SmoothedValue — detailed explanation */}
      <Sequence from={SEG2_END} durationInFrames={SCENE_TOTAL - SEG2_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 40,
          }}
        >
          <div style={{ flex: 1.2 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                fontWeight: 600,
                color: COLORS.AMBER,
                marginBottom: 16,
                opacity: interpolate(frame - SEG2_END, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              SmoothedValue: Avoiding Audio Clicks
            </div>
            <CodeBlock
              code={SMOOTHED_VALUE_CODE}
              delay={10}
              mode="typewriter"
              highlightLines={[7, 8, 11, 12, 15]}
              charsPerFrame={2}
              fontSize={14}
            />
          </div>
          <div style={{ flex: 0.8, paddingTop: 30 }}>
            {/* Without smoothing: step */}
            <div
              style={{
                marginBottom: 20,
                opacity: interpolate(frame - SEG2_END, [60, 80], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 14,
                  color: COLORS.PINK,
                  marginBottom: 8,
                }}
              >
                Without smoothing:
              </div>
              <svg width={280} height={60} viewBox="0 0 280 60">
                <line x1={10} y1={40} x2={140} y2={40} stroke={COLORS.PINK} strokeWidth={2} />
                <line x1={140} y1={40} x2={140} y2={15} stroke={COLORS.PINK} strokeWidth={2} />
                <line x1={140} y1={15} x2={270} y2={15} stroke={COLORS.PINK} strokeWidth={2} />
                <text x={140} y={55} fill={COLORS.TEXT_DIM} fontSize={10} textAnchor="middle">
                  click!
                </text>
              </svg>
            </div>
            {/* With smoothing: ramp */}
            <div
              style={{
                opacity: interpolate(frame - SEG2_END, [100, 120], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 14,
                  color: COLORS.GREEN,
                  marginBottom: 8,
                }}
              >
                With SmoothedValue:
              </div>
              <svg width={280} height={60} viewBox="0 0 280 60">
                <line x1={10} y1={40} x2={120} y2={40} stroke={COLORS.GREEN} strokeWidth={2} />
                <path
                  d="M 120 40 C 150 40, 160 15, 170 15"
                  fill="none"
                  stroke={COLORS.GREEN}
                  strokeWidth={2}
                />
                <line x1={170} y1={15} x2={270} y2={15} stroke={COLORS.GREEN} strokeWidth={2} />
                <text x={145} y={55} fill={COLORS.TEXT_DIM} fontSize={10} textAnchor="middle">
                  ~10ms ramp
                </text>
              </svg>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[7].segments} />
    </SceneContainer>
  );
};
