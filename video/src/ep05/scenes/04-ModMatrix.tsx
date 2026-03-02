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
import { ModRoutingDiagram } from "../../components/ModRoutingDiagram";
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";
import { MOD_CONTEXT_CODE, MOD_MATRIX_CODE, VOICE_MOD_CODE } from "../code-snippets";

export const ModMatrix: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1800;
  // Estimates — updated after TTS
  const SEG0_END = 530;
  const SEG1_END = 1100;

  return (
    <SceneContainer sceneIndex={3} totalScenes={5}>
      {/* Title bar */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Modulation Matrix"
            subtitle="Routing eight sources to twelve targets"
            color={COLORS.PINK}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: ModContext — snapshot per sample */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "260px 80px 80px",
            flexDirection: "row",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <CodeBlock
              code={VOICE_MOD_CODE}
              delay={20}
              mode="typewriter"
              charsPerFrame={3}
              fontSize={14}
            />
          </div>

          <div style={{ flex: 1 }}>
            <NeonBox color={COLORS.PINK} delay={60} width={420}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: COLORS.TEXT_PRIMARY }}>
                <div style={{ marginBottom: 8, color: COLORS.PINK, fontWeight: 600, fontSize: 16 }}>
                  ModContext
                </div>
                <div style={{ color: COLORS.TEXT_DIM, fontSize: 13, lineHeight: 1.6 }}>
                  A snapshot of the synth's state,
                  <br />
                  taken 44,100 times per second.
                  <br />
                  <br />
                  Eight sources: envelopes, LFO,
                  <br />
                  velocity, keyboard, controllers.
                </div>
              </div>
            </NeonBox>

            <div style={{ marginTop: 20 }}>
              <SourceGrid delay={120} />
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Routing diagram */}
      <Sequence from={SEG0_END} durationInFrames={SEG1_END - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "240px 80px 80px",
            alignItems: "center",
          }}
        >
          <ModRoutingDiagram
            delay={20}
            showDedicated
            activeRoutes={[
              { source: "LFO", target: "LPFrequency", amount: 0.5, color: COLORS.CYAN },
              { source: "Env1", target: "MainVolume", amount: 1.0, color: COLORS.GREEN },
            ]}
          />

          <div style={{ display: "flex", gap: 40, marginTop: 10 }}>
            <KeyPoint
              text="Dedicated slots for filter, pitch, and shape"
              delay={80}
              color={COLORS.PINK}
            />
            <KeyPoint
              text="Three general-purpose slots — any source to any target"
              delay={120}
              color={COLORS.CYAN}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 2: resolveTarget code */}
      <Sequence from={SEG1_END} durationInFrames={SCENE_TOTAL - SEG1_END} premountFor={PREMOUNT_FRAMES}>
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
              code={MOD_MATRIX_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[23, 24, 25, 26, 27]}
              charsPerFrame={3}
              fontSize={13}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NeonBox color={COLORS.PINK} delay={80} width={360}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.TEXT_PRIMARY }}>
                <div style={{ marginBottom: 8, color: COLORS.PINK, fontWeight: 600 }}>
                  resolveTarget()
                </div>
                <div style={{ lineHeight: 1.6, fontSize: 13 }}>
                  <div><span style={{ color: COLORS.CYAN }}>L23-27</span> — Loop over slots</div>
                  <div style={{ marginTop: 4, color: COLORS.TEXT_DIM }}>
                    Sum up source × amount
                    <br />
                    for each slot targeting
                    <br />
                    this destination.
                  </div>
                </div>
              </div>
            </NeonBox>

            <div style={{ marginTop: 20 }}>
              <KeyPoint
                text="Pitch and filter use exponential scaling — musical intervals are logarithmic"
                delay={200}
              />
            </div>
            <KeyPoint
              text="LFO rate is a target — meta-modulation, where the modulator modulates itself"
              delay={260}
              color={COLORS.AMBER}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[3].segments} />
    </SceneContainer>
  );
};

// --- Inline sub-component ---

const SourceGrid: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sources = [
    { label: "Env1", color: COLORS.GREEN },
    { label: "Env2/Cyc", color: COLORS.GREEN },
    { label: "LFO", color: COLORS.CYAN },
    { label: "Velocity", color: COLORS.AMBER },
    { label: "Modwheel", color: COLORS.AMBER },
    { label: "Pressure", color: COLORS.AMBER },
    { label: "Slide", color: COLORS.AMBER },
    { label: "Key", color: COLORS.VIOLET },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 420 }}>
      {sources.map((src, i) => {
        const reveal = spring({
          frame: frame - delay - i * 6,
          fps,
          config: SPRING_SMOOTH,
        });
        return (
          <div
            key={i}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: `1px solid ${src.color}66`,
              backgroundColor: `${src.color}10`,
              opacity: reveal,
              transform: `scale(${reveal})`,
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 13,
                fontWeight: 600,
                color: src.color,
              }}
            >
              {src.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
