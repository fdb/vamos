import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { FPS } from "./src/lib/timing.ts";
import type { SceneNarration } from "./src/types.ts";

// ─── Episode imports ──────────────────────────────────────────
import { NARRATION as NARRATION_EP01 } from "./src/ep01/narration.ts";
import { SCENE_DURATIONS as SCENE_DURATIONS_EP01, TRANSITION_DURATION as TRANSITION_EP01 } from "./src/ep01/timing.ts";
import { NARRATION as NARRATION_EP02 } from "./src/ep02/narration.ts";
import { SCENE_DURATIONS as SCENE_DURATIONS_EP02, TRANSITION_DURATION as TRANSITION_EP02 } from "./src/ep02/timing.ts";
import { NARRATION as NARRATION_EP03 } from "./src/ep03/narration.ts";
import { SCENE_DURATIONS as SCENE_DURATIONS_EP03, TRANSITION_DURATION as TRANSITION_EP03 } from "./src/ep03/timing.ts";
import { NARRATION as NARRATION_EP04 } from "./src/ep04/narration.ts";
import { SCENE_DURATIONS as SCENE_DURATIONS_EP04, TRANSITION_DURATION as TRANSITION_EP04 } from "./src/ep04/timing.ts";

// ─── Episode registry ─────────────────────────────────────────

interface EpisodeConfig {
  number: number;
  title: string;
  compositionId: string;
  thumbnailId: string | null;
  narration: SceneNarration[];
  sceneDurations: Record<string, number>;
  transitionDuration: number;
  sceneTitles: string[];
  description: string;
}

const EPISODES: Record<string, EpisodeConfig> = {
  ep01: {
    number: 1,
    title: "Foundation",
    compositionId: "Ep01-Foundation",
    thumbnailId: "Ep01-Thumbnail",
    narration: NARRATION_EP01,
    sceneDurations: SCENE_DURATIONS_EP01,
    transitionDuration: TRANSITION_EP01,
    sceneTitles: [
      "Intro",
      "Project Setup",
      "The Phasor",
      "The Oscillator",
      "ADSR Envelope",
      "Voice",
      "Polyphony",
      "Plugin Integration",
      "Outro",
    ],
    description: `Building a polyphonic synthesizer from scratch in C++20 with JUCE.
From an empty project to a working 8-voice polyphonic synth plugin —
phasor, PolyBLEP anti-aliasing, ADSR envelopes, voice allocation,
and JUCE plugin integration.`,
  },
  ep02: {
    number: 2,
    title: "Waveforms",
    compositionId: "Ep02-Waveforms",
    thumbnailId: null,
    narration: NARRATION_EP02,
    sceneDurations: SCENE_DURATIONS_EP02,
    transitionDuration: TRANSITION_EP02,
    sceneTitles: [
      "Intro",
      "Waveform Gallery",
      "Rectangle & Pulse Width",
      "Triangle from Square",
      "Saturated & Waveshaping",
      "The Shape Parameter",
      "Outro",
    ],
    description: `Seven waveform types with anti-aliasing and a Shape parameter.
Pulse width modulation, triangle waves from integrated squares,
and waveshaping with tanh — expanding the oscillator's tonal range.`,
  },
  ep03: {
    number: 3,
    title: "Noise, Mixer & Osc2",
    compositionId: "Ep03-NoiseMixer",
    thumbnailId: null,
    narration: NARRATION_EP03,
    sceneDurations: SCENE_DURATIONS_EP03,
    transitionDuration: TRANSITION_EP03,
    sceneTitles: [
      "Intro",
      "Oscillator 2",
      "Noise",
      "Mixer",
      "Outro",
    ],
    description: `Completing the sound source architecture — a second oscillator
with transpose and detune, white and pink noise generators,
and a mixer to blend all three sources into the filter.`,
  },
  ep04: {
    number: 4,
    title: "The Filter",
    compositionId: "Ep04-Filter",
    thumbnailId: null,
    narration: NARRATION_EP04,
    sceneDurations: SCENE_DURATIONS_EP04,
    transitionDuration: TRANSITION_EP04,
    sceneTitles: [
      "Intro",
      "Sallen-Key MS-20",
      "Filter Gallery",
      "Filter Routing",
      "Outro",
    ],
    description: `Sculpting sound with filters — eight filter types from warm analog
to creative effects. Sallen-Key MS-20 with tanh saturation, Cytomic SVF,
comb, vowel, DJ, and resampling filters, plus per-source routing
and keyboard tracking.`,
  },
};

