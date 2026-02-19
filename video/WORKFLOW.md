# Video Episode Production Workflow

Step-by-step process for producing an episode of the Vamos video series.

## Audience

Synth enthusiasts who know some programming but are not well-versed in DSP or audio coding. Assume familiarity with basic music production concepts (oscillators, filters, envelopes) but not with their implementation details.

## Step 1: Rough Structure

Decide what the episode covers and how to explain it.

- What development phase / features does this episode cover?
- What are the key concepts the audience needs to understand?
- What's the best order to present them? (Usually: motivation/problem first, then solution, then code)
- What visualizations would make each concept click? (Waveform animations, signal flow diagrams, before/after comparisons, voice allocation grids, etc.)

Output: a bullet-point outline of topics and visualization ideas.

## Step 2: Fine-Grained Scene + Section Plan

Break the outline into concrete scenes, each with timed sections.

- Each **scene** covers one major topic (e.g., "The Phasor", "ADSR Envelope")
- Each scene has 2-4 **sections** that show different visual content sequentially
- Plan one narration segment per section
- Keep sections focused: one concept per section, one visualization per section

Output: a table like:

| Scene | Section | Visual Content | Narration Summary |
|-------|---------|---------------|-------------------|
| 03-Phasor | Phase ramp | Animated 0-1 ramp + formula box | What a phasor is, how increment works |
| 03-Phasor | Code | Typewriter code walkthrough | How the code implements it |
| 03-Phasor | Waveforms | Side-by-side saw + sine from phasor | Deriving waveforms from the phasor |

## Step 3: Write Narration Transcript

Write the full narration text for each section.

- Conversational but precise tone
- Refer to visuals: "Watch as the grid fills up", "Here's the signal flow we're building"
- Spell out numbers and symbols for TTS: "one-point-two" not "1.2", "C++ twenty" not "C++20"
- Each segment: 10-20 seconds of speech (25-50 words)
- Store in `src/lib/narration.ts` with placeholder `startFrame` values

## Step 4: Generate Voiceover Audio

Run the ElevenLabs TTS generation script:

```bash
# Requires ELEVENLABS_API_KEY in video/.env
npx tsx generate-voiceover.ts
```

This reads narration segments from `src/lib/narration.ts` and generates MP3 files in `public/voiceover/`. The script skips files that already exist, so it's safe to re-run after adding new segments.

Voice settings (in `generate-voiceover.ts`):
- Model: `eleven_multilingual_v2`
- Voice: configurable via `VOICE_ID` constant
- Output: MP3 files named `{sceneId}-{segmentIndex}.mp3`

## Step 5: Measure Audio and Set Timing

Check the actual duration of each generated audio file:

```bash
for f in public/voiceover/*.mp3; do
  duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")
  echo "$(basename "$f"): ${duration}s"
done
```

Convert durations to frames (multiply by 30 for 30fps) and calculate timing:

- `startFrame[0]` = 0
- `startFrame[N]` = `startFrame[N-1]` + `ceil(audioDuration[N-1] * 30)` + 30 (gap)
- `sceneDuration` = `startFrame[last]` + `ceil(audioDuration[last] * 30)` + 30 (buffer)

Update `src/lib/narration.ts` with computed `startFrame` values.
Update `src/lib/timing.ts` `SCENE_DURATIONS` with computed scene durations.

## Step 6: Build Scenes in Remotion

For each scene, create a React component in `src/scenes/`:

- Use `<Sequence from={startFrame} durationInFrames={sectionDuration}>` for each section
- Visual sections must be **non-overlapping** (each ends exactly where the next begins)
- Title/header Sequence can span the full scene (positioned at top, doesn't overlap content below)
- Use `<SceneNarration segments={NARRATION[sceneIndex].segments} />` to wire audio

### Visualization Guidelines

- **Code walkthroughs**: Use `<CodeBlock>` with typewriter mode and highlighted lines
- **Animated diagrams**: `<SignalFlowDiagram>`, `<WaveformVisualizer>`, `<ADSRVisualizer>`, `<VoiceGrid>`
- **Key points**: `<KeyPoint>` bullets with staggered `delay` props
- **Callout boxes**: `<NeonBox>` for formulas, important concepts
- **Badges**: `<Badge>` for tech labels (C++20, JUCE 8, VST3, etc.)
- **Before/after comparisons**: Side-by-side visualizations

### Animation Rules

- All animations via `useCurrentFrame()` + `interpolate()` — never CSS transitions
- Spring configs: `SPRING_SMOOTH` (damping: 200) for titles, `SPRING_BOUNCY` (damping: 12) for diagram blocks
- All `<Sequence>` components get `premountFor={30}` to prevent stuttering
- Frame offsets in animations must match their parent Sequence's `from` value

## Step 7: Preview and Iterate

```bash
npx remotion studio
```

Scrub through each scene in Remotion Studio:
- Verify narration audio doesn't overlap between sections
- Verify visual content switches cleanly at section boundaries
- Verify animations are readable at playback speed
- Verify code is on screen long enough to read

## Step 8: Render

```bash
npx remotion render Video --output=out/episode.mp4
```

Verify: correct duration, 1920x1080, audio and visuals in sync.
