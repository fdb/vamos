<div align="center">

# Vamos

**A polyphonic software synthesizer built from scratch in C++20 with [JUCE](https://juce.com/)**

*Inspired by Ableton's Drift &mdash; runs as VST3, Audio Unit, and standalone app*

<br>

<img src=".github/vamos-ui.png" alt="Vamos synthesizer UI" width="720">

<br>
<br>

`C++20` &nbsp; `JUCE 8` &nbsp; `VST3 / AU` &nbsp; `CMake` &nbsp; `Catch2`

</div>

<br>

## What this project is

Vamos is two things at once:

1. **A real synthesizer.** Eight-voice polyphony, dual oscillators with PolyBLEP anti-aliasing, eight filter types, exponential ADSR envelopes, an LFO, a cycling envelope, and a modulation matrix with flexible routing. It works in your DAW.

2. **An experiment in agentic coding.** We're building this synth incrementally — phase by phase — and documenting each step as an episodic video series. The videos are produced programmatically with [Remotion](https://www.remotion.dev/), a React-based framework for making videos with code. The narration, timing, subtitles, and thumbnails are all generated from structured data. The entire pipeline — from C++ DSP code to rendered video — lives in this repository.

The goal is to learn what happens when you build something real and explain it along the way, using the same code-driven approach for both the software and the content about it.

## Architecture

```
Osc1 + Osc2 + Noise → Mixer → Filter → Amp Envelope → Pan → Output
                                  ↑
              ModMatrix (Env1, Env2/CycEnv, LFO, Velocity, Modwheel, etc.)
```

The project is split into two layers:

- **DSP layer** (`src/dsp/`) — Pure C++20, zero JUCE dependencies. Oscillators, envelopes, filters, voices, and the synth engine all live here and can be tested independently.
- **Plugin layer** (`src/PluginProcessor.cpp`, `src/PluginEditor.cpp`) — JUCE integration. Bridges the DSP engine to the AudioProcessor, manages 30+ parameters via APVTS, and renders the GUI.

## Build

Requires CMake 3.22+ and a C++20 compiler. JUCE and Catch2 are fetched automatically via CMake's FetchContent (first configure takes ~2 minutes).

```bash
./scripts/dev.sh              # Debug build + launch standalone
./scripts/dev.sh --release    # Release build + launch
./scripts/dev.sh --test       # Build and run all tests
```

Build artifacts end up in `build/{Debug,Release}/Vamos_artefacts/{Standalone,VST3,AU}/`.

## Tests

Two test executables with different dependency profiles:

```bash
# DSP-only tests — no JUCE, fast
cmake --build build/Debug --target VamosTests -j$(sysctl -n hw.ncpu)
./build/Debug/tests/VamosTests

# Plugin integration tests — links JUCE
cmake --build build/Debug --target VamosPluginTests -j$(sysctl -n hw.ncpu)
./build/Debug/tests/VamosPluginTests
```

Both use Catch2 v3. Run a specific test by name or tag:

```bash
./build/Debug/tests/VamosTests "[Oscillator]"
./build/Debug/tests/VamosTests "Saw wave"
```

## Video series

The [`video/`](video/) directory contains a Remotion project that produces episodic content about building the synth. Each episode covers one development phase — from phasors and anti-aliasing to voice allocation and plugin integration.

The videos use the same dark synthwave aesthetic as the synth UI, with AI-generated voiceover, animated code walkthroughs, waveform visualizations, and auto-generated VTT subtitles.

See [`video/README.md`](video/README.md) for how the video pipeline works.

## Phase documentation

Detailed design documents in `docs/` cover architectural decisions and implementation rationale for each development phase:

| Phase | Topic |
|-------|-------|
| 1 | Foundation — phasor, oscillator, envelope, voice, synth, plugin |
| 2 | Sound sources — 7 waveform types, noise generator |
| 3 | Filter — Sallen-Key, SVF, vowel, comb, DJ, and more |
| 4 | Modulators — LFO, cycling envelope |
| 5 | Modulation — mod matrix, routing, per-voice modulation |
| 6 | Voice architecture — mono, unison, stereo modes, voice stealing |
| 7 | Parameters and GUI — APVTS integration, custom LookAndFeel |

## License

This project is not yet licensed for distribution. Source code is provided for educational purposes.
