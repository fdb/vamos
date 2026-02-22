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
import { FilterResponseCurve } from "../../components/FilterResponseCurve";
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";
import { SALLEN_KEY_CODE, CASCADE_CODE } from "../code-snippets";

export const SallenKey: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 1920;
  const SEG0_END = 595;
  const SEG1_END = 1179;

  // Animated cutoff sweep in seg 0 — starts high, sweeps down
  const cutoffSweep = interpolate(frame, [60, 420], [0.95, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Resonance grows after cutoff settles
  const resonanceSweep = interpolate(frame, [320, 560], [0.0, 0.75], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneContainer sceneIndex={1} totalScenes={5}>
      {/* Title bar */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Sallen-Key MS-20"
            subtitle="Warm analog filtering with tanh saturation"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: Cutoff & Resonance visualized */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "260px 80px 80px",
            alignItems: "center",
          }}
        >
          <FilterResponseCurve
            cutoff={cutoffSweep}
            resonance={resonanceSweep}
            type="lowpass"
            slope={12}
            delay={20}
            width={900}
            height={320}
          />

          <div style={{ display: "flex", gap: 60, marginTop: 30 }}>
            {/* Cutoff indicator */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  color: COLORS.TEXT_DIM,
                  marginBottom: 4,
                }}
              >
                CUTOFF
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 28,
                  color: COLORS.CYAN,
                  fontWeight: 700,
                }}
              >
                {Math.round(
                  10 ** (Math.log10(20) + cutoffSweep * (Math.log10(20000) - Math.log10(20))),
                )}{" "}
                Hz
              </div>
            </div>

            {/* Resonance indicator */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  color: COLORS.TEXT_DIM,
                  marginBottom: 4,
                }}
              >
                RESONANCE
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 28,
                  color: COLORS.PINK,
                  fontWeight: 700,
                }}
              >
                {Math.round(resonanceSweep * 100)}%
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <KeyPoint
              text="Sweep cutoff down — harmonics disappear. Raise resonance — the peak screams."
              delay={200}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: tanh saturation explained */}
      <Sequence from={SEG0_END} durationInFrames={SEG1_END - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "260px 80px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          {/* tanh curve visualization */}
          <div style={{ flex: 1 }}>
            <TanhCurve delay={20} />

            <div style={{ marginTop: 24 }}>
              <KeyPoint
                text="Without tanh: feedback grows to infinity"
                delay={80}
                color={COLORS.PINK}
              />
              <KeyPoint
                text="With tanh: signal stays bounded, distortion adds warmth"
                delay={120}
                color={COLORS.GREEN}
              />
            </div>
          </div>

          {/* Formula box */}
          <div style={{ flex: 1 }}>
            <NeonBox color={COLORS.CYAN} delay={60} width={400}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: COLORS.TEXT_PRIMARY }}>
                <div style={{ marginBottom: 12, color: COLORS.CYAN, fontWeight: 600, fontSize: 16 }}>
                  The MS-20 Trick
                </div>
                <div style={{ marginBottom: 8 }}>
                  s1 = tanh(s1)
                </div>
                <div style={{ color: COLORS.TEXT_DIM, fontSize: 12, lineHeight: 1.5 }}>
                  Apply tanh to the feedback state.
                  <br />
                  Everything is gently squashed
                  <br />
                  into [-1, +1].
                  <br />
                  <br />
                  The filter screams instead of
                  <br />
                  blowing up.
                </div>
              </div>
            </NeonBox>

            {/* 12 vs 24 dB comparison */}
            <div style={{ marginTop: 30 }}>
              <ComparisonBlock
                delay={200}
                items={[
                  { label: "12 dB/oct", desc: "One stage — gentle, warm", color: COLORS.CYAN },
                  { label: "24 dB/oct", desc: "Two stages cascaded — aggressive", color: COLORS.PINK },
                ]}
              />
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
              code={SALLEN_KEY_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[3, 4, 14]}
              charsPerFrame={3}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NeonBox color={COLORS.CYAN} delay={120} width={360}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.TEXT_PRIMARY }}>
                <div style={{ marginBottom: 8, color: COLORS.CYAN, fontWeight: 600 }}>
                  Key Lines
                </div>
                <div style={{ lineHeight: 1.6 }}>
                  <div><span style={{ color: COLORS.CYAN }}>L3</span> — g from cutoff</div>
                  <div><span style={{ color: COLORS.CYAN }}>L4</span> — k from resonance</div>
                  <div><span style={{ color: COLORS.PINK }}>L14</span> — tanh saturation</div>
                </div>
              </div>
            </NeonBox>

            <div style={{ marginTop: 20 }}>
              <CodeBlock
                code={CASCADE_CODE}
                delay={250}
                mode="typewriter"
                fontSize={14}
                charsPerFrame={3}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <KeyPoint
                text="24 dB = feed output of stage 1 into stage 2"
                delay={380}
              />
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[1].segments} />
    </SceneContainer>
  );
};

