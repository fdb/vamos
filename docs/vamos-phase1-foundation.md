# Vamos Phase 1: Foundation

## What Was Implemented

Phase 1 establishes the core project scaffolding and minimal audio pipeline:

1. **CMake build system** with JUCE 8.0.6 via FetchContent
2. **Phasor** -- phase accumulator (0-1 ramp) matching Drift's `Phasor<float>`
3. **Oscillator** -- PolyBLEP Saw waveform (single type, expanded in Phase 2)
4. **Envelope** -- exponential ADSR (amplitude envelope)
5. **Voice** -- single mono voice wiring Osc1 -> Amp Env
6. **Synth** -- 8-voice polyphonic manager with oldest-voice stealing
7. **PluginProcessor** -- JUCE AudioProcessor with MIDI handling
8. **PluginEditor** -- signal flow block diagram (active + stub blocks)
9. **dev.sh** -- build-and-run script for Standalone target

## Files Added

| File | Purpose |
|------|---------|
| `CMakeLists.txt` | JUCE 8 FetchContent, plugin config (Standalone/VST3/AU) |
| `scripts/dev.sh` | Build and launch standalone app |
| `src/PluginProcessor.h/.cpp` | AudioProcessor, APVTS stub, MIDI dispatch |
| `src/PluginEditor.h/.cpp` | Signal flow block diagram GUI |
| `src/dsp/Oscillator.h/.cpp` | Phasor + Saw oscillator with PolyBLEP |
| `src/dsp/Envelope.h/.cpp` | Exponential ADSR envelope |
| `src/dsp/Voice.h/.cpp` | Single voice: Osc1 -> Env1 -> output |
| `src/dsp/Synth.h/.cpp` | 8-voice polyphonic engine |

---

## Project Setup

### CMake + JUCE 8

JUCE 8 is fetched at configure time via CMake's `FetchContent`:

```cmake
cmake_minimum_required(VERSION 3.22...3.31)
project(Vamos VERSION 0.1.0 LANGUAGES C CXX)

FetchContent_Declare(JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG 8.0.6
    GIT_SHALLOW ON
)
FetchContent_MakeAvailable(JUCE)
```

The version range `3.22...3.31` is critical -- CMake 4.x removed internal variables that JUCE 8 relies on, so the upper bound prevents policy breakage.

### Plugin Configuration

```cmake
juce_add_plugin(Vamos
    FORMATS Standalone VST3 AU
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    COPY_PLUGIN_AFTER_BUILD TRUE
)
```

This generates three targets:
- **Standalone** -- desktop app with built-in audio device selector
- **VST3** -- plugin for DAWs via Steinberg's VST3 SDK (bundled with JUCE)
- **AU** -- AudioUnit for Logic/GarageBand (macOS only)

---

## Phasor

The Phasor is the lowest-level DSP primitive -- a phase accumulator that ramps linearly from 0.0 to 1.0 at a given frequency:

```cpp
float tick(float freqHz, float sampleRate) {
    float prev = phase;
    float inc = freqHz / sampleRate;
    phase += inc;
    if (phase >= 1.0f) phase -= 1.0f;
    phaseIncrement = inc;
    return prev;  // return phase BEFORE increment
}
```

Returning the pre-increment phase is important for PolyBLEP -- the anti-aliasing correction needs to know where the discontinuity fell relative to the current sample.

### Drift Equivalence

This matches Drift's `ableton::blocks::Phasor<float, Direction=0>` template, where `Direction=0` means a forward (0->1) ramp.

---

## Oscillator (Phase 1: Saw Only)

The initial oscillator implements a naive saw minus PolyBLEP correction:

```cpp
float generateSaw(float phase, float dt) {
    float saw = 2.0f * phase - 1.0f;   // naive: ramp from -1 to +1
    saw -= polyBlep(phase, dt);          // correct the discontinuity at wrap
    return saw;
}
```

### PolyBLEP Anti-Aliasing

PolyBLEP (Polynomial BandLimited stEP) smooths the 1-sample window around each waveform discontinuity. Instead of a sharp vertical edge (which contains infinite harmonics = aliasing), we apply a quadratic correction:

```cpp
float polyBlep(float t, float dt) {
    if (t < dt) {                       // just past discontinuity
        float x = t / dt;
        return x + x - x * x - 1.0f;
    }
    if (t > 1.0f - dt) {               // just before discontinuity
        float x = (t - 1.0f) / dt;
        return x * x + x + x + 1.0f;
    }
    return 0.0f;                        // far from discontinuity
}
```

