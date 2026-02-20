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
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

const SHAPE_DEMOS = [
  {
    type: "saw" as const,
    name: "Saw",
    effect: "rounds corners → triangle",
    color: COLORS.CYAN,
  },
  {
    type: "rectangle" as const,
    name: "Rectangle",
    effect: "widens pulse width",
    color: COLORS.PINK,
  },
  {
    type: "sharktooth" as const,
    name: "SharkTooth",
    effect: "shifts peak left → right",
    color: COLORS.GREEN,
  },
  {
    type: "saturated" as const,
    name: "Saturated",
    effect: "increases tanh drive",
    color: COLORS.AMBER,
  },
];

export const Shape: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1060;
  const SEG0_END = 564;

  // Shape sweep: 0 → 1 cycling over the scene for segment 0
  const shapeSweep = interpolate(
    frame,
    [60, SEG0_END - 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <SceneContainer sceneIndex={5} totalScenes={7}>
      {/* Title */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="The Shape Parameter"
            subtitle="One knob, many effects"
            color={COLORS.CYAN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: 2x2 grid of waveforms morphing with Shape */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "190px 80px 80px",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Shape value indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 30,
              width: 600,
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
            <div
              style={{
                flex: 1,
                height: 8,
                backgroundColor: `${COLORS.TEXT_DIM}22`,
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  width: `${shapeSweep * 100}%`,
                  height: "100%",
                  backgroundColor: COLORS.CYAN,
                  borderRadius: 4,
                  boxShadow: `0 0 8px ${COLORS.CYAN}66`,
                }}
              />
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 18,
                fontWeight: 700,
                color: COLORS.CYAN,
                minWidth: 50,
              }}
            >
              {shapeSweep.toFixed(2)}
            </div>
          </div>

          {/* 2x2 Grid */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 30,
              justifyContent: "center",
              maxWidth: 900,
            }}
          >
            {SHAPE_DEMOS.map((demo, i) => {
              const itemReveal = spring({
                frame: frame - i * 10 - 20,
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
                    opacity: itemReveal,
                    width: 400,
                  }}
                >
                  <WaveformVisualizer
                    type={demo.type}
                    width={380}
                    height={150}
                    delay={i * 10 + 20}
                    color={demo.color}
                    strokeWidth={2.5}
                    periods={3}
                    shapeValue={shapeSweep}
                    traceMode={false}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 16,
                        fontWeight: 600,
                        color: demo.color,
                      }}
                    >
                      {demo.name}
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 12,
                        color: COLORS.TEXT_DIM,
                      }}
                    >
                      {demo.effect}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Why It Matters */}
      <Sequence from={SEG0_END} durationInFrames={SCENE_TOTAL - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 80,
          }}
        >
          <NeonBox color={COLORS.CYAN} delay={0} width={700}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 24,
                fontWeight: 600,
                color: COLORS.CYAN,
                marginBottom: 16,
              }}
            >
              One Parameter, Maximum Expression
            </div>
            <KeyPoint
              text="Shape is a continuous spectrum — not a toggle"
              delay={20}
              color={COLORS.CYAN}
            />
            <KeyPoint
              text="Each waveform type interprets it differently"
              delay={50}
              color={COLORS.AMBER}
            />
            <KeyPoint
              text="Switching types with fixed Shape = completely different sound"
              delay={80}
              color={COLORS.GREEN}
            />
          </NeonBox>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[5].segments} />
    </SceneContainer>
  );
};
