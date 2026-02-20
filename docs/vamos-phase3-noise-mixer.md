# Vamos Phase 3: Noise, Mixer & Oscillator 2

## What Was Implemented

This phase was split from the original Phase 2 ("Sound Sources") to separate waveform implementation (Phase 2/EP02) from sound source mixing (Phase 3/EP03). Phase 2 now covers Oscillator 1 waveforms only, while this phase covers Oscillator 2, the Noise generator, and the Mixer that blends all three sources together.

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

The filter remains a pass-through in Phase 3. Phase 4 will implement the Sallen-Key MS-20 filter and all 8 filter types.
