// Narration text for each scene segment.
// Each scene has multiple segments that align with visual Sequences.
// The key is sceneId-segmentIndex, matching the generate script output filenames.

export type NarrationSegment = {
  id: string;
  text: string;
  /** Frame offset within the scene where this segment's audio should start */
  startFrame: number;
};

export type SceneNarration = {
  sceneId: string;
  segments: NarrationSegment[];
};

export const NARRATION: SceneNarration[] = [
  {
    sceneId: "01-intro",
    segments: [
      {
        id: "01-intro-0",
        text: "This is Vamos — a polyphonic synthesizer built from scratch in C++ twenty. Inspired by Ableton's Drift, it runs as a VST3, Audio Unit, and standalone app, all powered by JUCE 8 and CMake.",
        startFrame: 0,
      },
      {
        id: "01-intro-1",
        text: "Here's the signal flow we're building — oscillators feed into a mixer, through a filter, shaped by an amplitude envelope, and out to the speakers. Every block in this chain, we'll code ourselves.",
        startFrame: 300,
      },
      {
        id: "01-intro-2",
        text: "In this episode, we'll lay the foundation — from project setup all the way to a working eight-voice synth plugin. Seven building blocks, one at a time. Let's go.",
        startFrame: 650,
      },
    ],
  },
  {
    sceneId: "02-project-setup",
    segments: [
      {
        id: "02-project-setup-0",
        text: "First, the build system. We use CMake with FetchContent to pull in JUCE directly — no git submodules, no manual downloads. One configure command and you're ready.",
        startFrame: 0,
      },
      {
        id: "02-project-setup-1",
        text: "Our plugin targets three formats at once: VST3, Audio Unit, and Standalone. JUCE handles the platform-specific wrapping — we just write the audio code.",
        startFrame: 400,
      },
      {
        id: "02-project-setup-2",
        text: "The key architectural decision: a strict two-layer separation. The DSP layer is pure C++ with zero JUCE dependencies — meaning we can unit test oscillators, envelopes, and filters at lightning speed. The plugin layer wires it all to JUCE's AudioProcessor and GUI.",
        startFrame: 750,
      },
    ],
  },
  {
    sceneId: "03-phasor",
    segments: [
      {
        id: "03-phasor-0",
        text: "Every oscillator starts with a phasor — a phase accumulator that ramps from zero to one, then wraps. It's the heartbeat of synthesis. The increment is simply frequency divided by sample rate.",
        startFrame: 0,
      },
      {
        id: "03-phasor-1",
        text: "The code is elegant in its simplicity. Each call to next advances the phase by the increment. When it passes one, we subtract — creating an endlessly repeating ramp.",
        startFrame: 500,
      },
      {
        id: "03-phasor-2",
        text: "From this single ramp, we derive every waveform. Multiply by two and subtract one — you get a saw. Pass through a sine function — you get a sine wave. The phasor is the foundation for all of them.",
        startFrame: 1100,
      },
    ],
  },
  {
    sceneId: "04-oscillator",
    segments: [
      {
        id: "04-oscillator-0",
        text: "But there's a problem with naive waveforms. A raw sawtooth has a hard discontinuity at the wrap point — an instantaneous jump that produces infinite harmonics. Those fold back as aliasing, creating harsh, inharmonic artifacts.",
        startFrame: 0,
      },
      {
        id: "04-oscillator-1",
        text: "The fix is PolyBLEP — polynomial band-limited step. It smooths the discontinuity by subtracting a small polynomial residual near the transition. The cost? Just two extra operations per sample. The result? A clean, anti-aliased waveform.",
        startFrame: 550,
      },
      {
        id: "04-oscillator-2",
        text: "Here's the implementation. The polyBLEP function checks if we're near the discontinuity — within one sample of the wrap point — and applies the correction. The saw function generates the naive value, then subtracts the PolyBLEP correction.",
        startFrame: 1000,
      },
      {
        id: "04-oscillator-3",
        text: "Before and after. The naive saw aliases audibly, especially at higher frequencies. With PolyBLEP applied, the waveform is clean and musical.",
        startFrame: 1650,
      },
    ],
  },
  {
    sceneId: "05-envelope",
    segments: [
      {
        id: "05-envelope-0",
        text: "An ADSR envelope shapes how a note evolves over time. Attack rises to full level, decay falls to the sustain point, sustain holds while the key is pressed, and release fades to silence. Each stage uses exponential curves for a natural sound.",
        startFrame: 0,
      },
      {
        id: "05-envelope-1",
        text: "Here's a clever trick. An exponential curve approaching a target never quite reaches it — ninety-five, ninety-eight, ninety-nine percent, but never one hundred. So we overshoot: the attack targets one point two instead of one. The curve naturally crosses one-point-oh, and we simply clamp. No special cases needed.",
        startFrame: 600,
      },
      {
        id: "05-envelope-2",
        text: "The implementation tracks a stage — idle, attack, decay, sustain, or release — and applies the corresponding exponential coefficient each sample. Notice the attack target constant at one-point-two. When the level hits one, we transition to decay.",
        startFrame: 950,
      },
    ],
  },
  {
    sceneId: "06-voice",
    segments: [
      {
        id: "06-voice-0",
        text: "A voice wires everything together — two oscillators, a filter, and the amplitude envelope — into a single signal chain. When a MIDI note arrives, we convert it to a frequency using the standard equal-temperament formula.",
        startFrame: 0,
      },
      {
        id: "06-voice-1",
        text: "MIDI note sixty-nine is A-four at four-forty hertz. Each semitone multiplies by two to the power of one-twelfth. This gives us the entire piano range from a simple exponential.",
        startFrame: 450,
      },
      {
        id: "06-voice-2",
        text: "The voice's process function is the per-sample signal chain. Mix the oscillators, run through the filter, multiply by the envelope. That's it — one voice, one note, one clean signal path.",
        startFrame: 750,
      },
    ],
  },
  {
    sceneId: "07-synth",
    segments: [
      {
        id: "07-synth-0",
        text: "For polyphony, we maintain a pool of eight voices. When a note arrives, we find an idle voice and assign it. Watch as the grid fills up — each voice lights up with its note.",
        startFrame: 0,
      },
      {
        id: "07-synth-1",
        text: "But what happens when all eight voices are busy and a ninth note arrives? We steal the oldest voice — the one that's been playing longest. It flashes red, then immediately takes on the new note. This is oldest-voice stealing, and it's the simplest strategy that sounds natural.",
        startFrame: 400,
      },
      {
        id: "07-synth-2",
        text: "The processBlock function is where it all comes together. For each sample, we sum the output of all eight voices. Later we'll add play modes — mono, unison, stereo — but poly is our foundation.",
        startFrame: 600,
      },
    ],
  },
  {
    sceneId: "08-plugin",
    segments: [
      {
        id: "08-plugin-0",
        text: "Finally, we connect our DSP engine to the JUCE plugin framework. The AudioProcessor reads over thirty parameters from the value tree state, packs them into a SynthParams struct, and passes them to the synth each audio callback.",
        startFrame: 0,
      },
      {
        id: "08-plugin-1",
        text: "Four critical parameters — volume, filter frequency, and the two oscillator gains — use SmoothedValue to prevent audio clicks when the user moves a knob. The value ramps smoothly over a few milliseconds instead of jumping instantly.",
        startFrame: 450,
      },
    ],
  },
  {
    sceneId: "09-outro",
    segments: [
      {
        id: "09-outro-0",
        text: "That's Phase 1 complete — from an empty project to a working eight-voice polyphonic synthesizer. Next time, we'll dive into sound sources: seven waveform types with full PolyBLEP anti-aliasing, and a noise generator. See you in Phase 2.",
        startFrame: 0,
      },
    ],
  },
];

/** Flat list of all narration segment IDs */
export const ALL_SEGMENT_IDS = NARRATION.flatMap((s) =>
  s.segments.map((seg) => seg.id)
);
