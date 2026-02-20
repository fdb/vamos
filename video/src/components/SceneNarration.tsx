import React from "react";
import {
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import type { NarrationSegment } from "../types";
import { COLORS } from "../lib/colors";
import { FONT_SANS } from "../lib/fonts";

type SceneNarrationProps = {
  segments: NarrationSegment[];
  /** Show subtitle captions at the bottom of the screen. Default: false (use VTT for YouTube instead) */
  showSubtitles?: boolean;
  /** Load and play voiceover audio. Set to false to preview without audio. Default: true */
  playAudio?: boolean;
};

/**
 * Subtitle display component that shows narration text
 * with fade-in/out at the bottom of the screen.
 */
const Subtitle: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 50,
        left: 80,
        right: 80,
        textAlign: "center",
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "inline-block",
          backgroundColor: `${COLORS.BG_DEEP}DD`,
          padding: "12px 24px",
          borderRadius: 8,
          maxWidth: 1200,
        }}
      >
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 22,
            color: COLORS.TEXT_PRIMARY,
            lineHeight: 1.5,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

/**
 * Renders Audio elements and optional subtitle captions for each narration segment.
 *
 * - `showSubtitles={true}` (default): Shows narration text at the bottom of the screen.
 *   Useful for previewing visual-narration sync without sound.
 * - `playAudio={false}`: Skips loading audio files entirely. Use this when voiceover
 *   MP3s haven't been generated yet, or to preview visuals without audio.
 */
export const SceneNarration: React.FC<SceneNarrationProps> = ({
  segments,
  showSubtitles = false,
  playAudio = true,
}) => {
  return (
    <>
      {segments.map((seg, i) => {
        // Subtitle duration: spans from this segment's start to the next segment's start
        const nextStart = segments[i + 1]?.startFrame;
        const subtitleDuration = nextStart
          ? nextStart - seg.startFrame
          : 900; // fallback: 30 seconds for last segment in scene

        return (
          <React.Fragment key={seg.id}>
            {/* Audio */}
            {playAudio && (
              <Sequence from={seg.startFrame} layout="none">
                <Audio src={staticFile(`voiceover/${seg.id}.mp3`)} />
              </Sequence>
            )}

            {/* Subtitle caption */}
            {showSubtitles && (
              <Sequence
                from={seg.startFrame}
                durationInFrames={subtitleDuration}
                layout="none"
              >
                <Subtitle text={seg.text} durationInFrames={subtitleDuration} />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};
