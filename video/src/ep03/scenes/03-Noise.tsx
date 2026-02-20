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
import { SpectrumVisualizer } from "../../components/SpectrumVisualizer";
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";
import { WHITE_NOISE_CODE, PINK_NOISE_CODE } from "../code-snippets";

export const Noise: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1650;
  const SEG0_END = 593;
  const SEG1_END = 1162;

  return (
    <SceneContainer sceneIndex={2} totalScenes={5}>
      {/* Title bar */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Noise"
            subtitle="Texture, breath, and randomness"
            color={COLORS.AMBER}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: White noise — waveform + flat spectrum */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.AMBER,
                marginBottom: 12,
                opacity: interpolate(frame, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              White Noise
            </div>
            <WaveformVisualizer
              type="white-noise"
              width={480}
              height={180}
              delay={10}
              color={COLORS.AMBER}
              traceMode={false}
            />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 13,
                color: COLORS.TEXT_DIM,
                marginTop: 8,
              }}
            >
              Equal energy at every frequency — pure randomness
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 14,
                color: COLORS.TEXT_DIM,
                marginBottom: 8,
              }}
            >
              Spectrum: flat
            </div>
            <SpectrumVisualizer
              mode="white-noise"
              width={380}
              height={180}
              delay={30}
              color={COLORS.AMBER}
              hideNyquist
            />
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ padding: "80px" }}>
          <div style={{ position: "absolute", bottom: 160, left: 80 }}>
            <KeyPoint
              text="xorshift32 — three bitwise ops to generate audio-quality randomness"
              delay={60}
              color={COLORS.AMBER}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Pink noise — smoother waveform, -3dB/octave spectrum */}
      <Sequence from={SEG0_END} durationInFrames={SEG1_END - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.PINK,
                marginBottom: 12,
                opacity: interpolate(frame - SEG0_END, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Pink Noise
            </div>
            <WaveformVisualizer
              type="pink-noise"
              width={420}
              height={160}
              delay={0}
              color={COLORS.PINK}
              traceMode={false}
            />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 13,
                color: COLORS.TEXT_DIM,
                marginTop: 8,
              }}
            >
              Smoother — less hiss, more warmth
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 14,
                color: COLORS.TEXT_DIM,
                marginBottom: 8,
              }}
            >
              White vs Pink spectrum
            </div>
            {/* Side-by-side spectra */}
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <SpectrumVisualizer
                  mode="white-noise"
                  width={200}
                  height={140}
                  delay={10}
                  color={COLORS.AMBER}
                  numBars={16}
                  hideNyquist
                />
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: COLORS.AMBER,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  White (flat)
                </div>
              </div>
              <div>
                <SpectrumVisualizer
                  mode="pink-noise"
                  width={200}
                  height={140}
                  delay={20}
                  color={COLORS.PINK}
                  numBars={16}
                  hideNyquist
                />
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    color: COLORS.PINK,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Pink (-3dB/oct)
                </div>
              </div>
            </div>
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ padding: "80px" }}>
          <div style={{ position: "absolute", bottom: 160, left: 80 }}>
            <KeyPoint
              text="Paul Kellet's 6-stage IIR filter — decades of use in synthesizers"
              delay={40}
              color={COLORS.PINK}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 2: The Code — both algorithms */}
      <Sequence from={SEG1_END} durationInFrames={SCENE_TOTAL - SEG1_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 14,
                color: COLORS.AMBER,
                marginBottom: 8,
              }}
            >
              White Noise — xorshift32
            </div>
            <CodeBlock
              code={WHITE_NOISE_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[3, 4, 5]}
              fontSize={14}
              charsPerFrame={3}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 14,
                color: COLORS.PINK,
                marginBottom: 8,
              }}
            >
              Pink Noise — Paul Kellet filter
            </div>
            <CodeBlock
              code={PINK_NOISE_CODE}
              delay={60}
              mode="typewriter"
              highlightLines={[6, 7, 8, 9, 10, 11]}
              fontSize={14}
              charsPerFrame={3}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[2].segments} />
    </SceneContainer>
  );
};
