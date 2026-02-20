// Narration text for Episode 2: Waveforms
// startFrame values computed from actual MP3 durations + 30-frame gap.

import type { SceneNarration } from "../types";

export const NARRATION: SceneNarration[] = [
  {
    sceneId: "01-intro",
    segments: [
      {
        id: "02-intro-0",
        text: "Last episode, we built a polyphonic synth from scratch — but it only plays one waveform: a sawtooth. This time, we expand the sound palette to seven waveform types, each with proper anti-aliasing and a Shape parameter that gives them extra tonal range.",
        startFrame: 0, // 15.93s = 478 frames
      },
      {
        id: "02-intro-1",
        text: "Some of these are straightforward — a sine wave is just a math function. But others are built in surprisingly clever ways. We'll look at three in detail: pulse width modulation, a triangle wave made from a square, and waveshaping with a tanh curve.",
        startFrame: 508, // 478 + 30 gap; dur=428f
      },
    ],
  },
  {
    sceneId: "02-gallery",
    segments: [
      {
        id: "02-gallery-0",
        text: "Here are all seven waveform types our oscillator can produce. Saw — the workhorse, rich in harmonics. Sine — pure, no overtones. Triangle — soft and mellow. Rectangle — hollow, like a clarinet. Pulse — thin and nasal. SharkTooth — an asymmetric triangle. And Saturated — a saw pushed through soft clipping for warmth and grit.",
        startFrame: 0, // 26.05s = 782 frames
      },
      {
        id: "02-gallery-1",
        text: "Every waveform with a discontinuity uses PolyBLEP anti-aliasing — the technique we covered last episode. The result: clean harmonics without the aliasing artifacts. Let's look at the three most interesting ones in detail.",
        startFrame: 812, // 782 + 30 gap; dur=424f
      },
    ],
  },
  {
    sceneId: "03-rectangle",
    segments: [
      {
        id: "02-rectangle-0",
        text: "A square wave has equal time high and low — a fifty percent duty cycle. But what if we make it asymmetric? The Shape parameter controls the pulse width, from fifty percent all the way to ninety-nine. As the width changes, the harmonic content shifts — this is pulse width modulation, a sound that's been a staple of analog synths for decades.",
        startFrame: 0, // 20.85s = 626 frames
      },
      {
        id: "02-rectangle-1",
        text: "The implementation is straightforward. Shape maps to pulse width — zero gives a square, one gives the thinnest sliver. PolyBLEP is applied at both edges: the rising edge at phase zero, and the falling edge at the pulse width position. Two corrections instead of one.",
        startFrame: 656, // 626 + 30 gap; dur=533f
      },
      {
        id: "02-rectangle-2",
        text: "The Pulse waveform is a variation — it starts with a much narrower width, from five to forty-five percent. Same technique, different range, different character: thin and nasal rather than hollow.",
        startFrame: 1219, // 656 + 533 + 30 gap; dur=378f
      },
    ],
  },
  {
    sceneId: "04-triangle",
    segments: [
      {
        id: "02-triangle-0",
        text: "A triangle wave looks smooth — no sharp jumps like a sawtooth. So you might think it doesn't need anti-aliasing. But look at its derivative — the derivative changes direction instantly at the peaks. Those slope discontinuities create aliasing too, just more subtle.",
        startFrame: 0, // 16.21s = 487 frames
      },
      {
        id: "02-triangle-1",
        text: "Here's the elegant fix: instead of building a triangle directly, we generate a PolyBLEP square wave — which we already know is clean — and then integrate it. Integration turns a square into a triangle, and since the square is already bandlimited, the triangle inherits that property. There's one catch: a pure integrator accumulates DC drift over time, so we use a leaky integrator — multiply by zero-point-nine-nine-nine each sample. The leak is tiny, but it keeps the waveform centered.",
        startFrame: 517, // 487 + 30 gap; dur=877f
      },
      {
        id: "02-triangle-2",
        text: "Two lines of code. Generate the square, integrate it with the leak. The four-times-d-t scaling keeps the amplitude normalized. Simple, but the insight — building one waveform from another — is a pattern that shows up everywhere in DSP.",
        startFrame: 1424, // 517 + 877 + 30 gap; dur=485f
      },
    ],
  },
  {
    sceneId: "05-saturated",
    segments: [
      {
        id: "02-saturated-0",
        text: "Waveshaping takes an existing waveform and pushes it through a transfer function — a curve that reshapes the signal. For our saturated waveform, that curve is hyperbolic tangent — tanh. It's an S-shaped curve that gently squashes extreme values. Feed in a saw wave, and the peaks get softened while the middle stays mostly linear. The result: new harmonics and a warmer, grittier tone.",
        startFrame: 0, // 23.78s = 714 frames
      },
      {
        id: "02-saturated-1",
        text: "The Shape parameter controls drive — how hard we push the signal into the tanh curve. At one-point-five-x, it's subtle warmth. At six-x, the wave is almost a square. More drive means more harmonics.",
        startFrame: 744, // 714 + 30 gap; dur=402f
      },
      {
        id: "02-saturated-2",
        text: "Three lines. Calculate the drive from Shape, generate a PolyBLEP saw, feed it through tanh. The anti-aliasing happens before the waveshaping — we start clean, then add character.",
        startFrame: 1176, // 744 + 402 + 30 gap; dur=385f
      },
    ],
  },
  {
    sceneId: "06-shape",
    segments: [
      {
        id: "02-shape-0",
        text: "Every waveform responds to the Shape parameter differently. On a saw, it rounds the corners toward a triangle. On a rectangle, it widens the pulse. On SharkTooth, it shifts the peak from left to right. And on saturated, it drives the signal harder into the tanh curve. One parameter, completely different behavior depending on context.",
        startFrame: 0, // 18.85s = 566 frames
      },
      {
        id: "02-shape-1",
        text: "This is how a synthesizer gets expressive range from a small number of controls. Shape isn't just a toggle — it's a continuous spectrum of timbres. And because each waveform interprets it differently, switching waveform types while Shape stays fixed gives you a completely different sound.",
        startFrame: 596, // 566 + 30 gap; dur=464f
      },
    ],
  },
  {
    sceneId: "07-outro",
    segments: [
      {
        id: "02-outro-0",
        text: "Seven waveforms, each anti-aliased, each with Shape control. From classic rectangles and triangles to waveshaped saturated tones — our oscillator now covers serious tonal ground. Next episode, we add a second oscillator with transpose and detune, a noise generator for texture, and a mixer to blend them all together. See you in Episode 3.",
        startFrame: 0, // 19.97s = 600 frames
      },
    ],
  },
];

/** Flat list of all narration segment IDs */
export const ALL_SEGMENT_IDS = NARRATION.flatMap((s) =>
  s.segments.map((seg) => seg.id),
);
