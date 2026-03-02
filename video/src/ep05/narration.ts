// Narration text for Episode 5: Modulators
// startFrame values are placeholders — updated after TTS generation.

import type { SceneNarration } from "../types";

export const NARRATION: SceneNarration[] = [
  {
    sceneId: "01-intro",
    segments: [
      {
        id: "05-intro-0",
        text: "Last episode, we sculpted sound with filters. Everything so far has been static — set a cutoff, set a pitch, and it stays there. Now comes movement. Modulators are automatic hands on the knobs, turning them while you play.",
        startFrame: 0,
      },
      {
        id: "05-intro-1",
        text: "Vamos has three modulation tools: an LFO for rhythmic motion, a cycling envelope for repeating sweeps, and a mod matrix that routes them anywhere. Let's start with the LFO.",
        startFrame: 482,
      },
    ],
  },
  {
    sceneId: "02-lfo",
    segments: [
      {
        id: "05-lfo-0",
        text: "An LFO is just a slow oscillator — same math as the audio oscillators, but running at sub-audio frequencies. Sine for smooth vibrato, triangle for a sharper wobble, saw for rising sweeps, square for a rhythmic trill.",
        startFrame: 0,
      },
      {
        id: "05-lfo-1",
        text: "The interesting shapes are Sample and Hold and Wander. Sample and Hold grabs a new random value each cycle — classic sci-fi bleep sounds. Wander is subtler: it runs random noise through a low-pass filter, so it drifts unpredictably. The filter's cutoff scales with the LFO rate — slow rate means very smooth drift, fast rate means jittery chaos.",
        startFrame: 412,
      },
      {
        id: "05-lfo-2",
        text: "The code is a switch over eight shapes. Most are one-liners: sine is sin of two pi phase, saw is two phase minus one. Wander is the exception — it uses exponential smoothing to filter random noise. Amount scales the output, retrigger resets the phase on each new note.",
        startFrame: 1061,
      },
    ],
  },
  {
    sceneId: "03-cyclingenv",
    segments: [
      {
        id: "05-cycenv-0",
        text: "The cycling envelope is a looping modulator with one brilliant parameter: MidPoint. It controls the asymmetry between rise and fall. At zero, the envelope snaps up instantly and falls slowly — like a plucked string. At one, it rises slowly and drops instantly — like a swell that cuts off. At point five, rise and fall are symmetric.",
        startFrame: 0,
      },
      {
        id: "05-cycenv-1",
        text: "Three phases: rise, hold, fall. The MidPoint parameter sets where rise ends. Hold keeps the envelope at its peak for a fraction of the cycle. Fall takes whatever time is left. The whole thing is under thirty lines — just a phasor and three if-statements. Vamos can switch between this and a standard ADSR for the second envelope slot.",
        startFrame: 683,
      },
    ],
  },
  {
    sceneId: "04-modmatrix",
    segments: [
      {
        id: "05-modmatrix-0",
        text: "Every sample, the voice gathers the current value of eight modulation sources into a struct called ModContext — envelope levels, LFO output, velocity, keyboard position. Think of it as a snapshot of the synth's state, taken forty-four thousand times per second.",
        startFrame: 0,
      },
      {
        id: "05-modmatrix-1",
        text: "The mod matrix routes these values to destinations. Filter cutoff has two dedicated mod slots — by default, the cycling envelope drives it with eighty percent depth. Pitch and oscillator shape have their own slots too. Then three general-purpose slots let you route any source to any of twelve targets.",
        startFrame: 549,
      },
      {
        id: "05-modmatrix-2",
        text: "Resolving a target is just a loop: for each slot pointing at this target, multiply the source value by its amount and sum them up. Pitch and filter use exponential scaling because musical intervals are logarithmic. Gains and resonance are linear. You can even modulate the LFO's own rate — that's meta-modulation, where the modulator modulates itself.",
        startFrame: 1140,
      },
    ],
  },
  {
    sceneId: "05-outro",
    segments: [
      {
        id: "05-outro-0",
        text: "That's Episode 5 — an LFO with eight shapes from smooth sine to drifting wander, a cycling envelope with MidPoint asymmetry, and a mod matrix routing eight sources to twelve targets. Next episode: voice architecture. Poly, mono, stereo, unison — four ways to allocate eight voices, plus glide and portamento. See you in Episode 6.",
        startFrame: 0,
      },
    ],
  },
];

/** Flat list of all narration segment IDs */
export const ALL_SEGMENT_IDS = NARRATION.flatMap((s) =>
  s.segments.map((seg) => seg.id),
);
