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
import { SPRING_SMOOTH, PREMOUNT_FRAMES } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SectionTitle } from "../../components/SectionTitle";
import { SignalFlowDiagram } from "../../components/SignalFlowDiagram";
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";
import { MIXER_PROCESS_CODE } from "../code-snippets";

export const Mixer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 870;
  const SEG0_END = 406;

  // Animated gain indicators
  const gains = [
    { label: "Osc 1", value: 1.0, color: COLORS.CYAN },
    { label: "Osc 2", value: 0.8, color: COLORS.CYAN },
    { label: "Noise", value: 0.3, color: COLORS.AMBER },
  ];

  return (
    <SceneContainer sceneIndex={3} totalScenes={5}>
      {/* Title bar */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Mixer"
            subtitle="Three sources in, one signal out"
            color={COLORS.GREEN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: Signal flow + gain indicators */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "180px 80px",
            alignItems: "center",
          }}
        >
          <SignalFlowDiagram
            delay={10}
            activeBlocks={["osc1", "osc2", "noise", "mixer"]}
            showPulse
          />

          {/* Gain level indicators */}
          <div
            style={{
              display: "flex",
              gap: 60,
              marginTop: 40,
            }}
          >
            {gains.map((g, i) => {
              const reveal = spring({
                frame: frame - 40 - i * 15,
                fps,
                config: SPRING_SMOOTH,
              });
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    opacity: reveal,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 13,
                      color: g.color,
                      marginBottom: 6,
                    }}
                  >
                    {g.label}
                  </div>
                  {/* Gain bar */}
                  <div
                    style={{
                      width: 40,
                      height: 80,
                      backgroundColor: `${COLORS.TEXT_DIM}22`,
                      borderRadius: 4,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        width: "100%",
                        height: `${g.value * 50}%`,
                        backgroundColor: g.color,
                        borderRadius: 4,
                        boxShadow: `0 0 8px ${g.color}66`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 12,
                      color: COLORS.TEXT_DIM,
                      marginTop: 4,
                    }}
                  >
                    {g.value}x
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 24 }}>
            <KeyPoint
              text="Gain up to 2x — overdrive the mixer into the filter for extra harmonics"
              delay={80}
              color={COLORS.GREEN}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: The Code */}
      <Sequence from={SEG0_END} durationInFrames={SCENE_TOTAL - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 2 }}>
            <CodeBlock
              code={MIXER_PROCESS_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[5, 6, 7, 9]}
              charsPerFrame={3}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NeonBox color={COLORS.GREEN} delay={60} width={320}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: COLORS.TEXT_PRIMARY }}>
                <div style={{ marginBottom: 8, color: COLORS.GREEN, fontWeight: 600 }}>
                  The Mixer Pattern
                </div>
                <div>1. Generate each source</div>
                <div>2. Multiply by gain</div>
                <div>3. Sum into filter</div>
                <div style={{ marginTop: 12, color: COLORS.TEXT_DIM, fontSize: 12 }}>
                  Simple addition — the filter adds color
                </div>
              </div>
            </NeonBox>
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ padding: "80px" }}>
          <div style={{ position: "absolute", bottom: 160, left: 80 }}>
            <KeyPoint
              text="The mixer is transparent — coloring the sound is the filter's job"
              delay={120}
              color={COLORS.GREEN}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[3].segments} />
    </SceneContainer>
  );
};
