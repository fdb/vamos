# Vamos Video Series

Episodic video content about building the Vamos synthesizer, produced programmatically with [Remotion](https://www.remotion.dev/) — a React framework for making videos with code.

Each episode covers a development phase of the synth. The target audience is synth enthusiasts who know some programming but aren't deep into DSP or audio coding.

## Quick start

```bash
cd video
npm install
npx remotion studio          # Preview in browser
```

## Episodes

| Episode | Title | Composition ID |
|---------|-------|----------------|
| 1 | Foundation | `Ep01-Foundation` |

## How it works

Everything in the video — narration text, scene timing, visual animations, subtitles, chapter markers — is derived from structured data in code. There's no timeline editor. The pipeline looks like this:

```
narration.ts          (what to say)
    ↓
generate-voiceover.ts (ElevenLabs TTS → MP3 files)
    ↓
timing.ts             (audio durations → frame-accurate timing)
    ↓
scenes/*.tsx          (Remotion components: animated code, diagrams, visualizations)
    ↓
remotion render       (→ MP4)
    ↓
prepare-youtube-video.ts  (→ VTT subtitles, description with chapters, thumbnail)
```

### Narration and voiceover

Narration lives in `src/epNN/narration.ts` as plain text segments. Each segment has an `id`, `text`, and `startFrame` (its position within the scene).

The `generate-voiceover.ts` script sends this text to ElevenLabs TTS and saves MP3 files to `public/voiceover/`. It skips files that already exist — delete an MP3 to regenerate it.

```bash
# Requires ELEVENLABS_API_KEY in .env
npx tsx generate-voiceover.ts
```

### Pronunciation of technical terms

The narration text uses **canonical spelling** ("JUCE", "APVTS", "PolyBLEP") because it doubles as the subtitle source. Pronunciation corrections are applied only when sending text to ElevenLabs, via a `PRONUNCIATION_MAP` in `generate-voiceover.ts`:

```typescript
const PRONUNCIATION_MAP: Record<string, string> = {
  JUCE: "Juice",
  GUI: "gooey",
  DAW: "daugh",
  APVTS: "A P V T S",
  ADSR: "A D S R",
  MIDI: "middy",
  VST3: "V S T 3",
  PolyBLEP: "Poly Blep",
};
```

This separation keeps the narration files clean for subtitles while getting correct spoken pronunciation. Numbers and symbols are spelled out directly in the narration text since both TTS and subtitles benefit from that: "one-point-two" not "1.2", "C++ twenty" not "C++20".

Why not ElevenLabs Pronunciation Dictionaries? The phoneme-based dictionaries (IPA/CMU) only work with certain models. We use `eleven_multilingual_v2`, where text replacement is more reliable.

### Audio-driven timing

Scene durations aren't chosen arbitrarily — they're computed from actual voiceover audio lengths:

1. Generate the MP3s
2. Measure each file's duration with `ffprobe`
3. Calculate `startFrame` values: each segment starts after the previous segment's audio ends plus a 30-frame (1 second) breathing gap
4. Scene duration = last segment's start + its audio length + a buffer

This is documented in detail in [WORKFLOW.md](WORKFLOW.md), Steps 4-5.

### Visual components

Scenes are React components in `src/epNN/scenes/`. All animation uses Remotion's `useCurrentFrame()` + `interpolate()` — never CSS transitions. Shared components in `src/components/`:

| Component | Purpose |
|-----------|---------|
| `CodeBlock` | Typewriter-animated code with syntax highlighting and line markers |
| `WaveformVisualizer` | Real-time waveform rendering (saw, sine, square, etc.) |
| `SpectrumVisualizer` | Frequency spectrum display for before/after comparisons |
| `ADSRVisualizer` | Animated ADSR envelope diagram |
| `SignalFlowDiagram` | Signal chain block diagram with animated connections |
| `VoiceGrid` | 8-voice polyphony visualization with note assignments |
| `KeyPoint` | Staggered bullet points with spring animations |
| `NeonBox` | Callout boxes for formulas and key concepts |
| `Badge` | Animated tech labels (C++20, JUCE 8, VST3) |
| `SceneContainer` | Base layout with scanline overlay and progress bar |
| `SceneNarration` | Wires voiceover audio segments to Remotion's timeline |

### Rendering and YouTube preparation

```bash
# Render the full episode
npx remotion render Ep01-Foundation --output=out/ep01.mp4

# Generate YouTube upload artifacts
npm run prepare-youtube
```

`prepare-youtube` reads the narration and timing data to produce:

- **`out/ep01.vtt`** — WebVTT subtitles, split at sentence boundaries, timed to audio
- **`out/ep01-description.txt`** — YouTube description with chapter timestamps
- **`out/ep01-thumbnail.png`** — 1280x720 thumbnail rendered as a Remotion Still

The subtitle generator uses `ffprobe` to get exact audio durations, splits narration into sentences, and distributes time proportionally by character count. Technical terms appear with correct spelling (not TTS phonetics) since the narration text is the canonical source.

## Project structure

```
video/
├── generate-voiceover.ts     # ElevenLabs TTS script
├── prepare-youtube-video.ts  # VTT, description, thumbnail generator
├── WORKFLOW.md               # Full 9-step episode production workflow
├── src/
│   ├── Root.tsx              # Registers all compositions
│   ├── types.ts              # Shared types (NarrationSegment, SceneNarration)
│   ├── lib/                  # Colors, fonts, timing constants, syntax highlighting
│   ├── components/           # Shared visual components
│   └── ep01/                 # Episode 1
│       ├── Video.tsx         # TransitionSeries assembling scenes
│       ├── Thumbnail.tsx     # Static thumbnail for YouTube
│       ├── timing.ts         # Scene durations and transition config
│       ├── narration.ts      # Narration text with frame-accurate timing
│       ├── code-snippets.ts  # C++ code shown in the video
│       └── scenes/           # One React component per scene
└── public/
    └── voiceover/            # Generated MP3 files (gitignored)
```

## Making a new episode

See [WORKFLOW.md](WORKFLOW.md) for the full 9-step production process, from rough outline to YouTube upload.
