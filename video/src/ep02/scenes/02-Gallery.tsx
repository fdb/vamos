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
import { SPRING_BOUNCY, PREMOUNT_FRAMES } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SectionTitle } from "../../components/SectionTitle";
import { WaveformVisualizer } from "../../components/WaveformVisualizer";
import { SpectrumVisualizer } from "../../components/SpectrumVisualizer";
import { KeyPoint } from "../../components/KeyPoint";
import { Badge } from "../../components/Badge";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

const WAVEFORMS = [
  { type: "saw" as const, name: "Saw", tag: "rich", color: COLORS.CYAN },
  { type: "sine" as const, name: "Sine", tag: "pure", color: COLORS.GREEN },
  { type: "triangle" as const, name: "Triangle", tag: "mellow", color: COLORS.AMBER },
  { type: "rectangle" as const, name: "Rectangle", tag: "hollow", color: COLORS.PINK },
  { type: "pulse" as const, name: "Pulse", tag: "nasal", color: COLORS.VIOLET },
  { type: "sharktooth" as const, name: "SharkTooth", tag: "asymmetric", color: COLORS.CYAN },
  { type: "saturated" as const, name: "Saturated", tag: "warm", color: COLORS.AMBER },
];

export const Gallery: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SEG0_END = 718;

  return (
    <SceneContainer sceneIndex={1} totalScenes={7}>
      {/* Title */}
      <Sequence durationInFrames={1111} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="The Waveform Gallery"
            subtitle="Seven oscillator types, each anti-aliased"
            color={COLORS.CYAN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: The Seven Types — staggered grid reveal */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "180px 60px 60px",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 20,
            alignContent: "flex-start",
          }}
        >
          {WAVEFORMS.map((wf, i) => {
            const stagger = i * 15;
            const itemReveal = spring({
              frame: frame - stagger - 30,
              fps,
              config: SPRING_BOUNCY,
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  opacity: itemReveal,
                  transform: `scale(${0.8 + 0.2 * itemReveal})`,
                  width: 230,
                }}
              >
                <WaveformVisualizer
                  type={wf.type}
                  width={210}
                  height={110}
                  color={wf.color}
                  delay={stagger + 30}
                  periods={2}
                  strokeWidth={2}
                  shapeValue={0.5}
                />
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 16,
                    fontWeight: 600,
                    color: wf.color,
                    marginTop: 4,
                  }}
                >
                  {wf.name}
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    color: COLORS.TEXT_DIM,
                  }}
                >
                  {wf.tag}
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Anti-aliasing recap + transition to deep dives */}
      <Sequence from={SEG0_END} durationInFrames={1111 - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 40, marginBottom: 30 }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 16,
                    color: COLORS.PINK,
                    marginBottom: 8,
                    opacity: interpolate(frame - SEG0_END, [0, 15], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                >
                  Without PolyBLEP
                </div>
                <SpectrumVisualizer
                  mode="aliased"
                  width={350}
                  height={140}
                  delay={10}
                  color={COLORS.PINK}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 16,
                    color: COLORS.GREEN,
                    marginBottom: 8,
                    opacity: interpolate(frame - SEG0_END, [0, 15], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                >
                  With PolyBLEP
                </div>
                <SpectrumVisualizer
                  mode="clean"
                  width={350}
                  height={140}
                  delay={20}
                  color={COLORS.GREEN}
                />
              </div>
            </div>
            <KeyPoint
              text="Clean harmonics, no aliasing artifacts"
              delay={40}
              color={COLORS.GREEN}
              icon="✓"
            />
            <div style={{ marginTop: 20 }}>
              <KeyPoint
                text="Let's look at the three most interesting ones..."
                delay={80}
                color={COLORS.CYAN}
                icon="→"
              />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <Badge label="Rectangle" color={COLORS.PINK} delay={110} />
              <Badge label="Triangle" color={COLORS.GREEN} delay={120} />
              <Badge label="Saturated" color={COLORS.AMBER} delay={130} />
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[1].segments} />
    </SceneContainer>
  );
};
