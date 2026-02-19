import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { NARRATION } from "./src/ep01/narration.ts";
import { SCENE_DURATIONS, TRANSITION_DURATION } from "./src/ep01/timing.ts";
import { FPS } from "./src/lib/timing.ts";

const VOICEOVER_DIR = "public/voiceover";
const OUTPUT_DIR = "out";

// Scene names for chapter titles (order matches SCENE_DURATIONS keys)
const SCENE_TITLES = [
  "Intro",
  "Project Setup",
  "The Phasor",
  "The Oscillator",
  "ADSR Envelope",
  "Voice",
  "Polyphony",
  "Plugin Integration",
  "Outro",
];

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

const durations = Object.values(SCENE_DURATIONS);

/** Compute absolute start frame for each scene, accounting for transition overlaps */
function getSceneStartFrames(): number[] {
  const starts: number[] = [0];
  for (let i = 1; i < durations.length; i++) {
    starts.push(starts[i - 1] + durations[i - 1] - TRANSITION_DURATION);
  }
  return starts;
}

// ─── VTT generation ──────────────────────────────────────────

function generateVTT(): string {
  const sceneStarts = getSceneStartFrames();
  const cues: string[] = ["WEBVTT", ""];
  let cueIndex = 1;
  const minCueDuration = 1.5;

  for (let sceneIdx = 0; sceneIdx < NARRATION.length; sceneIdx++) {
    const scene = NARRATION[sceneIdx];
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

function generateChapters(): string {
  const sceneStarts = getSceneStartFrames();
  return sceneStarts
    .map((startFrame, i) => `${formatChapter(startFrame / FPS)} ${SCENE_TITLES[i]}`)
    .join("\n");
}

// ─── Description generation ──────────────────────────────────

function generateDescription(): string {
  const chapters = generateChapters();
  return `VAMOS — Episode 1: Foundation

Building a polyphonic synthesizer from scratch in C++20 with JUCE.
From an empty project to a working 8-voice polyphonic synth plugin —
phasor, PolyBLEP anti-aliasing, ADSR envelopes, voice allocation,
and JUCE plugin integration.

Chapters:
${chapters}

Source code: https://github.com/fdb/vamos

#synthesizer #cpp #dsp #juce #vst #audioplugin #musicproduction
`;
}

// ─── Thumbnail rendering ─────────────────────────────────────

function renderThumbnail(): void {
  console.log("Rendering thumbnail...");
  execSync(`npx remotion still Ep01-Thumbnail --output=${OUTPUT_DIR}/ep01-thumbnail.png`, {
    stdio: "inherit",
  });
}

// ─── Main ────────────────────────────────────────────────────

function main() {
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
  const allSegments = NARRATION.flatMap((scene) => scene.segments);
  const missing = allSegments.filter(
    (seg) => !existsSync(`${VOICEOVER_DIR}/${seg.id}.mp3`),
  );
  if (missing.length > 0) {
    console.error(`Missing voiceover files: ${missing.map((s) => s.id).join(", ")}`);
    console.error("Run: npx tsx generate-voiceover.ts");
    process.exit(1);
  }

  // Generate VTT subtitles
  console.log("Generating subtitles...");
  const vtt = generateVTT();
  writeFileSync(`${OUTPUT_DIR}/ep01.vtt`, vtt);
  console.log(`  Written: ${OUTPUT_DIR}/ep01.vtt`);

  // Generate YouTube description
  console.log("Generating description...");
  const description = generateDescription();
  writeFileSync(`${OUTPUT_DIR}/ep01-description.txt`, description);
  console.log(`  Written: ${OUTPUT_DIR}/ep01-description.txt`);

  // Render thumbnail
  renderThumbnail();
  console.log(`  Written: ${OUTPUT_DIR}/ep01-thumbnail.png`);

  // Summary
  console.log("\nYouTube upload artifacts ready:");
  console.log(`  ${OUTPUT_DIR}/ep01.vtt              — Subtitles`);
  console.log(`  ${OUTPUT_DIR}/ep01-description.txt  — Description with chapters`);
  console.log(`  ${OUTPUT_DIR}/ep01-thumbnail.png    — Thumbnail (1280x720)`);
}

main();
