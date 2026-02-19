# Video Episode Production Workflow

Step-by-step process for producing an episode of the Vamos video series.

## Audience

Synth enthusiasts who know some programming but are not well-versed in DSP or audio coding. Assume familiarity with basic music production concepts (oscillators, filters, envelopes) but not with their implementation details.

## Tone & Content Guidelines

These apply to all episodes and should be followed when writing narration and designing visuals.

### Balance: Entertaining + Useful

- Don't explain every line of code. Focus on the interesting bits that aren't intuitive (e.g., PolyBLEP anti-aliasing, the envelope overshoot trick).
- When something IS simple, celebrate that: "the mixer literally just adds the signals together" is more valuable than a long explanation.
- Use the "problem → solution" structure sparingly (max once per episode) to highlight where naive approaches break down and real-world solutions are needed.

### Tone: European Neutral, Not Commercial

- Avoid sales-pitch language. Don't "sell" the approach — explain it.
  - BAD: "No git submodules, no manual downloads. One command and you're ready."
  - GOOD: "This avoids the complexity of managing git submodules or downloading frameworks by hand."
- Avoid overly American enthusiasm. Keep it warm but understated, with a subtle streak of humor.
  - BAD: "That's it — one voice, one note, one clean signal path."
  - GOOD: "Nothing fancy — the mixer literally just adds the signals together."
- Don't use cliffhanger phrasing like "But wait..." or hard sales closes.

### Explaining Concepts

- **Don't assume knowledge of frameworks.** Explain what JUCE is and what it provides on first mention. Same for any tool or library.
- **Simplify mathematical language.** The audience isn't reading a DSP textbook. Use metaphors and plain language.
  - BAD: "subtracting a polynomial residual near the transition"
  - GOOD: "like sanding down a sharp corner"
- **"Computational cost" not just "cost."** When discussing performance, be specific — CPU cost, memory, processing time.
- **Preview future episodes** where useful. "We'll add modulation and more complex routing in a later episode, but for now, simplicity is the point." This helps viewers understand why we simplify.

### TTS Pronunciation

The narration text in `narration.ts` should use the **canonical spelling** of all terms (e.g., "JUCE", "GUI", "APVTS"). This text doubles as subtitle source and should read naturally.

Pronunciation corrections for TTS are handled separately by the `generate-voiceover.ts` script, which applies a `PRONUNCIATION_MAP` before sending text to ElevenLabs. This keeps the narration files clean while ensuring correct pronunciation.

**To add a new pronunciation:** edit the `PRONUNCIATION_MAP` in `generate-voiceover.ts`:

```typescript
const PRONUNCIATION_MAP: Record<string, string> = {
  JUCE: "Juice",        // framework name
  GUI: "gooey",         // graphical user interface
  APVTS: "A P V T S",   // spell out acronym
  ADSR: "A D S R",      // spell out acronym
  MIDI: "middy",        // standard pronunciation
  VST3: "V S T 3",      // spell out
  PolyBLEP: "Poly Blep", // algorithm name
  // ...add new terms here
};
```

**Why not ElevenLabs Pronunciation Dictionaries?** The phoneme-based dictionaries (IPA/CMU in PLS files) only work with `eleven_flash_v2` / `eleven_turbo_v2` / `eleven_monolingual_v1`. We use `eleven_multilingual_v2`, so text replacement is the reliable approach.

**Numbers and symbols** should still be spelled out directly in the narration text, since both TTS and subtitles benefit from the readable form:
- "one-point-two" not "1.2", "C++ twenty" not "C++20"
- "two to the power of one-twelfth" not "2^(1/12)"

### Scene Transitions

- Between major topics, add a brief bridging narration segment that wraps up what was just covered and motivates what's coming next.
- Don't jump abruptly from one DSP concept to another — give the viewer a moment to absorb.

### Scene Openings

When a new scene begins, the viewer should understand what they're building toward — give them the destination before the journey. This framing can happen in one of two places, and varying between them keeps the pacing interesting:

- **At the end of the previous scene:** A bridging sentence that wraps up and motivates the next topic (e.g., "a tone that drones forever isn't musical — we need envelopes"). When the previous scene already does this, the new scene can open directly with content.
- **At the start of the new scene:** A brief goal statement before diving into the mechanism (e.g., "By the end of this section, we'll have a working eight-voice synth"). Use this when the previous scene didn't set up the transition.

Don't do both — if the previous scene's ending already frames the destination, the new scene can open differently (with a definition, an example, or straight into the concept). Variety is good. Keep goal framing to one or two sentences — don't over-explain the roadmap.

### Wrap-Up Structure

- End each episode with a recap of what was built, then preview the next episode's content.
- Be specific about what's coming: "seven waveform types with anti-aliasing, plus a noise generator" is better than "more sound features."

## Episode File Structure

Each episode lives in its own directory under `src/`:

```
video/src/
├── components/          # Shared visual components
├── lib/                 # Shared utilities (colors, fonts, timing constants)
├── ep01/                # Episode 1
│   ├── Video.tsx        # TransitionSeries assembling scenes
│   ├── timing.ts        # Scene durations, transition duration, total
│   ├── narration.ts     # Narration text + startFrame values
│   ├── code-snippets.ts # C++ code strings shown in video
│   └── scenes/          # One file per scene
├── ep02/                # Episode 2 (same structure)
├── Root.tsx             # Registers all episode compositions
├── types.ts             # Shared types (NarrationSegment, SceneNarration)
└── index.ts             # Remotion entry point
```

