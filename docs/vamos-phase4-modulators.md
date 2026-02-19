# Vamos Phase 4: Modulators

Phase 4 adds all modulation sources to the Vamos synth: Envelope 2, Cycling Envelope, LFO, and the ModContext system that will feed into modulation routing in Phase 5.

---

## What Was Implemented

### 1. LFO (src/dsp/LFO.h, LFO.cpp)

A low-frequency oscillator with 8 shapes, matching Drift's `LfoShapes` enum. Output is bipolar (-1 to +1) scaled by the Amount parameter.

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Shape | LfoShape enum | Sine | Waveform selection (8 shapes) |
| Rate | float (Hz) | 0.4 | Oscillation frequency |
| Amount | float (0-1) | 1.0 | Output scaling |
| Retrigger | bool | false | Reset phase on note-on |

**LFO Shapes with ASCII Waveforms:**

```
Sine:                    Triangle:
  +1 |    .--.             +1 |   /\
     |   /    \                |  /  \
   0 |--/------\---         0 |-/----\---
     |          \  /           |      \  /
  -1 |           --         -1 |       \/

SawUp:                   SawDown:
  +1 |      /|             +1 |\
     |    /  |                 |  \
   0 |  /   |---           0 |---\  ---
     |/     |                 |    \
  -1 |      |              -1 |     \|

Square:                  Sample & Hold:
  +1 |-----.                +1 |---.     .--
     |     |                   |   |     |
   0 |     |----            0 |   |-----|
     |          |              |
  -1 |          -----       -1 |

Wander:                  Exponential Env:
  +1 |  ~   ~              +1 |\
     | ~ ~ ~                   | \
   0 |~-----~---           0 |--\---------
     |                         |   \_____
  -1 |                      -1 |
```

**Shape Implementation Details:**
- **Sine**: `sin(2*PI*phase)` -- smooth, classic vibrato
- **Triangle**: Piecewise linear, `4*phase-1` rising, `3-4*phase` falling
- **SawUp**: `2*phase - 1` -- linear ramp up
- **SawDown**: `1 - 2*phase` -- linear ramp down
- **Square**: `phase < 0.5 ? +1 : -1` -- abrupt trill effect
- **Sample & Hold**: New random value generated on phase wrap, held between wraps
- **Wander**: Low-pass filtered random noise for smooth organic drift
- **Exponential Env**: `exp(-phase * 6)` -- decaying exponential, retriggers per cycle

### 2. Cycling Envelope (src/dsp/CyclingEnvelope.h, CyclingEnvelope.cpp)

A looping modulator that rises and falls repeatedly. Output is unipolar (0 to 1). Equivalent to Drift's CyclingEnvelope, used when Envelope2Mode is set to "Cyc".

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Rate | float (Hz) | 5.0 | Cycle frequency |
| MidPoint | float (0-1) | 0.5 | Rise/fall time ratio |
| Hold | float (0-1) | 0.0 | Hold time at peak (fraction of remaining cycle) |

**MidPoint Behavior:**

The MidPoint parameter controls the asymmetry of the rise/fall cycle:

```
MidPoint = 0.0 (instant rise, slow fall):
  1 |\
    | \
    |  \
    |   \
  0 |    \___

MidPoint = 0.5 (symmetric):
  1 |   /\
    |  /  \
    | /    \
    |/      \
  0 |

MidPoint = 1.0 (slow rise, instant fall):
  1 |       /|
    |     /  |
    |   /    |
    | /      |
  0 |        |
```

The cycle is divided into three phases:
1. **Rise**: From 0 to riseEnd (= MidPoint), output ramps 0 to 1
2. **Hold**: From riseEnd to riseEnd+holdFrac, output stays at 1
3. **Fall**: From riseEnd+holdFrac to 1.0, output ramps 1 to 0

### 3. Envelope 2 (Modulation Envelope)