This is a 2nd-order approximation that removes the worst aliasing artifacts at minimal CPU cost. Higher-order BLEPs exist but PolyBLEP is the standard choice for virtual analog synthesizers.

---

## Envelope (ADSR)

Exponential ADSR using one-pole filter coefficients:

```cpp
float calcCoeff(float timeSeconds, float sampleRate) {
    if (timeSeconds <= 0.0f) return 0.0f;
    return std::exp(-6.9f / (timeSeconds * sampleRate));
}
```

The constant `-6.9` (approximately `-ln(1000)`) means the envelope reaches ~99.9% of its target after `timeSeconds`. Each stage uses a coefficient to smoothly approach its target level:

| Stage | Target | Coefficient |
|-------|--------|-------------|
| Attack | 1.2 (overshoot) | `calcCoeff(attack, sr)` |
| Decay | sustain level | `calcCoeff(decay, sr)` |
| Sustain | (hold) | n/a |
| Release | 0.0 | `calcCoeff(release, sr)` |

The attack overshoots to 1.2 so the exponential curve reaches 1.0 naturally, rather than asymptotically approaching it.

### Drift Equivalence

Drift uses the same exponential ADSR shape. The attack overshoot and `-6.9` time constant are standard in analog modeling -- they produce the characteristic "snappy" envelope of hardware synthesizers.

---

## Voice

A Voice wires DSP blocks into a signal chain. In Phase 1, this is minimal:

```
Osc1 (Saw) -> Amp Envelope -> output
```

The Voice owns all its DSP objects (oscillator, envelope) and manages the note lifecycle:

```cpp
void noteOn(int midiNote, float velocity) {
    currentNote = midiNote;
    osc1.setFrequency(midiToFreq(midiNote));
    ampEnv.noteOn();
}

float process() {
    float osc = osc1.process();
    float env = ampEnv.process();
    return osc * env;
}
```

### MIDI Note to Frequency

Standard equal-temperament conversion:

```cpp
float midiToFreq(int note) {
    return 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
}
```

---

## Synth (8-Voice Polyphonic)

The Synth manages 8 voices with a simple oldest-voice-stealing allocator:

```cpp
int allocateVoice() {
    // 1. Find idle voice
    for (int i = 0; i < 8; ++i)
        if (!voices[i].isActive()) return i;

    // 2. Steal oldest active voice
    int oldest = 0, oldestAge = INT_MAX;
    for (int i = 0; i < 8; ++i) {
        if (voiceAge[i] < oldestAge) {
            oldestAge = voiceAge[i];
            oldest = i;
        }
    }
    return oldest;
}
```

Each `noteOn` increments an age counter and tags the allocated voice. When all 8 voices are active, the voice with the lowest age (= longest-held note) gets stolen.

### Drift Equivalence

Drift's `PolyNoteAllocator<8, N>` uses the same strategy. The `8` template parameter matches our `kMaxVoices = 8` constant. Drift also supports Mono/Stereo/Unison modes (added in Phase 6).

---

## PluginEditor (Signal Flow Diagram)

The GUI draws a visual block diagram of the signal chain using `drawBlock()`:

```
[Osc 1] ---> [Mixer] ---> [Filter] ---> [Amp] ---> [OUT]
[Osc 2] --->
[Noise] --->
```

Each block has an `active` flag controlling its opacity -- active blocks are bright, stub blocks are dimmed. This makes it immediately visible which parts of the Drift architecture are implemented vs. planned.

In Phase 1, only Osc1 and Amp are active. All other blocks are drawn but dimmed.

---

## Build and Run

```bash
cd vamos
chmod +x scripts/dev.sh
./scripts/dev.sh
```

The script:
1. Configures CMake (first run only, downloads JUCE ~2min)
2. Builds all targets in Debug mode
3. Launches the Standalone app

Use `--release` for optimized builds.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| JUCE 8 via FetchContent | No manual SDK install, version-pinned, CI-friendly |
| C++20 | Structured bindings, `std::numbers`, ranges (future) |
| Header-only DSP enums | `OscillatorType1`, `FilterType` etc. shared between DSP and UI |
| Mono voice output | Stereo handled at Synth level (pan per voice, Phase 6) |
| 8 max voices | Matches Drift's `PolyNoteAllocator<8>` |
| Exponential envelopes | Matches Drift's analog-modeled curves |

## What's Next

Phase 2 expands the oscillator to all 7 waveforms, adds Osc2, Noise generator, and Mixer -- completing the sound source section of the signal chain.
