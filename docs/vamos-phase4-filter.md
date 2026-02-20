# Vamos Phase 3: Filter System

## What Was Implemented

Phase 3 adds the complete filter system to the Vamos synthesizer, implementing all 8 filter types from Ableton's Drift architecture. The filter sits between the mixer and the amplitude envelope in the signal chain.

### New Files
- `src/dsp/Filter.h` — Filter class declarations, SallenKeyFilter, StateVariableFilter, FilterParams, FilterType enum
- `src/dsp/Filter.cpp` — All filter type implementations

### Modified Files
- `src/dsp/Voice.h` — Added Filter member, updated signal flow
- `src/dsp/Voice.cpp` — Wired mixer output through filter with per-source routing
- `src/dsp/Mixer.h` — Added `isOsc1On()`, `isOsc2On()`, `isNoiseOn()` getters for filter routing
- `src/PluginEditor.cpp` — Changed Filter block from stub to active
- `CMakeLists.txt` — Added `src/dsp/Filter.cpp` to build

---

## Signal Flow

```
Osc1 -> [gain * on/off] -+
                          |
Osc2 -> [gain * on/off] -+-> Filter (Through routing) -> HP filter -> Amp (Env1)
                          |
Noise -> [gain * on/off] -+
```

Each source is individually routed through or around the filter based on the `oscThrough1`, `oscThrough2`, and `noiseThrough` parameters. Sources with Through=true are summed and processed by the filter. Sources with Through=false bypass the filter and are added to the output directly.

---

## Filter Types

### FilterType Enum
```cpp
enum class FilterType {
    I, II, LowPass, HighPass, Comb, Vowel, DJ, Resampling
};
```

### Type I: Sallen-Key MS-20 (12dB/oct)

A single 2-pole semi-discretized SVF-style Sallen-Key filter. This is the default filter type in Drift and produces a warm, gentle low-pass character.

**Implementation:** `SallenKeyFilter` class processes using:
1. Convert cutoff Hz to filter coefficient `g = tan(pi * cutoff / sampleRate)`
2. Compute damping `k = 2 * (1 - resonance)` where resonance 0 = no resonance, 1 = self-oscillation
3. Semi-discretized SVF update: compute hp, bp, lp outputs from state variables s1, s2
4. Update state with trapezoidal integration: `s1 = 2*bp - s1`, `s2 = 2*lp - s2`
5. Apply `tanh(s1)` saturation to the feedback path for MS-20 character

The tanh saturation is what gives this filter its distinctive "screaming" character at high resonance, inspired by the Korg MS-20 (1978).

### Type II: Sallen-Key MS-20 (24dB/oct)

Two cascaded Type I stages (4-pole). More aggressive frequency rolloff, removes more harmonics above the cutoff. The resonance peak is sharper and more pronounced.

### Low-pass (Standard SVF)

A standard state variable filter taking the low-pass output tap. Cleaner than the Sallen-Key types — no tanh saturation in the feedback path. Uses the Andy Simper / Cytomic SVF topology for numerical stability.

### High-pass (Standard SVF)

Same SVF structure as Low-pass but takes the high-pass output tap. Removes frequencies below the cutoff.

### Comb Filter

A feedforward+feedback comb filter using a circular delay buffer with linear interpolation for fractional delay times.

- Frequency parameter controls the comb spacing (delay = sampleRate / frequency)
- Resonance controls feedback amount (0-95%)
- Maximum delay ~2400 samples at 48kHz (corresponding to 20 Hz)
- Creates metallic, resonant timbres with a series of equally-spaced harmonic peaks

### Vowel Filter

Three parallel bandpass filters (SVFs) at formant frequencies, interpolating between five vowel shapes: a, e, i, o, u.

- Cutoff frequency (log-mapped) selects the vowel position (0-4)
- Interpolates between adjacent vowels for smooth morphing
- Resonance controls formant bandwidth (narrower = more pronounced vowels)
- Formant frequencies from standard male voice tables

### DJ Filter

A combined low-pass/high-pass filter with a single frequency control:
- Below center (~632 Hz): acts as a low-pass filter
- Above center: acts as a high-pass filter
- At center: signal passes through (nearly transparent)
- Resonance adds a peak at the transition point

### Resampling Filter

Sample-rate reduction / bit-crush effect:
- Frequency controls the effective sample rate (hold-and-sample)
- At 20000 Hz: nearly transparent (decimation ~1)
- At 20 Hz: maximum lo-fi degradation
- Creates digital artifacts and aliasing characteristic of early samplers

