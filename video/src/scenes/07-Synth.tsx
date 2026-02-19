import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_SANS, FONT_MONO } from "../lib/fonts";
import { PREMOUNT_FRAMES, STAGGER_OFFSET } from "../lib/timing";
import { SceneContainer } from "../components/SceneContainer";
import { SectionTitle } from "../components/SectionTitle";
import { CodeBlock } from "../components/CodeBlock";
import { VoiceGrid } from "../components/VoiceGrid";
import { KeyPoint } from "../components/KeyPoint";
import { NeonBox } from "../components/NeonBox";
import { SYNTH_CODE } from "../lib/code-snippets";
import { SceneNarration } from "../components/SceneNarration";
import { NARRATION } from "../lib/narration";

const VOICE_EVENTS = [
  { frame: 30, voice: 0, type: "noteOn" as const, note: "C4" },
  { frame: 60, voice: 1, type: "noteOn" as const, note: "E4" },
  { frame: 90, voice: 2, type: "noteOn" as const, note: "G4" },
  { frame: 120, voice: 3, type: "noteOn" as const, note: "C5" },
  { frame: 180, voice: 4, type: "noteOn" as const, note: "D4" },
  { frame: 210, voice: 5, type: "noteOn" as const, note: "F4" },
  { frame: 250, voice: 6, type: "noteOn" as const, note: "A4" },
  { frame: 290, voice: 7, type: "noteOn" as const, note: "B4" },
  // Voices full — steal oldest (voice 0)
  { frame: 360, voice: 0, type: "steal" as const, note: "E5" },
  { frame: 420, voice: 1, type: "steal" as const, note: "F5" },
];

export const Synth: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneContainer sceneIndex={6}>
      {/* Title */}
      <Sequence durationInFrames={1650} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="8-Voice Polyphonic Synth"
            subtitle="Voice allocation with oldest-voice stealing"
            color={COLORS.AMBER}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Voice grid animation */}
      <Sequence from={60} durationInFrames={600} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 60,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1.2 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.TEXT_DIM,
                marginBottom: 16,
                opacity: interpolate(frame - 60, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Voice Allocation
            </div>
            <VoiceGrid events={VOICE_EVENTS} delay={0} />
          </div>
          <div style={{ flex: 1 }}>
            <NeonBox color={COLORS.AMBER} delay={100}>
              <KeyPoint
                text="8 voices in a fixed pool"
                delay={120}
                color={COLORS.AMBER}
              />
              <KeyPoint
                text="noteOn → find idle voice"
                delay={150}
                color={COLORS.GREEN}
              />
              <KeyPoint
                text="All busy → steal oldest voice"
                delay={180}
                color={COLORS.PINK}
              />
              <KeyPoint
                text="Steal flashes red then reassigns"
                delay={210}
                color={COLORS.PINK}
                icon="⚡"
              />
            </NeonBox>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Synth code */}
      <Sequence from={600} durationInFrames={650} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div style={{ maxWidth: 700 }}>
            <CodeBlock
              code={SYNTH_CODE}
              delay={0}
              mode="typewriter"
              highlightLines={[5, 6, 7, 10, 11, 12, 13]}
              charsPerFrame={3}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Poly modes teaser */}
      <Sequence from={1200} durationInFrames={450} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 24,
              color: COLORS.TEXT_DIM,
              marginBottom: 30,
              opacity: interpolate(frame - 1200, [0, 20], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Play Modes (coming in Phase 2)
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Poly", "Mono", "Unison", "Stereo"].map((mode, i) => (
              <NeonBox
                key={mode}
                color={i === 0 ? COLORS.CYAN : COLORS.TEXT_DIM}
                delay={i * 15}
                width={180}
              >
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 20,
                    fontWeight: 700,
                    color: i === 0 ? COLORS.CYAN : COLORS.TEXT_DIM,
                    textAlign: "center",
                  }}
                >
                  {mode}
                </div>
              </NeonBox>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>
      <SceneNarration segments={NARRATION[6].segments} />
    </SceneContainer>
  );
};