const VOICEOVER_DIR = "public/voiceover";
const OUTPUT_DIR = "out";

// ─── Helpers ──────────────────────────────────────────────────

/** Get audio duration in seconds via ffprobe */
function getAudioDuration(mp3Path: string): number {
  const result = execSync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${mp3Path}"`,
    { encoding: "utf-8" },
  );
  return parseFloat(result.trim());
}

/** Format seconds as HH:MM:SS.mmm for VTT */
function formatVTT(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
}

/** Format seconds as M:SS for YouTube chapters */
function formatChapter(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Split text into sentences (on .!? followed by whitespace) */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Wrap text to max 2 lines of ~42 chars */
function wrapCue(text: string): string {
  const maxLineLen = 42;
  if (text.length <= maxLineLen) return text;

  const words = text.split(" ");
  let line1 = "";
  let line2 = "";
  let onLine2 = false;

  for (const word of words) {
    if (!onLine2 && (line1 + " " + word).trim().length <= maxLineLen) {
      line1 = (line1 + " " + word).trim();
    } else {
      onLine2 = true;
      line2 = (line2 + " " + word).trim();
    }
  }

  return line2 ? `${line1}\n${line2}` : line1;
}

// ─── Absolute timestamp calculation ──────────────────────────

/** Compute absolute start frame for each scene, accounting for transition overlaps */
function getSceneStartFrames(ep: EpisodeConfig): number[] {
  const durations = Object.values(ep.sceneDurations);
  const starts: number[] = [0];
  for (let i = 1; i < durations.length; i++) {
    starts.push(starts[i - 1] + durations[i - 1] - ep.transitionDuration);
  }
  return starts;
}

// ─── VTT generation ──────────────────────────────────────────

function generateVTT(ep: EpisodeConfig): string {
  const sceneStarts = getSceneStartFrames(ep);
  const cues: string[] = ["WEBVTT", ""];
  let cueIndex = 1;
  const minCueDuration = 1.5;

  for (let sceneIdx = 0; sceneIdx < ep.narration.length; sceneIdx++) {
    const scene = ep.narration[sceneIdx];
    const sceneStartFrame = sceneStarts[sceneIdx];

    for (const segment of scene.segments) {
      const mp3Path = `${VOICEOVER_DIR}/${segment.id}.mp3`;
      const audioDuration = getAudioDuration(mp3Path);

      // Absolute start time of this segment in seconds
      const segmentStartSec = (sceneStartFrame + segment.startFrame) / FPS;
      const segmentEndSec = segmentStartSec + audioDuration;

      // Split into sentences and distribute time by character count
      const sentences = splitSentences(segment.text);
      const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);

      let currentTime = segmentStartSec;

      for (let i = 0; i < sentences.length; i++) {
        const proportion = sentences[i].length / totalChars;
        let cueDuration = audioDuration * proportion;

        // Enforce minimum cue duration
        if (cueDuration < minCueDuration && sentences.length > 1) {
          cueDuration = minCueDuration;
        }

        let cueEnd = currentTime + cueDuration;

        // Clamp last cue to segment end
        if (i === sentences.length - 1) {
          cueEnd = segmentEndSec;
        }

        // Don't let cue extend past segment end
        cueEnd = Math.min(cueEnd, segmentEndSec);

        cues.push(String(cueIndex));
        cues.push(`${formatVTT(currentTime)} --> ${formatVTT(cueEnd)}`);
        cues.push(wrapCue(sentences[i]));
        cues.push("");

        cueIndex++;
        currentTime = cueEnd;
      }
    }
  }

  return cues.join("\n");
}

