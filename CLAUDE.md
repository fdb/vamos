# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vamos is a polyphonic software synthesizer plugin (VST3/AU/Standalone) written in C++20 using JUCE 8.0.6. Its architecture is modeled after Ableton Live's Drift synthesizer. The project uses CMake as its build system and fetches JUCE and Catch2 via FetchContent (first configure takes ~2 minutes to download JUCE).

## Build & Run Commands

```bash
./scripts/dev.sh              # Debug build + launch Standalone app
./scripts/dev.sh --release    # Release build + launch
./scripts/dev.sh --test       # Build and run all tests (DSP + Plugin)
```

Manual test targets:
```bash
cmake --build build/Debug --target VamosTests -j$(sysctl -n hw.ncpu)
./build/Debug/tests/VamosTests              # DSP unit tests (no JUCE, fast)

cmake --build build/Debug --target VamosPluginTests -j$(sysctl -n hw.ncpu)
./build/Debug/tests/VamosPluginTests        # Plugin integration tests (links JUCE)
```

Run a single Catch2 test by name:
```bash
./build/Debug/tests/VamosTests "[Oscillator]"       # Run tests tagged [Oscillator]
./build/Debug/tests/VamosTests "Saw wave"            # Run test matching name substring
```

Build artifacts: `build/{Debug,Release}/Vamos_artefacts/{Standalone,VST3,AU}/`

## Architecture

### Signal Flow (per voice)
```
Osc1 + Osc2 + Noise → Mixer → Filter → Amp Envelope → Pan → Output
                                  ↑
              ModMatrix (Env1, Env2/CycEnv, LFO, Velocity, Modwheel, etc.)
```

### Two-Layer Separation

**DSP layer** (`src/dsp/`): Pure C++20, zero JUCE dependencies. All synthesis happens here. This is why VamosTests can build and run without linking JUCE.

**Plugin layer** (`src/PluginProcessor.cpp`, `src/PluginEditor.cpp`): JUCE integration — AudioProcessor, APVTS parameter system (30+ parameters), custom LookAndFeel GUI.

### Key DSP Classes (all in `vamos` namespace)

- **Synth** — 8-voice polyphonic engine with oldest-voice-stealing. Handles Poly/Mono/Stereo/Unison modes.
- **Voice** — Single voice container. Owns all DSP blocks and runs the per-sample signal chain.
- **Oscillator** — Phasor-based with PolyBLEP anti-aliasing. 7 waveforms (OscillatorType1) for Osc1, 5 (OscillatorType2) for Osc2.
- **Envelope** — Exponential ADSR. Attack overshoots to 1.2 so the curve naturally reaches 1.0.
- **Filter** — 8 filter types (Sallen-Key, SVF, Vowel, Comb, DJ, etc.) via FilterType enum.
- **ModMatrix** — Per-voice modulation routing. 3 general-purpose slots + dedicated filter/pitch/shape mod slots. ModSource (8 sources) → ModTarget (12 destinations).
- **LFO** / **CyclingEnvelope** — Modulators feeding into ModContext for per-sample modulation.

### Parameter Flow

`PluginProcessor::processBlock()` reads APVTS → packs into `SynthParams` struct → `Synth::setParameters()` → each `Voice::setParameters()`. Four critical parameters use `juce::SmoothedValue` to prevent audio clicks (volume, filterFreq, osc1Gain, osc2Gain).

### GUI

Click-to-reveal panel design: main view shows signal flow blocks, clicking a block reveals its parameter panel. Custom `VamosLookAndFeel` with synthwave-minimal dark theme (background #0a0a0a, accent #00E5FF).

## Testing

Two test executables with different dependency profiles:
- **VamosTests** — DSP-only unit tests. No JUCE. Fast. Tests Oscillator, Envelope, Filter, Voice, Synth modules.
- **VamosPluginTests** — Plugin integration. Links JUCE. Tests AudioProcessor creation, state save/load, MIDI dispatch.

Both use Catch2 v3.5.2 and are registered with CTest via `catch_discover_tests()`.

## Phase Documentation

Detailed design documents in `docs/` (phases 1–7) cover architectural decisions, Drift equivalence notes, and implementation rationale for each development phase.
