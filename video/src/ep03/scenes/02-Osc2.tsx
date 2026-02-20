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
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { SceneNarration } from "../../components/SceneNarration";
import { detunedSawSpectrum } from "../../lib/fft";
import { NARRATION } from "../narration";
import { OSC2_FREQ_CODE } from "../code-snippets";

const FFT_SIZE = 8192;
const FUNDAMENTAL_CYCLES = 96; // harmonics at bins 96, 192, 288, ... — wide spacing for visible splitting
const NUM_DISPLAY_BINS = 800;
const MAX_DETUNE_CENTS = 80;
const PERIODS = 4;

/** Segment 1: Detune — animated phase drift waveform + real FFT spectrum */
const DetuneSegment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segmentDuration = 479;

  // --- Timing ---
  // First ~2 seconds: single oscillator, clean spectrum, narration context
  // Then Osc2 appears and detune ramps up
  const INTRO_FRAMES = 60; // ~2s at 30fps
  const showOverlay = frame >= INTRO_FRAMES;

  // Detune ramps 0 → 50 cents only after the intro
  const detuneCents = interpolate(
    frame,
    [INTRO_FRAMES, segmentDuration],
    [0, MAX_DETUNE_CENTS],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Phase offset accumulates after intro (quadratic drift — faster as detune grows)
  let phaseOffset = 0;
  if (showOverlay) {
    for (let f = INTRO_FRAMES; f < frame; f++) {
      const c = interpolate(f, [INTRO_FRAMES, segmentDuration], [0, MAX_DETUNE_CENTS], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      phaseOffset += PERIODS * (Math.pow(2, c / 1200) - 1);
    }
  }

  // FFT: single saw during intro, combined signal after
  const spectrum = showOverlay
    ? detunedSawSpectrum(FFT_SIZE, FUNDAMENTAL_CYCLES, detuneCents, NUM_DISPLAY_BINS)
    : detunedSawSpectrum(FFT_SIZE, FUNDAMENTAL_CYCLES, 0, NUM_DISPLAY_BINS);

  // Smooth (3-point weighted average) for cleaner rendering
  const smoothed = spectrum.map((v, i) => {
    if (i === 0 || i === spectrum.length - 1) return v;
    return (spectrum[i - 1] + v * 2 + spectrum[i + 1]) / 4;
  });

  const labelReveal = spring({
    frame: frame - 5,
    fps,
    config: SPRING_SMOOTH,
    durationInFrames: 30,
  });

  const spectrumReveal = spring({
    frame: frame - 15,
    fps,
    config: SPRING_SMOOTH,
    durationInFrames: 45,
  });

  // FFT area chart dimensions
  const fftWidth = 1000;
  const fftHeight = 220;
  const fftPad = { top: 10, right: 10, bottom: 28, left: 10 };
  const plotW = fftWidth - fftPad.left - fftPad.right;
  const plotH = fftHeight - fftPad.top - fftPad.bottom;

  // Build SVG paths from spectrum data
  const points = smoothed.map((mag, i) => {
    const x = fftPad.left + (i / (smoothed.length - 1)) * plotW;
    const y = fftPad.top + plotH - mag * plotH * spectrumReveal;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = [
    `M ${fftPad.left} ${fftPad.top + plotH}`,
    ...points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${fftPad.left + plotW} ${fftPad.top + plotH}`,
    "Z",
  ].join(" ");

  // Caption changes when Osc2 appears
  const caption = showOverlay
    ? `Osc1 (cyan) + Osc2 detuned +${Math.round(detuneCents)}¢ (amber)`
    : "Single oscillator — clean harmonics";

  return (
    <>
      <AbsoluteFill
        style={{
          padding: "200px 80px 80px",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Top row: Waveform + NeonBox */}
        <div style={{ display: "flex", flexDirection: "row", gap: 40, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <WaveformVisualizer
              type="saw"
              width={640}
              height={180}
              delay={0}
              color={COLORS.CYAN}
              periods={PERIODS}
              overlay={showOverlay ? { type: "saw", color: COLORS.AMBER, phaseOffset } : undefined}
            />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 13,
                color: COLORS.TEXT_DIM,
                marginTop: 2,
                opacity: labelReveal,
              }}
            >
              {caption}
            </div>
          </div>

          <NeonBox color={COLORS.CYAN} delay={20} width={300}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: COLORS.TEXT_PRIMARY }}>
              <div style={{ marginBottom: 8, color: COLORS.CYAN, fontWeight: 600 }}>
                Detune: +{Math.round(detuneCents)} cents
              </div>
              <div>1 cent = 1/100 semitone</div>
              <div style={{ marginTop: 8, color: COLORS.TEXT_DIM, fontSize: 12 }}>
                ratio = 2^(cents/1200)
              </div>
            </div>
          </NeonBox>
        </div>

        {/* FFT spectrum of combined signal */}
        <div>
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 15,
              color: COLORS.CYAN,
              marginBottom: 6,
              opacity: labelReveal,
            }}
          >
            Frequency Spectrum (FFT)
          </div>
          <svg width={fftWidth} height={fftHeight} viewBox={`0 0 ${fftWidth} ${fftHeight}`}>
            {/* Baseline */}
            <line
              x1={fftPad.left}
              y1={fftPad.top + plotH}
              x2={fftPad.left + plotW}
              y2={fftPad.top + plotH}
              stroke={COLORS.TEXT_DIM}
              strokeWidth={0.5}
              opacity={0.3}
            />
            {/* Filled area under curve */}
            <defs>
              <linearGradient id="fftGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.CYAN} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLORS.CYAN} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#fftGrad)" />
            {/* Glow layer */}
            <path
              d={linePath}
              fill="none"
              stroke={COLORS.CYAN}
              strokeWidth={5}
              opacity={0.12}
            />
            {/* Main spectrum line */}
            <path
              d={linePath}
              fill="none"
              stroke={COLORS.CYAN}
              strokeWidth={1.5}
              style={{ filter: `drop-shadow(0 0 4px ${COLORS.CYAN}66)` }}
            />
            {/* X-axis label */}
            <text
              x={fftWidth / 2}
              y={fftHeight - 4}
              fontSize={12}
              fill={COLORS.TEXT_DIM}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              opacity={0.6}
            >
              {"Frequency \u2192"}
            </text>
          </svg>
        </div>
      </AbsoluteFill>

      {/* KeyPoint at bottom */}
      <AbsoluteFill style={{ padding: "80px" }}>
        <div style={{ position: "absolute", bottom: 100, left: 80 }}>
          <KeyPoint
            text="A few cents of detune creates chorus — two frequencies beating against each other"
            delay={INTRO_FRAMES + 20}
            color={COLORS.AMBER}
          />
        </div>
      </AbsoluteFill>
    </>
  );
};

export const Osc2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1560;
  const SEG0_END = 546;
  const SEG1_END = 1025;

  return (
    <SceneContainer sceneIndex={1} totalScenes={5}>
      {/* Title bar — visible throughout */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Oscillator 2"
            subtitle="Transpose and Detune — thickness from simplicity"
            color={COLORS.CYAN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: Transpose — side-by-side waveforms at different octaves */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
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
                fontSize: 18,
                color: COLORS.CYAN,
                marginBottom: 12,
                opacity: interpolate(frame, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Osc 1 — Base Pitch
            </div>
            <WaveformVisualizer
              type="saw"
              width={420}
              height={180}
              delay={10}
              color={COLORS.CYAN}
              periods={4}
              label="A3 (220 Hz)"
            />
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 18,
                color: COLORS.AMBER,
                marginBottom: 12,
                opacity: interpolate(frame, [15, 30], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Osc 2 — Transpose -12 (One Octave Down)
            </div>
            <WaveformVisualizer
              type="saw"
              width={420}
              height={180}
              delay={20}
              color={COLORS.AMBER}
              periods={2}
              label="A2 (110 Hz)"
            />
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ padding: "80px" }}>
          <div style={{ position: "absolute", bottom: 160, left: 80 }}>
            <KeyPoint
              text="Transpose shifts by semitones — default -12 thickens the sound instantly"
              delay={60}
              color={COLORS.CYAN}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Detune — animated phase drift + spectrum comparison */}
      <Sequence from={SEG0_END} durationInFrames={SEG1_END - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <DetuneSegment />
      </Sequence>

      {/* Segment 2: The Code */}
      <Sequence from={SEG1_END} durationInFrames={SCENE_TOTAL - SEG1_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div style={{ maxWidth: 750 }}>
            <CodeBlock
              code={OSC2_FREQ_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[1, 3]}
              charsPerFrame={2}
            />
          </div>
          <div style={{ marginTop: 24 }}>
            <KeyPoint
              text="pow(2, cents/1200) — the equal temperament formula, one line"
              delay={80}
              color={COLORS.CYAN}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[1].segments} />
    </SceneContainer>
  );
};