// ─── Chapter generation ──────────────────────────────────────

function generateChapters(ep: EpisodeConfig): string {
  const sceneStarts = getSceneStartFrames(ep);
  return sceneStarts
    .map((startFrame, i) => `${formatChapter(startFrame / FPS)} ${ep.sceneTitles[i]}`)
    .join("\n");
}

// ─── Description generation ──────────────────────────────────

function generateDescription(ep: EpisodeConfig): string {
  const chapters = generateChapters(ep);
  return `VAMOS — Episode ${ep.number}: ${ep.title}

${ep.description}

Chapters:
${chapters}

Source code: https://github.com/fdb/vamos

#synthesizer #cpp #dsp #juce #vst #audioplugin #musicproduction
`;
}

// ─── Thumbnail rendering ─────────────────────────────────────

function renderThumbnail(ep: EpisodeConfig, epId: string): void {
  if (!ep.thumbnailId) {
    console.log("No thumbnail composition defined — skipping.");
    return;
  }
  console.log("Rendering thumbnail...");
  execSync(`npx remotion still ${ep.thumbnailId} --output=${OUTPUT_DIR}/${epId}-thumbnail.png`, {
    stdio: "inherit",
  });
  console.log(`  Written: ${OUTPUT_DIR}/${epId}-thumbnail.png`);
}

// ─── Main ────────────────────────────────────────────────────

function main() {
  const epId = process.argv[2];

  // No argument → list available episodes
  if (!epId) {
    console.log("Usage: npm run prepare-youtube <episode>\n");
    console.log("Available episodes:");
    for (const [id, ep] of Object.entries(EPISODES)) {
      console.log(`  ${id}  — Episode ${ep.number}: ${ep.title}`);
    }
    process.exit(0);
  }

  const ep = EPISODES[epId];
  if (!ep) {
    console.error(`Unknown episode: ${epId}`);
    console.log("Available episodes:");
    for (const [id, config] of Object.entries(EPISODES)) {
      console.log(`  ${id}  — Episode ${config.number}: ${config.title}`);
    }
    process.exit(1);
  }

  // Ensure output dir exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check ffprobe is available
  try {
    execSync("ffprobe -version", { stdio: "ignore" });
  } catch {
    console.error("ffprobe not found. Install FFmpeg: brew install ffmpeg");
    process.exit(1);
  }

  // Check all voiceover files exist
  const allSegments = ep.narration.flatMap((scene) => scene.segments);
  const missing = allSegments.filter(
    (seg) => !existsSync(`${VOICEOVER_DIR}/${seg.id}.mp3`),
  );
  if (missing.length > 0) {
    console.error(`Missing voiceover files: ${missing.map((s) => s.id).join(", ")}`);
    console.error("Run: npx tsx generate-voiceover.ts");
    process.exit(1);
  }

  // Generate VTT subtitles
  console.log(`Preparing YouTube assets for Episode ${ep.number}: ${ep.title}\n`);
  console.log("Generating subtitles...");
  const vtt = generateVTT(ep);
  writeFileSync(`${OUTPUT_DIR}/${epId}.vtt`, vtt);
  console.log(`  Written: ${OUTPUT_DIR}/${epId}.vtt`);

  // Generate YouTube description
  console.log("Generating description...");
  const description = generateDescription(ep);
  writeFileSync(`${OUTPUT_DIR}/${epId}-description.txt`, description);
  console.log(`  Written: ${OUTPUT_DIR}/${epId}-description.txt`);

  // Render thumbnail
  renderThumbnail(ep, epId);

  // Summary
  console.log("\nYouTube upload artifacts ready:");
  console.log(`  ${OUTPUT_DIR}/${epId}.vtt              — Subtitles`);
  console.log(`  ${OUTPUT_DIR}/${epId}-description.txt  — Description with chapters`);
  if (ep.thumbnailId) {
    console.log(`  ${OUTPUT_DIR}/${epId}-thumbnail.png    — Thumbnail (1280x720)`);
  }
}

main();