---

## Sallen-Key MS-20 Filter Theory

### Semi-Discretization

The "SD" in Drift's `SallenK_MS2_SD_LP` stands for semi-discrete. This is a digitization method where the continuous-time transfer function is discretized using the bilinear transform (trapezoidal rule), which preserves the frequency response shape better than simpler methods like forward/backward Euler.

The key formula is `g = tan(pi * freq / sampleRate)`, which performs frequency pre-warping to map the analog frequency response correctly into the digital domain.

### State Variable Form

The filter maintains two state variables (s1, s2) representing the "memory" of the filter — the charge on the two capacitors in the analog circuit analogy. The outputs are:
- **hp** (high-pass): removes low frequencies
- **bp** (band-pass): passes only frequencies near cutoff
- **lp** (low-pass): removes high frequencies

All three are computed simultaneously from the same state update.

### Tanh Saturation

The MS-20's distinctive character comes from nonlinear feedback. In the analog circuit, the op-amp saturates at high signal levels, creating soft clipping. We model this with `tanh(s1)` applied to the bandpass state variable.

At low resonance (k near 2), the filter is nearly linear. As resonance increases (k approaches 0), the feedback gain increases and the tanh nonlinearity engages, creating:
- Warm harmonic distortion at moderate resonance
- "Screaming" self-oscillation at maximum resonance
- The signal stays bounded (no infinity blow-up) thanks to tanh clamping to [-1, +1]

### Relationship to Drift's Code

This maps to `ableton::blocks::drift::SallenK_MS2_SD_LP` in the firmware binary. The binary references `tanhf` for the saturation nonlinearity and `Phasor<float>` for the frequency parameter.

---

## Filter Routing (Through Parameters)

The "Through" boolean parameters control which sound sources are processed by the filter:

| Parameter | Default | Meaning |
|---|---|---|
| `oscThrough1` | true | Osc1 signal goes through the filter |
| `oscThrough2` | true | Osc2 signal goes through the filter |
| `noiseThrough` | true | Noise signal goes through the filter |

When Through=true, the source IS filtered. When Through=false, the source bypasses the filter and is mixed directly into the output.

This enables layered sounds:
- Filter Osc1 (bright saw) while keeping Osc2 (sub sine) clean
- Apply filter to noise for swept "wind" effects while oscillators remain unfiltered

---

## Keyboard Tracking

When `tracking > 0`, the filter cutoff shifts with the played note:

```
adjustedCutoff = baseCutoff * 2^(tracking * (note - 60) / 12)
```

- `tracking = 0`: cutoff is fixed regardless of note (default)
- `tracking = 1.0`: cutoff follows pitch exactly (one octave up = cutoff doubles)
- Reference note: MIDI 60 (middle C) — notes above 60 shift cutoff up, below shift it down

This mimics acoustic instruments where higher notes naturally have more brightness.

---

## Filter Parameters

| Parameter | Type | Default | Range | Description |
|---|---|---|---|---|
| type | FilterType | I | 8 types | Filter algorithm |
| frequency | float | 20000.0 | 20-20000 Hz | Main cutoff frequency |
| resonance | float | 0.0 | 0-1 | Resonance / Q / feedback |
| hiPassFrequency | float | 10.0 | 10-20000 Hz | Secondary high-pass cutoff |
| tracking | float | 0.0 | 0-1 | Keyboard tracking amount |
| oscThrough1 | bool | true | - | Route Osc1 through filter |
| oscThrough2 | bool | true | - | Route Osc2 through filter |
| noiseThrough | bool | true | - | Route Noise through filter |

### Default Behavior

With default settings (frequency=20000, resonance=0, type=I), the filter is essentially transparent — the cutoff is at the top of the audible range and there is no resonance, so the signal passes through unaffected. This matches Drift's "Drift Default" preset behavior.

---

## Secondary High-Pass Filter

A simple 1-pole high-pass filter that runs after the main filter. At the default `hiPassFrequency = 10 Hz`, it is effectively bypassed (below audible range). When raised, it removes low-frequency content — useful for thinning out bass-heavy patches.

Implementation uses the standard discrete 1-pole HP:
```
alpha = RC / (RC + dt)
y[n] = alpha * (y[n-1] + x[n] - x[n-1])
```
