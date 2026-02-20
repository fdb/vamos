# Phase 5: Modulation Routing System

## Overview

Phase 5 implements the complete modulation routing system for the Vamos synthesizer, connecting modulation sources (envelopes, LFO, velocity, etc.) to destination parameters (filter cutoff, pitch, oscillator shape, etc.). This matches Drift's three-tier modulation architecture: dedicated filter modulation, dedicated pitch modulation, and a general-purpose 3-slot mod matrix.

## Files Modified

- **src/dsp/Modulation.h** (new) -- ModTarget enum, ModSlot, ModMatrix structs
- **src/dsp/Voice.h** -- Added ModMatrix member and accessor
- **src/dsp/Voice.cpp** -- Rewrote process() to apply all modulation before audio generation
- **src/PluginEditor.cpp** -- Updated phase label and activated Mod Matrix block in UI

## Existing Files (unchanged)

- **src/dsp/ModContext.h** -- ModSource enum, Envelope2Mode, ModContext struct (created in Phase 4)

## Architecture

### Modulation Sources (8)

All sources are computed per-voice, per-sample in Voice::process() and stored in ModContext:

| Source | Type | Range | Description |
|---|---|---|---|
| Env1 | Per-note | 0-1 | Amplitude envelope output |
| Env2Cyc | Per-note | 0-1 | Envelope 2 (ADSR) or Cycling Envelope |
| LFO | Continuous | -1 to +1 | Low-frequency oscillator * amount |
| Velocity | Per-note | 0-1 | MIDI velocity, fixed at note-on |
| Modwheel | Global | 0-1 | MIDI CC1 (to be wired) |
| Pressure | Per-note | 0-1 | Aftertouch (to be wired) |
| Slide | Per-note | 0-1 | MPE slide / CC74 (to be wired) |
| Key | Per-note | -1 to +1 | Keyboard tracking, MIDI 60 = 0 |

### Modulation Targets (12)

Defined in the ModTarget enum for the general-purpose matrix:

| Target | Application | Range Behavior |
|---|---|---|
| None | Slot disabled | -- |
| LPFrequency | Filter cutoff | Additive semitones, then exponential |
| HPFrequency | Hi-pass frequency | Additive semitones, then exponential |
| LPResonance | Filter resonance | Additive, clamped 0-1 |
| Osc1Shape | Oscillator 1 shape | Additive, clamped -1 to +1 |
| Osc1Gain | Osc1 mixer level | Additive, clamped 0-2 |
| Osc2Detune | Osc2 fine pitch | Cents offset (amount * 100 cents) |
| Osc2Gain | Osc2 mixer level | Additive, clamped 0-2 |
| NoiseGain | Noise mixer level | Additive, clamped 0-2 |
| LFORate | LFO speed | Multiplicative (2^amount) |
| CycEnvRate | Cycling env speed | Multiplicative (2^amount) |
| MainVolume | Output volume | Multiplicative (1 + amount), clamped 0-2 |

## Three Modulation Routing Points

### 1. Dedicated Filter Modulation (2 slots)

Two hardwired slots that modulate the filter cutoff frequency:

```cpp
// In ModMatrix (Drift defaults):
filterModSource1 = ModSource::Env2Cyc;   filterModAmount1 = 0.8f;
filterModSource2 = ModSource::Pressure;  filterModAmount2 = 0.15f;
```

Applied as semitone offset in log-frequency space (120 semitone range = 10 octaves):

```cpp
float filterModSemitones =
    modCtx.get(filterModSource1) * filterModAmount1 * 120.0f
  + modCtx.get(filterModSource2) * filterModAmount2 * 120.0f;
float modulatedCutoff = baseCutoff * pow(2, filterModSemitones / 12.0f);
```

### 2. Dedicated Pitch Modulation (2 slots)

Two hardwired slots that modulate oscillator pitch:

```cpp
// In ModMatrix (Drift defaults -- both amounts 0 = no pitch mod by default):
pitchModSource1 = ModSource::Env2Cyc;  pitchModAmount1 = 0.0f;
pitchModSource2 = ModSource::LFO;      pitchModAmount2 = 0.0f;
```

Applied as semitone offset (48 semitone range = 4 octaves):

```cpp
float pitchModSemitones =
    modCtx.get(pitchModSource1) * pitchModAmount1 * 48.0f
  + modCtx.get(pitchModSource2) * pitchModAmount2 * 48.0f;
float modulatedFreq = baseFreq * pow(2, pitchModSemitones / 12.0f);
```

Both Osc1 and Osc2 receive the same pitch modulation.

### 3. General-Purpose Mod Matrix (3 slots)

Three user-assignable slots, each with source/amount/target:

```cpp
struct ModSlot {
    ModSource source;
    float amount;      // bipolar, typically -1 to +1
    ModTarget target;  // any of 12 destinations
};
```

Resolved per-sample by summing all slots targeting the same destination:

```cpp
float ModMatrix::resolveTarget(ModTarget target, const ModContext& ctx) const {
    float total = 0.0f;
    for (auto& slot : slots) {
        if (slot.target == target)
            total += ctx.get(slot.source) * slot.amount;
    }
    return total;
}
```

### 4. Osc1 Shape Modulation (dedicated)

A separate dedicated modulation point for Osc1's waveshape:

```cpp
shapeModSource = ModSource::Velocity;  shapeModAmount = 0.0f;
```

Combined with any Osc1Shape routing from the general matrix.

## Modulation Application Order

In Voice::process(), modulations are applied in this order:

1. **Tick all modulators** -- Envelope 2, Cycling Env, LFO
2. **Build ModContext** -- snapshot of all 8 source values
3. **Pitch modulation** -- adjust Osc1 and Osc2 frequencies
4. **Shape modulation** -- adjust Osc1 waveform shape
5. **Mixer gain modulation** -- adjust per-source levels
6. **LFO/CycEnv rate modulation** -- adjust modulator speeds
7. **Filter modulation** -- adjust cutoff, HP freq, resonance
8. **Generate audio** -- oscillators, mixer, filter, amp envelope
9. **Volume modulation** -- scale final output

## Drift Default Modulation Settings

With the default ModMatrix, the synth behaves as follows:

- **Filter**: Env2Cyc modulates cutoff at 80% depth, Pressure at 15% -- filter opens and closes with the mod envelope
- **Pitch**: No pitch modulation (both amounts are 0)
- **Shape**: No shape modulation (amount is 0)
- **General matrix**: All 3 slots have target=None -- no routing active

This matches Drift's initial patch where modulation is available but only filter mod is active.

## Code Structure

### Modulation.h

Header-only file containing:
- `ModTarget` enum (12 values)
- `ModSlot` struct (source + amount + target)
- `ModMatrix` struct (3 general slots + dedicated filter/pitch/shape mod)
- `ModMatrix::resolveTarget()` -- resolves total modulation for a given target

### Voice.cpp changes

The process() method was restructured from a simple linear signal chain to a modulation-aware pipeline. Key changes:
- ModContext is built from all modulator outputs
- Oscillator frequencies are modulated before calling process()
- Filter params are modulated before calling filter.process()
- Mixer gains are modulated and applied manually (bypassing Mixer::process())
- MainVolume modulation scales the final output

All modulation uses safe clamping to prevent out-of-range values (frequencies clamped to 8-20000 Hz, gains to 0-2, resonance to 0-1).