Reuses the existing `Envelope` (ADSR) class with Drift's Env2 default values:
- Attack = 0.001s
- Decay = 0.6s
- Sustain = 0.2 (different from Env1's 0.7)
- Release = 0.6s

The `Envelope2Mode` enum controls whether the voice uses the ADSR envelope or the Cycling Envelope as the "Env 2 / Cyc" modulation source:
- `Envelope2Mode::Env` -- standard ADSR
- `Envelope2Mode::Cyc` -- cycling envelope

### 4. ModSource Enum and ModContext (src/dsp/ModContext.h)

```cpp
enum class ModSource {
    Env1, Env2Cyc, LFO, Velocity, Modwheel, Pressure, Slide, Key
};
```

The `ModContext` struct holds the current value of every modulation source, computed per-sample in the Voice:

| Source | Range | Nature |
|--------|-------|--------|
| Env1 | 0-1 | Amp envelope level |
| Env2Cyc | 0-1 | Env2 ADSR or CycEnv, depending on mode |
| LFO | -1 to +1 | LFO output * amount |
| Velocity | 0-1 | Note velocity, fixed at note-on |
| Modwheel | 0-1 | MIDI CC1 (to be wired in Phase 5) |
| Pressure | 0-1 | Aftertouch (to be wired in Phase 5) |
| Slide | 0-1 | MPE slide / CC74 (to be wired in Phase 5) |
| Key | ~-1 to +1 | Normalized MIDI note ((note - 60) / 60) |

`ModContext::get(ModSource src)` returns the current value for any source.

### 5. Voice Updates (src/dsp/Voice.h, Voice.cpp)

The Voice class now:
- Owns LFO, CyclingEnvelope, and modulation Envelope (modEnv) members
- Ticks all modulators every sample in `process()`
- Builds a complete ModContext each sample
- Exposes `getModContext()`, `getLfo()`, `getCycEnv()`, `getModEnv()` for visualization
- Supports `setEnvelope2Mode()` / `getEnvelope2Mode()` to toggle Env/Cyc mode

Modulation values are computed but **not wired to targets yet** -- that is Phase 5 (mod matrix + filter/pitch modulation routing).

---

## Mapping to Drift's Binary Classes

| Vamos Class | Drift Equivalent |
|-------------|-----------------|
| `LFO` | `ableton::blocks::drift::DriftLfo` |
| `CyclingEnvelope` | `ableton::devices::drift::CyclingEnvelope` |
| `Envelope` (modEnv) | Envelope 2 ADSR from `DriftVoiceBlock` |
| `ModSource` enum | `ableton::devices::drift::enums::ModulationSources` |
| `Envelope2Mode` enum | `ableton::devices::drift::enums::Envelope2Modes` |
| `ModContext` | Per-voice modulation state in `DriftVoiceBlock` |

---

## Files Added/Modified

**New files:**
- `src/dsp/LFO.h` / `LFO.cpp` -- LFO with 8 shapes
- `src/dsp/CyclingEnvelope.h` / `CyclingEnvelope.cpp` -- Looping modulator
- `src/dsp/ModContext.h` -- ModSource enum, Envelope2Mode enum, ModContext struct

**Modified files:**
- `src/dsp/Voice.h` -- Added modulator members and accessors
- `src/dsp/Voice.cpp` -- Tick modulators, build ModContext per-sample
- `src/PluginEditor.cpp` -- Env 2, Cycling Env, LFO blocks now active (not stubs)
- `CMakeLists.txt` -- Added LFO.cpp, CyclingEnvelope.cpp to target_sources

---

## Default Values Summary

| Parameter | Default | Source |
|-----------|---------|--------|
| LFO Shape | Sine | Drift preset `Lfo_Shape` |
| LFO Rate | 0.4 Hz | Drift preset `Lfo_Rate` |
| LFO Amount | 1.0 | Drift preset `Lfo_Amount` |
| LFO Retrigger | false | Drift preset `Lfo_Retrigger` |
| CycEnv Rate | 5.0 Hz | Drift preset `CyclingEnvelope_Rate` |
| CycEnv MidPoint | 0.5 | Drift preset `CyclingEnvelope_MidPoint` |
| CycEnv Hold | 0.0 | Drift preset `CyclingEnvelope_Hold` |
| Env2 Attack | 0.001s | Drift preset `Envelope2_Attack` |
| Env2 Decay | 0.6s | Drift preset `Envelope2_Decay` |
| Env2 Sustain | 0.2 | Drift preset `Envelope2_Sustain` |
| Env2 Release | 0.6s | Drift preset `Envelope2_Release` |
| Envelope2Mode | Env | Drift preset `Global_Envelope2Mode` |
