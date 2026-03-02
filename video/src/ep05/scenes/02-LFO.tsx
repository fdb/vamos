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
import { NARRATION } from "../narration";
import { LFO_SHAPES_CODE, LFO_PROCESS_CODE } from "../code-snippets";

// 8 LFO shapes — 4 standard (WaveformVisualizer) + 4 exotic (inline SVG)
const STANDARD_SHAPES: { label: string; type: "sine" | "triangle" | "saw" | "square" }[] = [
  { label: "Sine", type: "sine" },
  { label: "Triangle", type: "triangle" },
  { label: "Saw Up", type: "saw" },
  { label: "Square", type: "square" },
];

const EXOTIC_SHAPES = [
  { label: "Saw Down", color: COLORS.CYAN },
  { label: "Sample & Hold", color: COLORS.AMBER },
  { label: "Wander", color: COLORS.GREEN },
  { label: "Exponential", color: COLORS.PINK },
];

// --- Inline SVG renderers for exotic LFO shapes ---

function generateSawDownPoints(w: number, h: number, pad: number): string {
  const points: string[] = [];
  const plotW = w - 2 * pad;
  const plotH = h - 2 * pad;
  for (let i = 0; i <= 100; i++) {
    const phase = i / 100;
    const value = 1.0 - 2.0 * phase; // bipolar: +1 → -1
    const x = pad + phase * plotW;
    const y = pad + (1 - (value + 1) / 2) * plotH;
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

function generateSandHPoints(w: number, h: number, pad: number): string {
  // Deterministic S&H: random values at regular intervals
  const points: string[] = [];
  const plotW = w - 2 * pad;
  const plotH = h - 2 * pad;
  const steps = 8;
  let rng = 0xDEADBEEF;
  const vals: number[] = [];
  for (let s = 0; s < steps; s++) {
    rng ^= rng << 13;
    rng ^= rng >> 17;
    rng ^= rng << 5;
    rng = rng >>> 0;
    vals.push(((rng / 4294967296) * 2 - 1));
  }
  for (let i = 0; i <= 200; i++) {
    const phase = i / 200;
    const idx = Math.min(Math.floor(phase * steps), steps - 1);
    const value = vals[idx];
    const x = pad + phase * plotW;
    const y = pad + (1 - (value + 1) / 2) * plotH;
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

function generateWanderPoints(w: number, h: number, pad: number): string {
  const points: string[] = [];
  const plotW = w - 2 * pad;
  const plotH = h - 2 * pad;
  let wanderVal = 0;
  let rng = 0xCAFEBABE;
  for (let i = 0; i <= 200; i++) {
    rng ^= rng << 13;
    rng ^= rng >> 17;
    rng ^= rng << 5;
    rng = rng >>> 0;
    const noise = (rng / 4294967296) * 2 - 1;
    wanderVal += 0.05 * (noise - wanderVal);
    const x = pad + (i / 200) * plotW;
    const y = pad + (1 - (wanderVal + 1) / 2) * plotH;
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

function generateExpEnvPoints(w: number, h: number, pad: number): string {
  const points: string[] = [];
  const plotW = w - 2 * pad;
  const plotH = h - 2 * pad;
  for (let i = 0; i <= 100; i++) {
    const phase = i / 100;
    const value = Math.exp(-phase * 6.0); // unipolar decay
    const x = pad + phase * plotW;
    const y = pad + (1 - value) * plotH;
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

const EXOTIC_GENERATORS = [
  generateSawDownPoints,
  generateSandHPoints,
  generateWanderPoints,
  generateExpEnvPoints,
];

const ExoticWaveform: React.FC<{
  generator: (w: number, h: number, pad: number) => string;
  color: string;
  label: string;
  delay: number;
}> = ({ generator, color, label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - delay, fps, config: SPRING_SMOOTH });

  const w = 200;
  const h = 120;
  const pad = 16;

  return (
    <div style={{ opacity: reveal, transform: `scale(${reveal})` }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Zero line */}
        <line
          x1={pad} y1={h / 2} x2={w - pad} y2={h / 2}
          stroke={COLORS.TEXT_DIM} strokeOpacity={0.2} strokeDasharray="3,3"
        />
        {/* Waveform */}
        <polyline
          points={generator(w, h, pad)}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}44)` }}
        />
      </svg>
      <div
        style={{
          textAlign: "center",
          fontFamily: FONT_MONO,
          fontSize: 13,
          color,
          marginTop: -4,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const LFO: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1574;
  const SEG0_END = 412;  // lfo-1 starts here
  const SEG1_END = 1061; // lfo-2 starts here

  return (
    <SceneContainer sceneIndex={1} totalScenes={5}>
      {/* Title bar */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="LFO — Low Frequency Oscillator"
            subtitle="Eight shapes for rhythmic modulation"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: Waveform gallery — 8 shapes */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "260px 80px 80px",
            alignItems: "center",
          }}
        >
          {/* Standard 4 shapes */}
          <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
            {STANDARD_SHAPES.map((shape, i) => (
              <div key={shape.type} style={{ textAlign: "center" }}>
                <WaveformVisualizer
                  type={shape.type}
                  width={200}
                  height={120}
                  delay={30 + i * 12}
                  color={COLORS.CYAN}
                />
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 13,
                    color: COLORS.CYAN,
                    marginTop: -4,
                  }}
                >
                  {shape.label}
                </div>
              </div>
            ))}
          </div>

          {/* Exotic 4 shapes */}
          <div style={{ display: "flex", gap: 24 }}>
            {EXOTIC_SHAPES.map((shape, i) => (
              <ExoticWaveform
                key={shape.label}
                generator={EXOTIC_GENERATORS[i]}
                color={shape.color}
                label={shape.label}
                delay={80 + i * 12}
              />
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <KeyPoint
              text="Same phasor math as audio oscillators, but at sub-audio rates (0.01–20 Hz)"
              delay={160}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: S&H and Wander deep dive */}
      <Sequence from={SEG0_END} durationInFrames={SEG1_END - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "260px 80px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          {/* Left: enlarged exotic waveforms */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 30 }}>
              <ExoticWaveform
                generator={(w, h, p) => generateSandHPoints(340, 160, p)}
                color={COLORS.AMBER}
                label="Sample & Hold"
                delay={20}
              />
            </div>
            <ExoticWaveform
              generator={(w, h, p) => generateWanderPoints(340, 160, p)}
              color={COLORS.GREEN}
              label="Wander"
              delay={60}
            />
          </div>

          {/* Right: key differences */}
          <div style={{ flex: 1 }}>
            <NeonBox color={COLORS.AMBER} delay={40} width={400}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: COLORS.TEXT_PRIMARY }}>
                <div style={{ marginBottom: 8, color: COLORS.AMBER, fontWeight: 600, fontSize: 16 }}>
                  Sample & Hold
                </div>
                <div style={{ color: COLORS.TEXT_DIM, fontSize: 13, lineHeight: 1.6 }}>
                  New random value each cycle.
                  <br />
                  Stepped, staircase output.
                  <br />
                  Classic sci-fi bleep sounds.
                </div>
              </div>
            </NeonBox>

            <div style={{ marginTop: 20 }}>
              <NeonBox color={COLORS.GREEN} delay={100} width={400}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: COLORS.TEXT_PRIMARY }}>
                  <div style={{ marginBottom: 8, color: COLORS.GREEN, fontWeight: 600, fontSize: 16 }}>
                    Wander
                  </div>
                  <div style={{ color: COLORS.TEXT_DIM, fontSize: 13, lineHeight: 1.6 }}>
                    Random noise → low-pass filter.
                    <br />
                    Smooth, unpredictable drift.
                    <br />
                    Filter cutoff scales with LFO rate.
                  </div>
                </div>
              </NeonBox>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 2: Code walkthrough */}
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
              code={LFO_SHAPES_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[17, 18, 22, 23, 24]}
              charsPerFrame={3}
              fontSize={14}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NeonBox color={COLORS.CYAN} delay={80} width={360}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.TEXT_PRIMARY }}>
                <div style={{ marginBottom: 8, color: COLORS.CYAN, fontWeight: 600 }}>
                  Key Lines
                </div>
                <div style={{ lineHeight: 1.6 }}>
                  <div><span style={{ color: COLORS.AMBER }}>L17-18</span> — S&H: new value on wrap</div>
                  <div><span style={{ color: COLORS.GREEN }}>L22-24</span> — Wander: exp smoothing</div>
                </div>
              </div>
            </NeonBox>

            <div style={{ marginTop: 20 }}>
              <KeyPoint
                text="Amount scales the output, retrigger resets the phase on each new note"
                delay={200}
              />
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[1].segments} />
    </SceneContainer>
  );
};
