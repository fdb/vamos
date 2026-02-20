import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FONT_SANS, FONT_MONO } from "../../lib/fonts";
import { PREMOUNT_FRAMES } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SectionTitle } from "../../components/SectionTitle";
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";
import { RECTANGLE_CODE } from "../code-snippets";

export const Rectangle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1446;
  const SEG0_END = 588;
  const SEG1_END = 1077;

  // Animated pulse width for segment 0: sweeps shape from 0 to 1 over the segment
  const pwSweep = interpolate(frame, [60, SEG0_END - 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Duty cycle display percentage
  const dutyCycle = Math.round(50 + pwSweep * 49);

  return (
    <SceneContainer sceneIndex={2} totalScenes={7}>
      {/* Title */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Rectangle & PWM"
            subtitle="Pulse width modulation — one parameter, infinite timbres"
            color={COLORS.PINK}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: What is PWM — animated rectangle with duty cycle indicator */}
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
            <WaveformVisualizer
              type="rectangle"
              width={520}
              height={200}
              delay={10}
              color={COLORS.PINK}
              strokeWidth={3}
              periods={3}
              shapeValue={pwSweep}
            />
            {/* Duty cycle indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 16,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 16,
                  color: COLORS.TEXT_DIM,
                }}
              >
                Shape
              </div>
              {/* Shape bar */}
              <div
                style={{
                  flex: 1,
                  height: 8,
                  backgroundColor: `${COLORS.TEXT_DIM}22`,
                  borderRadius: 4,
                  position: "relative",
                  maxWidth: 300,
                }}
              >
                <div
                  style={{
                    width: `${pwSweep * 100}%`,
                    height: "100%",
                    backgroundColor: COLORS.PINK,
                    borderRadius: 4,
                    boxShadow: `0 0 8px ${COLORS.PINK}66`,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.PINK,
                  minWidth: 60,
                }}
              >
                {dutyCycle}%
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <KeyPoint
                text="Pulse width modulation shifts the harmonic content"
                delay={100}
                color={COLORS.PINK}
              />
            </div>
          </div>

          <NeonBox color={COLORS.PINK} delay={40} width={350}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: COLORS.TEXT_PRIMARY }}>
              <div style={{ marginBottom: 8, color: COLORS.PINK, fontWeight: 600 }}>
                Pulse Width
              </div>
              <div>Shape=0 → 50% (square)</div>
              <div>Shape=1 → 99% (sliver)</div>
              <div style={{ marginTop: 12, color: COLORS.TEXT_DIM, fontSize: 12 }}>
                pw = 0.5 + shape × 0.49
              </div>
            </div>
          </NeonBox>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: The Code */}
      <Sequence from={SEG0_END} durationInFrames={SEG1_END - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div style={{ maxWidth: 750 }}>
            <CodeBlock
              code={RECTANGLE_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[2, 3, 6, 7, 8, 9]}
              charsPerFrame={3}
            />
          </div>
          <div style={{ marginTop: 20 }}>
            <KeyPoint
              text="Two PolyBLEP corrections — one at each edge"
              delay={120}
              color={COLORS.PINK}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 2: Pulse variant — side-by-side comparison */}
      <Sequence from={SEG1_END} durationInFrames={SCENE_TOTAL - SEG1_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.PINK,
                marginBottom: 12,
                opacity: interpolate(frame - SEG1_END, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Rectangle (50-99%)
            </div>
            <WaveformVisualizer
              type="rectangle"
              width={380}
              height={180}
              delay={10}
              color={COLORS.PINK}
              periods={3}
              shapeValue={0.3}
            />
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.TEXT_DIM, marginTop: 8 }}>
              hollow, clarinet-like
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.VIOLET,
                marginBottom: 12,
                opacity: interpolate(frame - SEG1_END, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Pulse (5-45%)
            </div>
            <WaveformVisualizer
              type="pulse"
              width={380}
              height={180}
              delay={20}
              color={COLORS.VIOLET}
              periods={3}
              shapeValue={0.3}
            />
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.TEXT_DIM, marginTop: 8 }}>
              thin, nasal
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[2].segments} />
    </SceneContainer>
  );
};
