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
import { CyclingEnvelopeVisualizer } from "../../components/CyclingEnvelopeVisualizer";
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";
import { CYCLING_ENV_CODE } from "../code-snippets";

export const CyclingEnv: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1400;
  // Estimates — updated after TTS
  const SEG0_END = 700;

  return (
    <SceneContainer sceneIndex={2} totalScenes={5}>
      {/* Title bar */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Cycling Envelope"
            subtitle="Looping modulator with asymmetric rise and fall"
            color={COLORS.GREEN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: MidPoint animation */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "260px 80px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          {/* Left: Animated visualizer */}
          <div style={{ flex: 1 }}>
            <CyclingEnvelopeVisualizer
              animate
              hold={0.05}
              width={560}
              height={280}
              delay={20}
              color={COLORS.GREEN}
            />
          </div>

          {/* Right: MidPoint explanation */}
          <div style={{ flex: 1 }}>
            <MidPointComparison delay={40} />

            <div style={{ marginTop: 24 }}>
              <KeyPoint
                text="One parameter controls the entire envelope shape"
                delay={160}
                color={COLORS.GREEN}
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <NeonBox color={COLORS.GREEN} delay={220} width={380}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.TEXT_PRIMARY }}>
                  <div style={{ marginBottom: 8, color: COLORS.GREEN, fontWeight: 600 }}>
                    Env2 Mode
                  </div>
                  <div style={{ color: COLORS.TEXT_DIM, fontSize: 13, lineHeight: 1.6 }}>
                    Vamos switches between standard
                    <br />
                    ADSR and CyclingEnvelope for
                    <br />
                    the second envelope slot.
                  </div>
                </div>
              </NeonBox>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Code walkthrough */}
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
              code={CYCLING_ENV_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[9, 16, 17, 18, 20, 21, 22, 23]}
              charsPerFrame={3}
              fontSize={14}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NeonBox color={COLORS.GREEN} delay={80} width={360}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.TEXT_PRIMARY }}>
                <div style={{ marginBottom: 8, color: COLORS.GREEN, fontWeight: 600 }}>
                  Three Phases
                </div>
                <div style={{ lineHeight: 1.6 }}>
                  <div><span style={{ color: COLORS.CYAN }}>L16</span> — Rise: 0 → 1</div>
                  <div><span style={{ color: COLORS.GREEN }}>L18</span> — Hold at peak</div>
                  <div><span style={{ color: COLORS.PINK }}>L20-23</span> — Fall: 1 → 0</div>
                </div>
              </div>
            </NeonBox>

            <div style={{ marginTop: 20 }}>
              <KeyPoint
                text="Under thirty lines — just a phasor and three if-statements"
                delay={200}
                color={COLORS.GREEN}
              />
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[2].segments} />
    </SceneContainer>
  );
};

// --- Inline sub-component ---

const MidPointComparison: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { value: "0.0", desc: "Instant rise, slow fall", hint: "plucked string", color: COLORS.CYAN },
    { value: "0.5", desc: "Symmetric", hint: "balanced", color: COLORS.GREEN },
    { value: "1.0", desc: "Slow rise, instant fall", hint: "swell cutoff", color: COLORS.PINK },
  ];

  return (
    <div>
      {items.map((item, i) => {
        const reveal = spring({
          frame: frame - delay - i * 20,
          fps,
          config: SPRING_SMOOTH,
        });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 12,
              opacity: reveal,
              transform: `translateX(${(1 - reveal) * 20}px)`,
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 22,
                fontWeight: 700,
                color: item.color,
                width: 50,
                textAlign: "right",
              }}
            >
              {item.value}
            </div>
            <div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 16, color: COLORS.TEXT_PRIMARY }}>
                {item.desc}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.TEXT_DIM }}>
                {item.hint}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
