# Vamos Phase 2: Sound Sources

> **Scope note:** This phase covers Oscillator 1 waveforms only (7 types + Shape parameter). Oscillator 2, Noise, and Mixer were moved to Phase 3 (see `vamos-phase3-noise-mixer.md`).

## What Was Implemented

Phase 2 adds Oscillator 1 waveforms to the Vamos synthesizer:

1. **Complete Oscillator 1 waveforms** (7 types with Shape support)

## Files Modified

- `src/dsp/Oscillator.h` / `.cpp` -- Improved waveforms, added Pulse, SharkTooth, Saturated, Shape support

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

