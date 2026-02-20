# Vamos Phase 6: Voice Architecture

## Overview

Phase 6 implements Drift's voice architecture: four voice modes (Poly, Mono, Stereo, Unison), glide/portamento, and analog drift. These features transform the synth from a basic polyphonic engine into a versatile instrument matching Drift's voicing capabilities.

---

## Voice Modes

The `VoiceMode` enum controls how the 8-voice pool is allocated:

```
enum class VoiceMode { Poly, Mono, Stereo, Unison };
```

### Poly Mode (default)
- **1 voice per note**, up to 8 simultaneous notes
- Standard keyboard behavior with voice stealing (oldest first)
- All voices centered (pan = 0)
- `PolyVoiceDepth` (default 0.0) reserved for future stereo spread

### Mono Mode
- **1 voice** (always voice 0)
- New notes steal the single voice
- With **legato** enabled: overlapping notes don't retrigger envelopes, only change pitch
- Held note stack tracks all currently pressed keys
- On note-off: if other notes are still held, glides back to the most recent one
- `MonoVoiceDepth` (default 0.0) reserved for future use

### Stereo Mode
- **2 voices per note** (left + right), detuned by `StereoVoiceDepth`
- Maximum 4 simultaneous notes (8 voices / 2 per note)
- Voices allocated in pairs: [0,1], [2,3], [4,5], [6,7]
- Left voice: detune = -depth * 100 cents, pan = -1.0
- Right voice: detune = +depth * 100 cents, pan = +1.0
- `StereoVoiceDepth` default: 0.1 (= 10 cents detune between L/R)

### Unison Mode
- **4 voices per note**, all detuned by different amounts
- Maximum 2 simultaneous notes (8 voices / 4 per note)
- Voices allocated in quads: [0,1,2,3], [4,5,6,7]
- Detune spread: `[-1.5*d, -0.5*d, +0.5*d, +1.5*d]` where `d = depth * 20 cents`
- Pan spread: `[-0.75, -0.25, +0.25, +0.75]` for stereo width
- `UnisonVoiceDepth` default: 0.05 (= 1 cent spread)

### Voice Allocation Diagram

```
Poly:    [V1] [V2] [V3] [V4] [V5] [V6] [V7] [V8]   (1 per note, 8 notes max)
Mono:    [V1] [ ] [ ] [ ] [ ] [ ] [ ] [ ]             (1 voice only)
Stereo:  [L1 R1] [L2 R2] [L3 R3] [L4 R4]            (2 per note, 4 notes max)
Unison:  [U1 U2 U3 U4] [U5 U6 U7 U8]                (4 per note, 2 notes max)
```

---

## Glide / Portamento

Glide smoothly transitions pitch between notes instead of jumping instantly.

### Parameters
- `glideTime`: 0.0 to 2.0 seconds (0 = instant, mapped from APVTS 0-1 range * 2)

### Implementation (in Voice)
```
targetFreq = midiToFreq(newNote);
// Each sample:
currentFreq += (targetFreq - currentFreq) * glideRate;
```

Where `glideRate = 1 - exp(-1 / (glideTime * sampleRate))` -- a one-pole smoothing coefficient.

### Behavior
- On noteOn: if the voice was already active and glide > 0, starts from the previous pitch
- On noteOnLegato (mono+legato): pitch changes without envelope retrigger
- Snap threshold: 0.01 Hz to avoid infinite asymptotic approach

---

## Analog Drift

Per-voice slow random pitch wander that mimics analog oscillator instability.

### Algorithm (`src/dsp/Drift.h`)

```
class AnalogDrift:
    // Every 0.5-2 seconds, pick a new random target in [-1, +1]
    // Smooth toward target with one-pole lowpass (corner ~2 Hz)
    // Output = value * depth * 100 cents
```

### Signal Flow
1. Each voice has its own independent `AnalogDrift` instance
2. Drift output (in cents) is added to both Osc1 and Osc2 frequencies
3. Combined with the voice's detune offset before pitch modulation

### Parameters
- `DriftDepth`: 0.0 to 1.0 (default 0.072 from Drift preset)
- At default 0.072: approximately +/- 7.2 cents of wander
- At 1.0: approximately +/- 100 cents (very unstable)

### Characteristics
- Slow (0.5-2 second target changes)
- Smooth (2 Hz one-pole lowpass)
- Independent per voice (each drifts differently)
- Random seed per voice instance

---

## Voice Depth Parameters

| Parameter | Mode | Default | Effect |
|---|---|---|---|
| `PolyVoiceDepth` | Poly | 0.0 | (Reserved) |
| `MonoVoiceDepth` | Mono | 0.0 | (Reserved) |
| `StereoVoiceDepth` | Stereo | 0.1 | Detune between L/R voices (semitones) |
| `UnisonVoiceDepth` | Unison | 0.05 | Detune spread for unison stack |

---

## Legato

- Boolean parameter, default: false
- Only meaningful in Mono mode
- When true: overlapping notes call `noteOnLegato()` instead of `noteOn()`
- `noteOnLegato()` changes `targetFreq` without retriggering envelopes (amp, mod, cycling, LFO)
- Combined with glide for smooth legato lines

---

## Stereo Processing

The `Synth::process()` method now produces true stereo output using per-voice panning:

```
for each voice:
    mono = voice.process()
    leftGain  = 0.5 * (1 - pan)
    rightGain = 0.5 * (1 + pan)
    left  += mono * leftGain
    right += mono * rightGain
```

In Poly and Mono modes, all voices are centered (pan = 0) so output is mono-duplicated.
In Stereo mode, pairs are hard-panned left/right.
In Unison mode, voices are spread across the stereo field.

---

## Files Modified/Added

| File | Changes |
|---|---|
| `src/dsp/Drift.h` | **New** -- AnalogDrift class (header-only) |
| `src/dsp/Voice.h` | Added glide, drift, detuneOffset, pan members and methods |
| `src/dsp/Voice.cpp` | Glide in process(), drift applied to pitch, noteOnLegato() |
| `src/dsp/Synth.h` | VoiceMode enum, voice mode state, held note stack, depth params |
| `src/dsp/Synth.cpp` | 4 mode noteOn/noteOff handlers, stereo process() with panning |
| `src/PluginEditor.cpp` | Drift block active, voice mode display |
| `src/PluginProcessor.cpp` | Wire voiceMode and glide APVTS params to SynthParams |

---

## Drift Preset Defaults

From the original Drift firmware analysis:
- VoiceMode: Poly
- DriftDepth: 0.072
- Glide: 0.0 (instant)
- Legato: false
- StereoVoiceDepth: 0.1
- UnisonVoiceDepth: 0.05
