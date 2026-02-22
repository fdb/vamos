import React from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FONT_SANS, FONT_MONO } from "../../lib/fonts";
import { SPRING_SMOOTH, SPRING_BOUNCY, PREMOUNT_FRAMES } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SectionTitle } from "../../components/SectionTitle";
import { FilterResponseCurve } from "../../components/FilterResponseCurve";
import { CodeBlock } from "../../components/CodeBlock";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";
import { VOWEL_FORMANTS_CODE, RESAMPLING_CODE } from "../code-snippets";

export const Gallery: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SCENE_TOTAL = 2100;
  const SEG0_END = 560;
  const SEG1_END = 1436;

  return (
    <SceneContainer sceneIndex={2} totalScenes={5}>
      {/* Title bar */}
      <Sequence durationInFrames={SCENE_TOTAL} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Filter Gallery"
            subtitle="Eight types, from clean SVF to creative effects"
            color={COLORS.GREEN}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 0: SVF — one filter, three outputs */}
      <Sequence from={0} durationInFrames={SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "260px 80px 80px",
            alignItems: "center",
          }}
        >
          {/* Three SVF outputs side by side */}
          <div style={{ display: "flex", gap: 30 }}>
            {(["lowpass", "highpass", "bandpass"] as const).map((type, i) => {
              const itemDelay = 30 + i * 20;
              const reveal = spring({
                frame: frame - itemDelay,
                fps,
                config: SPRING_SMOOTH,
              });
              const labels = { lowpass: "Low-Pass", highpass: "High-Pass", bandpass: "Band-Pass" };
              const colors = { lowpass: COLORS.CYAN, highpass: COLORS.GREEN, bandpass: COLORS.AMBER };
              return (
                <div
                  key={type}
                  style={{
                    opacity: reveal,
                    textAlign: "center",
                  }}
                >
                  <FilterResponseCurve
                    cutoff={0.5}
                    resonance={0.4}
                    type={type}
                    delay={itemDelay}
                    width={280}
                    height={200}
                    color={colors[type]}
                    showLabels={false}
                    showGrid={false}
                  />
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 14,
                      color: colors[type],
                      fontWeight: 600,
                      marginTop: 8,
                    }}
                  >
                    {labels[type]}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 24 }}>
            <KeyPoint
              text="One structure, three simultaneous outputs — the Cytomic SVF topology"
              delay={100}
              color={COLORS.GREEN}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 1: Creative filters — Comb, Vowel, DJ, Resampling */}
      <Sequence from={SEG0_END} durationInFrames={SEG1_END - SEG0_END} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "260px 80px 80px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              maxWidth: 900,
            }}
          >
            {[
              {
                name: "Comb",
                desc: "Delay line with feedback — metallic, resonant harmonics",
                color: COLORS.AMBER,
                icon: "|||",
              },
              {
                name: "Vowel",
                desc: "Three bandpass filters at formant frequencies — ah, eh, ee, oh, oo",
                color: COLORS.PINK,
                icon: "aeiou",
              },
              {
                name: "DJ",
                desc: "Low-pass below center, high-pass above — the classic sweep",
                color: COLORS.VIOLET,
                icon: "LP|HP",
              },
              {
                name: "Resampling",
                desc: "Hold & repeat samples — crunchy lo-fi degradation",
                color: COLORS.AMBER,
                icon: "▮▮▯▯",
              },
            ].map((filter, i) => {
              const itemDelay = 30 + i * 20;
              const reveal = spring({
                frame: frame - itemDelay,
                fps,
                config: SPRING_BOUNCY,
              });
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "20px 24px",
                    borderRadius: 12,
                    border: `2px solid ${filter.color}44`,
                    backgroundColor: `${filter.color}08`,
                    opacity: reveal,
                    transform: `scale(${reveal})`,
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 18,
                      color: filter.color,
                      fontWeight: 700,
                      minWidth: 60,
                      textAlign: "center",
                      alignSelf: "center",
                    }}
                  >
                    {filter.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 22,
                        fontWeight: 700,
                        color: filter.color,
                        marginBottom: 4,
                      }}
                    >
                      {filter.name}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 14,
                        color: COLORS.TEXT_DIM,
                        lineHeight: 1.4,
                      }}
                    >
                      {filter.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Segment 2: Vowel + Resampling code */}
      <Sequence from={SEG1_END} durationInFrames={SCENE_TOTAL - SEG1_END} premountFor={PREMOUNT_FRAMES}>
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
              code={VOWEL_FORMANTS_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[4, 5, 6, 7, 8]}
              charsPerFrame={3}
              fontSize={14}
            />
            <div style={{ marginTop: 16 }}>
              <KeyPoint
                text="Five vowel shapes — the cutoff knob morphs between them"
                delay={180}
                color={COLORS.PINK}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <CodeBlock
              code={RESAMPLING_CODE}
              delay={120}
              mode="typewriter"
              highlightLines={[5, 6, 7]}
              charsPerFrame={3}
              fontSize={14}
            />
            <div style={{ marginTop: 16 }}>
              <KeyPoint
                text="A counter and a held value — that's the whole filter"
                delay={300}
                color={COLORS.AMBER}
              />
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <SceneNarration segments={NARRATION[2].segments} />
    </SceneContainer>
  );
};
