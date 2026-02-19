# Vamos Phase 2: Sound Sources

## What Was Implemented

Phase 2 adds all sound source components to the Vamos synthesizer:

1. **Complete Oscillator 1 waveforms** (7 types with Shape support)
2. **Oscillator 2** (secondary oscillator with Detune and Transpose)
3. **Noise generator** (White and Pink noise)
4. **Mixer** (blends Osc1 + Osc2 + Noise with individual gain and on/off controls)
5. **Updated Voice** wiring all sound sources together
6. **Updated UI** showing Osc2, Noise, and Mixer as active blocks

## Files Modified

- `src/dsp/Oscillator.h` / `.cpp` -- Improved waveforms, added Pulse, SharkTooth, Saturated, Shape support
- `src/dsp/Voice.h` / `.cpp` -- Added Osc2, Noise, Mixer integration
- `src/PluginEditor.cpp` -- Active status for Osc2, Noise, Mixer blocks
- `CMakeLists.txt` -- Added Noise.cpp, Mixer.cpp

## Files Added

- `src/dsp/Noise.h` / `.cpp` -- White and Pink noise generator
- `src/dsp/Mixer.h` / `.cpp` -- Three-source mixer

---

## Oscillator 1 Waveforms

### PolyBLEP Anti-Aliasing

All waveforms with discontinuities use PolyBLEP (Polynomial Bandlimited Step) to reduce aliasing. The PolyBLEP function smooths the 1-sample window around each discontinuity:

```cpp
float Oscillator::polyBlep(float t, float dt) {
    if (t < dt) {
        float x = t / dt;
        return x + x - x * x - 1.0f;  // just past discontinuity
    }
    if (t > 1.0f - dt) {
        float x = (t - 1.0f) / dt;
        return x * x + x + x + 1.0f;  // just before discontinuity
    }
    return 0.0f;
}
```

### Saw (with Shape)

Basic PolyBLEP saw wave. The Shape parameter (0.0-1.0) crossfades from pure saw toward triangle, effectively rounding the corners:

```cpp
saw = saw * (1.0f - shape) + tri * shape;
```

### Triangle (PolyBLEP-integrated)

Uses leaky integration of a PolyBLEP square wave for proper anti-aliasing. A naive triangle has no discontinuities in the waveform itself, but the derivative has jumps. Integrating a bandlimited square produces a bandlimited triangle:

```cpp
float square = generateSquare(phase, dt);
triIntegrator = triIntegrator * 0.999f + square * 4.0f * dt;
```

The 0.999 leak factor prevents DC drift while maintaining waveform shape.

### Rectangle

PolyBLEP square/rectangle wave. Shape controls pulse width from 50% (square) to 99%:

```cpp
float pw = 0.5f + shape * 0.49f;
```

PolyBLEP is applied at both the rising edge (phase=0) and falling edge (phase=pw).

### Pulse

Distinct from Rectangle -- starts with a very narrow pulse width. Shape controls width from 5% to 45%:

```cpp
float pw = 0.05f + shape * 0.40f;
```

This produces the characteristic thin, nasal pulse sound.

### SharkTooth

Asymmetric triangle where Shape controls the position of the peak (slope ratio). Shape=0 gives a fast-rise/slow-fall ramp, Shape=0.5 gives symmetric triangle, Shape=1 gives slow-rise/fast-fall:

```cpp
float midpoint = 0.1f + shape * 0.8f;
```

Integrated PolyBLEP corrections are applied at slope discontinuities.

### Saturated

tanh waveshaping applied to a PolyBLEP saw wave. Shape controls drive amount from mild (1.5x) to heavy (6x):

```cpp
float drive = 1.5f + shape * 4.5f;
return std::tanh(drive * saw);
```

### Sine

Pure sine wave via `std::sin()`. No anti-aliasing needed (no harmonics above fundamental).

---

## Oscillator 2

Osc2 reuses the `Oscillator` class but is limited to the 5 `OscillatorType2` waveforms (Saw, Triangle, Sine, Rectangle, Saturated). It has no Shape control.

Additional parameters:
- **Transpose** (semitones): Coarse pitch offset. Drift default = -12 (one octave down)
- **Detune** (cents): Fine pitch offset for chorus/thickness effects

Frequency calculation:
```cpp
float osc2Freq = midiToFreq(midiNote + osc2Transpose);
if (osc2Detune != 0.0f)
    osc2Freq *= std::pow(2.0f, osc2Detune / 1200.0f);
```

---

## Noise Generator

### White Noise

Uses xorshift32 PRNG for efficient random number generation, scaled to [-1, 1]:

```cpp
float Noise::generateWhite() {
    rngState ^= rngState << 13;
    rngState ^= rngState >> 17;
    rngState ^= rngState << 5;
    return static_cast<float>(static_cast<int32_t>(rngState)) / 2147483648.0f;
}
```

### Pink Noise (Paul Kellet Algorithm)

Pink noise has equal energy per octave (-3dB/octave rolloff). Implemented using Paul Kellet's classic algorithm -- 6 first-order IIR filters applied to white noise:

```cpp
b0 = 0.99886f * b0 + white * 0.0555179f;
b1 = 0.99332f * b1 + white * 0.0750759f;
b2 = 0.96900f * b2 + white * 0.1538520f;
b3 = 0.86650f * b3 + white * 0.3104856f;
b4 = 0.55000f * b4 + white * 0.5329522f;
b5 = -0.7616f * b5 - white * 0.0168980f;
float pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362f;
b6 = white * 0.115926f;
```

Each filter has a different time constant, creating progressively lower frequency bands. The sum approximates the -3dB/octave characteristic of pink noise. Output is scaled by 0.11 to normalize to approximately [-1, 1].

---

## Mixer Architecture

The Mixer is a simple weighted sum of the three sound sources:

```
output = (osc1 * osc1Gain * osc1On) + (osc2 * osc2Gain * osc2On) + (noise * noiseLevel * noiseOn)
```

Parameters match Drift's mixer:
- **OscillatorGain1/2**: float, 0.0 to ~2.0 (rangeMax 1.995)
- **NoiseLevel**: float, 0.0 to ~2.0
- **OscillatorOn1/On2/NoiseOn**: bool on/off switches

The gain range exceeding 1.0 allows overdriving the mixer into the filter for additional harmonic content.

---

## Drift Default Values

| Parameter | Value | Notes |
|---|---|---|
| Osc1 Type | Saw | Main oscillator |
| Osc1 Gain | 0.5 | Half volume |
| Osc2 Type | Sine | Supporting oscillator |
| Osc2 Gain | 0.398 | Slightly less than Osc1 |
| Osc2 Transpose | -12 | One octave below |
| Osc2 Detune | 0.0 | No detuning |
| Noise Level | 0.0 | Off by default |
| All sources On | true | Enabled but noise at zero gain |

---

## Signal Flow

```
Osc1 (Saw, any of 7 types) ----\
                                 \
Osc2 (Sine, any of 5 types) -----> Mixer --> Filter (pass-through) --> Amp (Env1) --> Output
                                 /
Noise (White/Pink) -------------/
```

The filter remains a pass-through in Phase 2. Phase 3 will implement the Sallen-Key MS-20 filter and all 8 filter types.
