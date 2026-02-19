import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FONT_SANS } from "../../lib/fonts";
import { PREMOUNT_FRAMES, STAGGER_OFFSET } from "../../lib/timing";
import { SceneContainer } from "../../components/SceneContainer";
import { SectionTitle } from "../../components/SectionTitle";
import { CodeBlock } from "../../components/CodeBlock";
import { FileTree } from "../../components/FileTree";
import { KeyPoint } from "../../components/KeyPoint";
import { NeonBox } from "../../components/NeonBox";
import { Badge } from "../../components/Badge";
import { CMAKE_FETCH_CONTENT, JUCE_PLUGIN_TARGET } from "../code-snippets";
import { FILE_TREE_DATA } from "../code-snippets";
import { SceneNarration } from "../../components/SceneNarration";
import { NARRATION } from "../narration";

export const ProjectSetup: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneContainer sceneIndex={1}>
      {/* Title */}
      <Sequence durationInFrames={1552} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "60px 80px" }}>
          <SectionTitle
            title="Project Setup"
            subtitle="CMake + JUCE 8 FetchContent"
            color={COLORS.AMBER}
          />
        </AbsoluteFill>
      </Sequence>

      {/* CMake FetchContent code */}
      <Sequence from={0} durationInFrames={451} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div style={{ maxWidth: 800 }}>
            <CodeBlock
              code={CMAKE_FETCH_CONTENT}
              lang="cmake"
              delay={0}
              mode="typewriter"
              highlightLines={[6, 7, 8, 9, 10]}
            />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Badge label="FetchContent" color={COLORS.AMBER} delay={180} />
            <Badge label="No submodules" color={COLORS.GREEN} delay={200} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Plugin target */}
      <Sequence from={451} durationInFrames={396} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill style={{ padding: "200px 80px" }}>
          <div style={{ maxWidth: 800 }}>
            <CodeBlock
              code={JUCE_PLUGIN_TARGET}
              lang="cmake"
              delay={0}
              mode="typewriter"
            />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Badge label="VST3" color={COLORS.CYAN} delay={150} />
            <Badge label="AU" color={COLORS.PINK} delay={165} />
            <Badge label="Standalone" color={COLORS.GREEN} delay={180} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* File tree + Two-layer architecture */}
      <Sequence from={847} durationInFrames={705} premountFor={PREMOUNT_FRAMES}>
        <AbsoluteFill
          style={{
            padding: "200px 80px",
            flexDirection: "row",
            gap: 60,
          }}
        >
          {/* File tree */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.TEXT_DIM,
                marginBottom: 16,
                opacity: interpolate(frame - 847, [0, 20], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Project Structure
            </div>
            <FileTree
              entries={FILE_TREE_DATA}
              highlightPaths={["src/dsp/", "src/PluginProcessor.cpp"]}
            />
          </div>

          {/* Two-layer explanation */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                color: COLORS.TEXT_DIM,
                marginBottom: 16,
                opacity: interpolate(frame - 847, [0, 20], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Two-Layer Architecture
            </div>
            <NeonBox color={COLORS.CYAN} delay={30}>
              <KeyPoint
                text="DSP Layer — Pure C++20, zero JUCE deps"
                color={COLORS.CYAN}
                delay={60}
              />
              <KeyPoint
                text="Fast unit tests without linking JUCE"
                color={COLORS.CYAN}
                delay={90}
                icon="✓"
              />
            </NeonBox>
            <div style={{ height: 20 }} />
            <NeonBox color={COLORS.PINK} delay={120}>
              <KeyPoint
                text="Plugin Layer — JUCE AudioProcessor, GUI"
                color={COLORS.PINK}
                delay={150}
              />
              <KeyPoint
                text="APVTS parameter system, 30+ params"
                color={COLORS.PINK}
                delay={180}
                icon="✓"
              />
            </NeonBox>
          </div>
        </AbsoluteFill>
      </Sequence>
      <SceneNarration segments={NARRATION[1].segments} />
    </SceneContainer>
  );
};
