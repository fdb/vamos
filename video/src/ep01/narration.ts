// Narration text for each scene segment.
// Each scene has multiple segments that align with visual Sequences.
// startFrame values are audio-driven: each segment starts after the previous
// segment's audio ends + 30-frame gap (1s breathing room at 30fps).

import type { SceneNarration } from "../types";

export const NARRATION: SceneNarration[] = [
  {
    sceneId: "01-intro",
    segments: [
      {
        id: "01-intro-0",
        text: "This is Vamos — a polyphonic synthesizer we're building from scratch in C++ twenty. It's inspired by Ableton's Drift, and runs as a VST3, Audio Unit, and standalone app. To make all that work across platforms, we use JUCE, the standard framework for building audio plugins. It handles plugin formats, the GUI, parameter management, and cross-platform audio. We combine it with CMake as our build system.",
        startFrame: 0, // 24.0s = 721 frames
      },
      {
        id: "01-intro-1",
        text: "Here's the signal flow we're building — oscillators feed into a mixer, through a filter, shaped by an amplitude envelope, and out to the speakers. Every block in this chain, we'll code from scratch.",
        startFrame: 751, // prevAudio + 30 gap
      },
      {
        id: "01-intro-2",
        text: "In this episode, we lay the foundation — from project setup all the way to a working eight-voice synth plugin. Seven building blocks, one at a time.",
        startFrame: 1098, // prevAudio + 30 gap
      },
    ],
  },
  {
    sceneId: "02-project-setup",
    segments: [
      {
        id: "02-project-setup-0",
        text: "First, the build system. We use CMake with FetchContent to pull in JUCE directly from its Git repository. This avoids the complexity of managing git submodules or downloading frameworks by hand — CMake handles it all in one configure step.",
        startFrame: 0, // 14.0s = 421 frames
      },
      {
        id: "02-project-setup-1",
        text: "Our plugin targets three formats at once: VST3, Audio Unit, and Standalone. JUCE wraps the platform-specific details — we just focus on writing the audio code, and JUCE makes sure it runs everywhere.",
        startFrame: 451, // prevAudio + 30 gap
      },
      {
        id: "02-project-setup-2",
        text: "One important architectural decision: we separate the project into two layers. The DSP layer is pure C++ with zero JUCE dependencies. This means we can test oscillators, envelopes, and filters independently, without booting up the full plugin framework. The plugin layer then wires our DSP code to JUCE's AudioProcessor for audio handling and its component system for the GUI.",
        startFrame: 847, // prevAudio + 30 gap
      },
    ],
  },
  {
    sceneId: "03-phasor",
    segments: [
      {
        id: "03-phasor-0",
        text: "Every oscillator starts with a phasor — a phase accumulator that ramps from zero to one, then wraps around. Think of it as a clock that keeps ticking at a specific frequency. The speed is simply the frequency divided by the sample rate.",
        startFrame: 0, // 12.1s = 364 frames
      },
      {
        id: "03-phasor-1",
        text: "The code is quite elegant. Each call to next advances the phase by the increment. When it passes one, we subtract — creating an endlessly repeating ramp. That's the entire engine.",
        startFrame: 394, // prevAudio + 30 gap
      },
      {
        id: "03-phasor-2",
        text: "From this single ramp, we derive every waveform. Multiply by two and subtract one — you get a sawtooth. Pass it through a sine function — you get a sine wave. The phasor is the master clock for all of them.",
        startFrame: 681, // prevAudio + 30 gap
      },
    ],
  },
  {
    sceneId: "04-oscillator",
    segments: [
      {
        id: "04-oscillator-0",
        text: "But there's a problem with these simple waveforms. A raw sawtooth has a hard jump at the wrap point — an instantaneous leap from plus one to minus one. In the digital world, this sharp edge creates frequencies above what our sample rate can represent. Those frequencies fold back and appear as unwanted noise — this is called aliasing.",
        startFrame: 0, // 18.9s = 566 frames
      },
      {
        id: "04-oscillator-1",
        text: "The fix is called PolyBLEP — which stands for Polynomial Band-Limited Step. The idea is straightforward: instead of that hard jump, we gently round off the edges. Near the discontinuity, we apply a small correction that smooths the transition — like sanding down a sharp corner. The computational cost? Just two extra multiplications per sample. The result? A clean waveform without the aliasing artifacts.",
        startFrame: 596, // prevAudio + 30 gap
      },
      {
        id: "04-oscillator-2",
        text: "Here's the implementation. The polyBLEP function checks if we're near the wrap point — within one sample of the discontinuity — and applies the correction. The saw function generates the raw value, then subtracts the PolyBLEP correction to get a clean output.",
        startFrame: 1440, // prevAudio + 30 gap
      },
      {
        id: "04-oscillator-3",
        text: "Let's look at the difference. On the left, the naive sawtooth and its frequency spectrum — you can see energy spreading into higher frequencies where it shouldn't be. That's the aliasing. On the right, with PolyBLEP applied, the spectrum rolls off cleanly. The harmonics stay where they belong.",
        startFrame: 1886, // prevAudio + 30 gap
      },
      {
        id: "04-oscillator-4",
        text: "So now we have clean waveforms — but a tone that just drones on forever isn't very musical. We need a way to shape the sound over time: give it a punchy start, let it settle, and fade away when we release the key. That's exactly what an envelope does, and it's our next building block.",
        startFrame: 2401, // prevAudio + 30 gap
      },
    ],
  },
  {
    sceneId: "05-envelope",
    segments: [
      {
        id: "05-envelope-0",
        text: "An ADSR envelope shapes how a note evolves over time. Attack rises to full level, decay falls to the sustain point, sustain holds while the key is pressed, and release fades to silence. Each stage uses exponential curves, which sound more natural than straight lines.",
        startFrame: 0, // 17.3s = 520 frames
      },
      {
        id: "05-envelope-1",
        text: "Here's a clever trick for the attack phase. An exponential curve approaching a target never quite reaches it — it gets to ninety-five percent, ninety-eight, ninety-nine... but never one hundred. So we aim higher: the attack targets one-point-two instead of one-point-oh. The curve naturally overshoots past one, and we simply clamp it. Neat, isn't it?",
        startFrame: 550, // prevAudio + 30 gap
      },
      {
        id: "05-envelope-2",
        text: "The implementation tracks which stage we're in — idle, attack, decay, sustain, or release — and applies the corresponding exponential coefficient each sample. Notice the attack target constant set to one-point-two. When the level hits one, we transition to decay.",
        startFrame: 1131, // prevAudio + 30 gap
      },
    ],
  },
  {
    sceneId: "06-voice",
    segments: [
      {
        id: "06-voice-0",
        text: "A voice wires everything together — two oscillators, a filter, and the amplitude envelope — into a single signal chain. When a MIDI note arrives, we convert it to a frequency using the standard equal-temperament formula.",
        startFrame: 0, // 13.0s = 392 frames
      },
      {
        id: "06-voice-1",
        text: "MIDI note sixty-nine is A-four at four-forty hertz. Each semitone multiplies the frequency by two to the power of one-twelfth. This single formula gives us the entire piano range.",
        startFrame: 422, // prevAudio + 30 gap
      },
      {
        id: "06-voice-2",
        text: "The voice's process function is the per-sample signal chain. Mix the oscillators, run through the filter, multiply by the envelope. Nothing fancy — the mixer literally just adds the signals together. In later episodes, we'll add modulation and more complex routing, but for now, simplicity is the point.",
        startFrame: 788, // prevAudio + 30 gap
      },
    ],
  },
  {
    sceneId: "07-synth",
    segments: [
      {
        id: "07-synth-0",
        text: "For polyphony, we maintain a pool of eight voices. When a note arrives, we find an idle voice and assign it. Watch as the grid fills up — each voice lights up with its note.",
        startFrame: 0, // 8.5s = 255 frames
      },
      {
        id: "07-synth-1",
        text: "But what happens when all eight voices are busy and a ninth note arrives? We steal the oldest voice — the one that's been playing longest. It flashes red, then immediately takes on the new note. This is oldest-voice stealing, and it's the most straightforward strategy that still sounds natural.",
        startFrame: 285, // prevAudio + 30 gap
      },
      {
        id: "07-synth-2",
        text: "The processBlock function is where it all comes together. For each sample, we sum the output of all eight voices. In a future episode, we'll add different play modes — mono, unison, stereo panning — but polyphonic mode is our foundation.",
        startFrame: 777, // prevAudio + 30 gap
      },
    ],
  },
  {
    sceneId: "08-plugin",
    segments: [
      {
        id: "08-plugin-0",
        text: "Now we connect our DSP engine to the actual plugin. JUCE's AudioProcessor is the entry point — it's what your DAW talks to. It handles the audio callback, MIDI input, and plugin state. Our job is to bridge between JUCE's world and our clean DSP code.",
        startFrame: 0, // 16.2s = 487 frames
      },
      {
        id: "08-plugin-1",
        text: "JUCE provides a parameter system called the Audio Processor Value Tree State — or APVTS for short. It manages over thirty parameters: oscillator types, filter settings, envelope times, and more. Each parameter has a name, a range, and a default value. JUCE handles saving and loading these automatically, and exposes them to the DAW for automation.",
        startFrame: 517, // prevAudio + 30 gap
      },
      {
        id: "08-plugin-2",
        text: "Every time the DAW calls processBlock, we read all parameter values from the APVTS, pack them into our own SynthParams struct, and pass that to the synth engine. This is the bridge between JUCE's parameter tree and our pure DSP code. The synth then distributes these parameters to each active voice.",
        startFrame: 1206, // prevAudio + 30 gap
      },
      {
        id: "08-plugin-3",
        text: "Four critical parameters — volume, filter frequency, and the two oscillator gains — use something called SmoothedValue. Without smoothing, when you move a knob, the value would jump instantly from, say, zero-point-five to zero-point-eight. That instant jump creates an audible click — like a tiny discontinuity in the audio signal. SmoothedValue ramps gradually instead, spreading the change over a few milliseconds. It's a small detail, but it makes the difference between a prototype and a polished instrument.",
        startFrame: 1780, // prevAudio + 30 gap
      },
    ],
  },
  {
    sceneId: "09-outro",
    segments: [
      {
        id: "09-outro-0",
        text: "That wraps up Phase 1 — from an empty project to a working eight-voice polyphonic synthesizer. We built a phasor, added anti-aliasing with PolyBLEP, created ADSR envelopes, wired it all into voices, and connected everything to JUCE. Next episode, we'll expand the sound palette: seven different waveform types, each with proper anti-aliasing, plus a noise generator for texture. See you in Phase 2.",
        startFrame: 0, // 24.1s = 724 frames
      },
    ],
  },
];

/** Flat list of all narration segment IDs */
export const ALL_SEGMENT_IDS = NARRATION.flatMap((s) =>
  s.segments.map((seg) => seg.id),
);