## Step 1: Rough Structure

Decide what the episode covers and how to explain it.

- What development phase / features does this episode cover?
- What are the key concepts the audience needs to understand?
- What's the best order to present them? (Usually: motivation/problem first, then solution, then code)
- What visualizations would make each concept click? (Waveform animations, signal flow diagrams, before/after comparisons, voice allocation grids, etc.)
- Where do you need transitional sections between topics?

Output: a bullet-point outline of topics and visualization ideas.

## Step 2: Fine-Grained Scene + Section Plan

Break the outline into concrete scenes, each with timed sections.

- Each **scene** covers one major topic (e.g., "The Phasor", "ADSR Envelope")
- Each scene has 2-4 **sections** that show different visual content sequentially
- Plan one narration segment per section
- Keep sections focused: one concept per section, one visualization per section
- Include transitional segments at topic boundaries

Output: a table like:

| Scene | Section | Visual Content | Narration Summary |
|-------|---------|---------------|-------------------|
| 03-Phasor | Phase ramp | Animated 0-1 ramp + formula box | What a phasor is, how increment works |
| 03-Phasor | Code | Typewriter code walkthrough | How the code implements it |
| 03-Phasor | Waveforms | Side-by-side saw + sine from phasor | Deriving waveforms from the phasor |

## Step 3: Write Narration Transcript

Write the full narration text for each section.

- Conversational but precise tone — follow the Tone & Content Guidelines above
- Refer to visuals: "Watch as the grid fills up", "Here's the signal flow we're building"
- Spell out numbers and symbols for TTS (see pronunciation notes above)
- Each segment: 10-20 seconds of speech (25-50 words)
- Store in `src/epNN/narration.ts` with placeholder `startFrame` values (0 for all initially)

## Step 4: Generate Voiceover Audio

Run the ElevenLabs TTS generation script:

```bash
# Requires ELEVENLABS_API_KEY in video/.env
cd video && npx tsx generate-voiceover.ts
```

This reads narration segments from the episode's `narration.ts` and generates MP3 files in `public/voiceover/`. The script skips files that already exist — to regenerate changed segments, delete their MP3 files first.

Voice settings (in `generate-voiceover.ts`):
- Model: `eleven_multilingual_v2`
- Voice: configurable via `VOICE_ID` constant
- Output: MP3 files named `{segmentId}.mp3`

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

Update `src/epNN/narration.ts` with computed `startFrame` values.
Update `src/epNN/timing.ts` `SCENE_DURATIONS` with computed scene durations.

## Step 6: Build Scenes in Remotion

For each scene, create a React component in `src/epNN/scenes/`:

- Use `<Sequence from={startFrame} durationInFrames={sectionDuration}>` for each section
- Visual sections must be **non-overlapping** (each ends exactly where the next begins)
- Title/header Sequence can span the full scene (positioned at top, doesn't overlap content below)
- Use `<SceneNarration segments={NARRATION[sceneIndex].segments} />` to wire audio

### Visualization Guidelines

- **Show, don't tell.** If a concept can be visualized, visualize it — even if it needs a custom component. A spectrum showing aliased energy above the Nyquist line makes the abstract concept concrete in a way that narration alone cannot. Visuals and narration should reinforce each other: the viewer sees what they're hearing about.
- **Time visual reveals to the narration.** A visualization is most effective when it appears at the exact moment the narration references it. If it comes too early, the viewer is processing visuals and audio about different things simultaneously. Calculate the `delay` prop so the visual lands on the relevant phrase, not at the start of the segment.
- **Code walkthroughs**: Use `<CodeBlock>` with typewriter mode and highlighted lines
- **Animated diagrams**: `<SignalFlowDiagram>`, `<WaveformVisualizer>`, `<ADSRVisualizer>`, `<VoiceGrid>`, `<SpectrumVisualizer>`
- **Key points**: `<KeyPoint>` bullets with staggered `delay` props
- **Callout boxes**: `<NeonBox>` for formulas, important concepts
- **Badges**: `<Badge>` for tech labels (C++20, JUCE 8, VST3, etc.)
- **Before/after comparisons**: Side-by-side visualizations with spectrum views where relevant

### Animation Rules

- All animations via `useCurrentFrame()` + `interpolate()` — never CSS transitions
- Spring configs: `SPRING_SMOOTH` (damping: 200) for titles, `SPRING_BOUNCY` (damping: 12) for diagram blocks
- All `<Sequence>` components get `premountFor={30}` to prevent stuttering
- Frame offsets in animations must match their parent Sequence's `from` value

## Step 7: Preview and Iterate

```bash
cd video && npx remotion studio
```

Scrub through each scene in Remotion Studio:
- Verify narration audio doesn't overlap between sections
- Verify visual content switches cleanly at section boundaries
- Verify animations are readable at playback speed
- Verify code is on screen long enough to read
- Verify before/after comparisons actually show a visible difference

## Step 8: Render

```bash
cd video && npx remotion render Ep01-Foundation --output=out/ep01.mp4
```

Verify: correct duration, 1920x1080, audio and visuals in sync.

## Step 9: Prepare for YouTube

```bash
npm run prepare-youtube
```

Generates `out/ep01.vtt` (subtitles), `out/ep01-description.txt` (title, description, chapters),
and `out/ep01-thumbnail.png` (1280x720 thumbnail).
