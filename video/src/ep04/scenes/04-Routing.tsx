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
import { ROUTING_CODE } from "../code-snippets";

export const Routing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1140;
  const SEG0_END = 566;

  return (
    <SceneContainer sceneIndex={3} totalScenes={5}>
      {/* Title bar */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Filter Routing"
            subtitle="Per-source bypass and keyboard tracking"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: Through routing concept + keyboard tracking */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "260px 80px 80px",
            alignItems: "center",
          }}
        >
          <SignalFlowDiagram
            delay={10}
            activeBlocks={["osc1", "osc2", "noise", "mixer", "filter", "amp"]}
            showPulse
          />

          {/* Through switches visualization */}
          <div
            style={{
              display: "flex",
              gap: 40,
              marginTop: 40,
            }}
          >
            {[
              { label: "Osc 1", through: true, color: COLORS.CYAN },
              { label: "Osc 2", through: false, color: COLORS.CYAN },
              { label: "Noise", through: true, color: COLORS.AMBER },
            ].map((src, i) => {
              const reveal = spring({
                frame: frame - 60 - i * 15,
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
                      fontSize: 14,
                      color: src.color,
                      marginBottom: 8,
                    }}
                  >
                    {src.label}
                  </div>
                  {/* Through switch */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: src.through ? `${COLORS.GREEN}44` : `${COLORS.TEXT_DIM}22`,
                        border: `2px solid ${src.through ? COLORS.GREEN : COLORS.TEXT_DIM}44`,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: src.through ? COLORS.GREEN : COLORS.TEXT_DIM,
                          position: "absolute",
                          top: 1,
                          left: src.through ? 22 : 1,
                          boxShadow: src.through ? `0 0 8px ${COLORS.GREEN}66` : "none",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 12,
                        color: src.through ? COLORS.GREEN : COLORS.TEXT_DIM,
                      }}
                    >
                      {src.through ? "Through" : "Bypass"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20 }}>
            <KeyPoint
              text="Filter a bright saw while keeping a clean sub underneath"
              delay={120}
            />
          </div>

          {/* Keyboard tracking note */}
          <div style={{ marginTop: 8 }}>
            <KeyPoint
              text="Keyboard tracking: higher notes = brighter tone, like acoustic instruments"
              delay={300}
              color={COLORS.AMBER}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Routing code */}
      <Sequence from={SEG0_END} durationInFrames={SCENE_TOTAL - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "260px 80px 80px",
            flexDirection: "row",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 2 }}>
            <CodeBlock
              code={ROUTING_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[7, 8, 9, 10, 11, 12, 15]}
              charsPerFrame={3}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NeonBox color={COLORS.CYAN} delay={100} width={340}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.TEXT_PRIMARY }}>
                <div style={{ marginBottom: 8, color: COLORS.CYAN, fontWeight: 600 }}>
                  Routing Pattern
                </div>
                <div style={{ lineHeight: 1.6 }}>
                  <div>1. Split by Through switch</div>
                  <div>2. Filter the "through" path</div>
                  <div>3. Sum filtered + bypassed</div>
                  <div>4. Apply secondary high-pass</div>
                </div>
                <div style={{ marginTop: 12, color: COLORS.TEXT_DIM, fontSize: 11 }}>
                  At 10 Hz the high-pass is inaudible.
                  Raise it to thin out the bass.
                </div>
              </div>
            </NeonBox>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[3].segments} />
    </SceneContainer>
  );
};