// --- Inline sub-components ---

const TanhCurve: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - delay, fps, config: SPRING_SMOOTH });

  const w = 400;
  const h = 240;
  const padL = 50;
  const padR = 10;
  const padT = 20;
  const padB = 30;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Draw tanh curve
  const points: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const x = padL + t * plotW;
    const input = (t - 0.5) * 8; // -4 to +4
    const output = Math.tanh(input);
    const y = padT + (1 - (output + 1) / 2) * plotH;
    points.push(`${x},${y}`);
  }

  // Draw linear (no tanh) for comparison
  const linearPoints: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const x = padL + t * plotW;
    const input = (t - 0.5) * 8;
    const output = Math.max(-3, Math.min(3, input));
    const y = padT + (1 - (output / 3 + 1) / 2) * plotH;
    linearPoints.push(`${x},${y}`);
  }

  return (
    <div style={{ opacity: reveal }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Grid */}
        <line
          x1={padL}
          y1={padT + plotH / 2}
          x2={padL + plotW}
          y2={padT + plotH / 2}
          stroke={COLORS.TEXT_DIM}
          strokeOpacity={0.2}
        />
        <line
          x1={padL + plotW / 2}
          y1={padT}
          x2={padL + plotW / 2}
          y2={padT + plotH}
          stroke={COLORS.TEXT_DIM}
          strokeOpacity={0.2}
        />

        {/* Linear reference (danger) */}
        <polyline
          points={linearPoints.join(" ")}
          fill="none"
          stroke={COLORS.PINK}
          strokeWidth={1.5}
          strokeDasharray="6,4"
          strokeOpacity={0.5}
        />

        {/* tanh curve */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={COLORS.CYAN}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Labels */}
        <text x={padL + plotW + 4} y={padT + 4} fill={COLORS.CYAN} fontSize={11} fontFamily="monospace">
          +1
        </text>
        <text x={padL + plotW + 4} y={padT + plotH} fill={COLORS.CYAN} fontSize={11} fontFamily="monospace">
          -1
        </text>
        <text x={padL + plotW / 2} y={h - 6} textAnchor="middle" fill={COLORS.TEXT_DIM} fontSize={11} fontFamily="monospace">
          input
        </text>

        {/* Legend */}
        <line x1={padL + 10} y1={padT + 10} x2={padL + 30} y2={padT + 10} stroke={COLORS.CYAN} strokeWidth={2} />
        <text x={padL + 35} y={padT + 14} fill={COLORS.CYAN} fontSize={11} fontFamily="monospace">
          tanh(x)
        </text>
        <line x1={padL + 10} y1={padT + 26} x2={padL + 30} y2={padT + 26} stroke={COLORS.PINK} strokeWidth={1.5} strokeDasharray="6,4" />
        <text x={padL + 35} y={padT + 30} fill={COLORS.PINK} fontSize={11} fontFamily="monospace">
          linear
        </text>
      </svg>
    </div>
  );
};

const ComparisonBlock: React.FC<{
  delay: number;
  items: { label: string; desc: string; color: string }[];
}> = ({ delay, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", gap: 16 }}>
      {items.map((item, i) => {
        const reveal = spring({
          frame: frame - delay - i * 15,
          fps,
          config: SPRING_SMOOTH,
        });
        return (
          <div
            key={i}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 8,
              border: `1px solid ${item.color}44`,
              backgroundColor: `${item.color}08`,
              opacity: reveal,
            }}
          >
            <div style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: item.color, marginBottom: 4 }}>
              {item.label}
            </div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: COLORS.TEXT_DIM }}>
              {item.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
};
