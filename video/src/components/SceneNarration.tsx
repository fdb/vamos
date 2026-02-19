import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import type { NarrationSegment } from "../lib/narration";
import { PREMOUNT_FRAMES } from "../lib/timing";

type SceneNarrationProps = {
  segments: NarrationSegment[];
};

/**
 * Renders Audio elements for each narration segment in a scene.
 * Each segment is placed at its startFrame offset via a Sequence.
 */
export const SceneNarration: React.FC<SceneNarrationProps> = ({ segments }) => {
  return (
    <>
      {segments.map((seg) => (
        <Sequence
          key={seg.id}
          from={seg.startFrame}
          layout="none"
          premountFor={PREMOUNT_FRAMES}
        >
          <Audio src={staticFile(`voiceover/${seg.id}.mp3`)} />
        </Sequence>
      ))}
    </>
  );
};
