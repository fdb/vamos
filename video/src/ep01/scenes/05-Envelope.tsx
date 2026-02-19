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
import { ADSRVisualizer } from "../../components/ADSRVisualizer";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { ENVELOPE_CODE } from "../code-snippets";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

export const Envelope: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneContainer sceneIndex={4}>
      {/* Title */}
      <Sequence durationInFrames={1747} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="ADSR Envelope"
            subtitle="Exponential curves shape amplitude over time"
            color={COLORS.GREEN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* ADSR visualization */}
      <Sequence from={0} durationInFrames={550} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            alignItems: "center",
          }}
        >
          <ADSRVisualizer
            width={800}
            height={350}
            delay={0}
            showOvershoot
            showDot
          />
          <div
            style={{
              display: "flex",
              gap: 40,
              marginTop: 30,
            }}
          >
            {[
              { label: "Attack", color: COLORS.GREEN, desc: "0 → 1.0" },
              { label: "Decay", color: COLORS.AMBER, desc: "1.0 → sustain" },
              { label: "Sustain", color: COLORS.CYAN, desc: "Hold level" },
              { label: "Release", color: COLORS.PINK, desc: "→ 0" },
            ].map((phase, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  opacity: interpolate(frame, [i * 35, i * 35 + 20], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 18,
                    fontWeight: 700,
                    color: phase.color,
                  }}
                >
                  {phase.label}
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 14,
                    color: COLORS.TEXT_DIM,
                    marginTop: 4,
                  }}
                >
                  {phase.desc}
                </div>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Overshoot trick explanation */}
      <Sequence from={550} durationInFrames={581} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 60,
          }}
        >
          <NeonBox color={COLORS.AMBER} delay={0} width={500}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.AMBER,
                marginBottom: 16,
              }}
            >
              The Overshoot Trick
            </div>
            <KeyPoint
              text="Attack targets 1.2 instead of 1.0"
              delay={30}
              color={COLORS.AMBER}
            />
            <KeyPoint
              text="Exponential curve naturally reaches 1.0"
              delay={60}
              color={COLORS.AMBER}
            />
            <KeyPoint
              text="No special-case clamping needed"
              delay={90}
              color={COLORS.GREEN}
              icon="✓"
            />
          </NeonBox>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 16,
                color: COLORS.TEXT_PRIMARY,
                lineHeight: 2.2,
                opacity: interpolate(frame - 550, [20, 40], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <div>
                <span style={{ color: COLORS.TEXT_DIM }}>// Without overshoot:</span>
              </div>
              <div>
                level → 0.95, 0.98, 0.99...{" "}
                <span style={{ color: COLORS.PINK }}>never 1.0!</span>
              </div>
              <div style={{ height: 16 }} />
              <div>
                <span style={{ color: COLORS.TEXT_DIM }}>// With 1.2 target:</span>
              </div>
              <div>
                level → 0.96, 1.02, 1.05...{" "}
                <span style={{ color: COLORS.GREEN }}>clamp at 1.0 ✓</span>
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Envelope code */}
      <Sequence from={1131} durationInFrames={616} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div style={{ maxWidth: 720 }}>
            <CodeBlock
              code={ENVELOPE_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[7, 14, 15, 18, 19]}
              charsPerFrame={3}
              fontSize={15}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
      <SceneNarration segments={NARRATION[4].segments} />
    </SceneContainer>
  );
};
