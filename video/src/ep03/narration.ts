// Narration text for Episode 3: Noise, Mixer & Oscillator 2
// startFrame values are estimated (~4 frames/word) until TTS audio is generated.

import type { SceneNarration } from "../types";

export const NARRATION: SceneNarration[] = [
  {
    sceneId: "01-intro",
    segments: [
      {
        id: "03-intro-0",
        text: "Last episode, we built seven anti-aliased waveforms with Shape control. Now we complete the sound source architecture: a second oscillator with transpose and detune, white and pink noise for texture, and a mixer to blend all three together.",
        startFrame: 0, // 14.7s → 440 frames
      },
      {
        id: "03-intro-1",
        text: "These are simpler than the waveform math — shorter code, fewer edge cases. But they're what makes a synth sound like a real instrument instead of a test tone. Let's build them.",
        startFrame: 455, // 440 + 15 gap; 12.3s → 368 frames
      },
    ],
  },
  {
    sceneId: "02-osc2",
    segments: [
      {
        id: "03-osc2-0",
        text: "Oscillator 2 reuses the same Oscillator class, but limited to five waveform types. The real power is Transpose and Detune. Transpose shifts by semitones — the default is minus twelve, one octave down. Layer that with Oscillator 1 and you get a thick, rich sound instantly.",
        startFrame: 0, // 17.7s → 531 frames
      },
      {
        id: "03-osc2-1",
        text: "Detune shifts by cents — hundredths of a semitone. Even a few cents of detune creates a chorus effect: two nearly identical frequencies beating against each other. The slight drift in and out of phase is what makes analog synths sound so alive.",
        startFrame: 546, // 531 + 15 gap; 15.5s → 464 frames
      },
      {
        id: "03-osc2-2",
        text: "The code is three lines. Convert the MIDI note to a frequency with the semitone offset, then multiply by the detune ratio — two to the power of cents over twelve hundred. That's the equal temperament formula: every twelve hundred cents is one octave.",
        startFrame: 1025, // 546 + 464 + 15 gap; 14.7s → 442 frames
      },
    ],
  },
  {
    sceneId: "03-noise",
    segments: [
      {
        id: "03-noise-0",
        text: "Noise adds texture — breath, grit, percussion. White noise has equal energy at every frequency. Our generator uses xorshift32 — a pseudorandom number generator that's just three bitwise operations: shift left, shift right, shift left. Fast, stateless, and good enough for audio.",
        startFrame: 0, // 19.3s → 578 frames
      },
      {
        id: "03-noise-1",
        text: "Pink noise rolls off at higher frequencies — equal energy per octave instead of per frequency. It sounds more natural, like wind or ocean waves. We use Paul Kellet's algorithm: feed white noise through six cascaded IIR filters, each tuned to roll off the highs by three dB per octave.",
        startFrame: 593, // 578 + 15 gap; 18.5s → 554 frames
      },
      {
        id: "03-noise-2",
        text: "The xorshift generator is three lines. The pink filter is six coefficient lines — those magic numbers are Paul Kellet's carefully tuned filter coefficients. They've been used in synthesizers for decades because they just work.",
        startFrame: 1162, // 593 + 554 + 15 gap; 14.1s → 424 frames
      },
    ],
  },
  {
    sceneId: "04-mixer",
    segments: [
      {
        id: "03-mixer-0",
        text: "The mixer blends all three sources — each with its own gain and on-off switch. Gain goes up to two-x, so you can overdrive the mixer into the filter for extra harmonics. Nothing fancy — it literally just multiplies and adds.",
        startFrame: 0, // 13.0s → 391 frames
      },
      {
        id: "03-mixer-1",
        text: "One line per source: generate the sample, multiply by gain if enabled, sum them up, and pass to the filter. The simplicity is the point — the mixer is transparent. Coloring the sound is the filter's job, and that's next episode.",
        startFrame: 406, // 391 + 15 gap; 12.6s → 378 frames
      },
    ],
  },
  {
    sceneId: "05-outro",
    segments: [
      {
        id: "03-outro-0",
        text: "That's Episode 3 — a second oscillator with transpose and detune, white and pink noise generators, and a mixer to blend them all. Next episode: the filter. Eight filter types including the Sallen-Key MS-20, state variable filter, and a vowel filter. See you in Episode 4.",
        startFrame: 0, // 16.2s → 486 frames
      },
    ],
  },
];

/** Flat list of all narration segment IDs */
export const ALL_SEGMENT_IDS = NARRATION.flatMap((s) =>
  s.segments.map((seg) => seg.id),
);
