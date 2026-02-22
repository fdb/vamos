// Narration text for Episode 4: The Filter
// startFrame values computed from actual TTS audio durations.

import type { SceneNarration } from "../types";

export const NARRATION: SceneNarration[] = [
  {
    sceneId: "01-intro",
    segments: [
      {
        id: "04-intro-0",
        text: "Last episode, we built three sound sources and a mixer to blend them. Now comes the filter — the heart of subtractive synthesis. Instead of building complex sounds from scratch, you start with something harmonically rich and sculpt it by removing frequencies. Like carving a statue from a block of marble.",
        startFrame: 0, // 17.2s → 517 frames
      },
      {
        id: "04-intro-1",
        text: "Vamos has eight filter types — from a warm analog model inspired by the Korg MS-20, to a vowel filter that makes the synth talk. Let's see how they work.",
        startFrame: 532, // 517 + 15 gap; 10.0s → 300 frames
      },
    ],
  },
  {
    sceneId: "02-sallenkey",
    segments: [
      {
        id: "04-sallen-0",
        text: "The default filter is a Sallen-Key topology, inspired by the Korg MS-20 from nineteen seventy-eight. Two controls: cutoff and resonance. Cutoff sets where harmonics get removed — sweep it down and the sound gets darker. Resonance boosts the frequencies right at the cutoff, creating a sharp peak.",
        startFrame: 0, // 19.3s → 580 frames
      },
      {
        id: "04-sallen-1",
        text: "At high resonance, the filter feeds its output back into its input. Without limits, that feedback would grow to infinity. The MS-20 uses tanh — a function that gently squashes everything into the range minus one to plus one. Instead of blowing up, the filter screams. That controlled distortion is the MS-20's signature.",
        startFrame: 595, // 580 + 15 gap; 18.9s → 569 frames
      },
      {
        id: "04-sallen-2",
        text: "The code is compact. Compute the filter coefficient from the cutoff frequency, set damping from resonance, then update two state variables — the filter's memory. Apply tanh to the feedback path — that's the one line that gives it character. The twelve-dB version is one stage. For twenty-four dB, cascade two stages: output of the first into the second. Double the slope.",
        startFrame: 1179, // 595 + 569 + 15 gap; 23.3s → 698 frames
      },
    ],
  },
  {
    sceneId: "03-gallery",
    segments: [
      {
        id: "04-gallery-0",
        text: "The state variable filter takes a different approach — one structure, three simultaneous outputs: low-pass, high-pass, and band-pass. We use the Cytomic topology, which stays numerically stable even at extreme settings. Clean and precise where the Sallen-Key is warm and gritty.",
        startFrame: 0, // 18.2s → 545 frames
      },
      {
        id: "04-gallery-1",
        text: "The four creative filters go beyond traditional filtering. The comb filter uses a delay line — sound bounces back and forth, creating metallic, resonant harmonics. The vowel filter runs three parallel bandpass filters at formant frequencies, morphing between five vowel sounds. The DJ filter sweeps — low-pass below center, high-pass above. And the resampling filter holds each sample value, creating the crunchy sound of early digital samplers.",
        startFrame: 560, // 545 + 15 gap; 28.7s → 861 frames
      },
      {
        id: "04-gallery-2",
        text: "The vowel formants are just a table — five sets of three frequencies that define each vowel sound. The cutoff knob interpolates between them, smoothly morphing from ah to ee. The resampling filter is even simpler: a counter and a held value. When the counter hits the threshold, grab a new sample. Otherwise, repeat the last one.",
        startFrame: 1436, // 560 + 861 + 15 gap; 20.5s → 616 frames
      },
    ],
  },
  {
    sceneId: "04-routing",
    segments: [
      {
        id: "04-routing-0",
        text: "Each sound source has a Through switch — it routes the source either through the filter or around it. Filter a bright saw while keeping a clean sub underneath. Keyboard tracking shifts the cutoff with the note you play — higher notes sound brighter, lower notes darker, matching how acoustic instruments naturally behave.",
        startFrame: 0, // 18.3s → 551 frames
      },
      {
        id: "04-routing-1",
        text: "The routing code splits each source into filtered and bypassed paths, applies the selected filter type, then sums everything back. A secondary high-pass runs after the main filter — at ten hertz it's inaudible, but raise it and you thin out the bass. The whole thing is just multiplies, adds, and a switch statement.",
        startFrame: 566, // 551 + 15 gap; 17.7s → 533 frames
      },
    ],
  },
  {
    sceneId: "05-outro",
    segments: [
      {
        id: "04-outro-0",
        text: "That's Episode 4 — eight filter types from the screaming Sallen-Key MS-20 to a vowel filter that makes the synth talk, plus per-source routing for mixing filtered and clean sounds. Next episode: modulators. An LFO, a cycling envelope, and a modulation matrix that brings everything to life with movement. See you in Episode 5.",
        startFrame: 0, // 19.3s → 579 frames
      },
    ],
  },
];

/** Flat list of all narration segment IDs */
export const ALL_SEGMENT_IDS = NARRATION.flatMap((s) =>
  s.segments.map((seg) => seg.id),
);
