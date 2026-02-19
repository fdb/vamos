# Vamos Phase 7: Parameters and GUI

## What Was Implemented

Phase 7 connects the DSP engine to a full JUCE parameter system and interactive GUI:

1. **AudioProcessorValueTreeState (APVTS)** -- 30+ automatable parameters with proper ranges
2. **Parameter smoothing** -- `SmoothedValue` for volume, filter frequency, oscillator gains
3. **GUI controls** -- rotary knobs and combo boxes with APVTS attachment
4. **Custom LookAndFeel** -- dark theme with arc-style knobs
5. **Pitch bend MIDI handling** -- 14-bit wheel to semitone conversion
6. **All Notes Off / All Sound Off** -- CC-based panic handling
7. **State save/load** -- XML serialization of all parameters
8. **Velocity modulation** -- `volVelMod` parameter controlling velocity-to-volume sensitivity

## Files Modified

- `src/PluginProcessor.h/.cpp` -- Full APVTS parameter layout, smoothing, processBlock parameter reading, state save/load
- `src/PluginEditor.h/.cpp` -- Knob/combo controls with APVTS attachments, custom LookAndFeel, layout
- `src/dsp/Synth.h` -- `SynthParams` struct expanded with all Phase 7 parameters
- `src/dsp/Voice.h/.cpp` -- Velocity modulation, global transpose, pitch bend, phase reset

---

## APVTS Parameter Layout

All parameters are registered in `createParameterLayout()` with proper types and ranges:

### Parameter Table

| Parameter ID | Type | Range | Default | Purpose |
|-------------|------|-------|---------|---------|
| `osc1Type` | Choice | 7 options | Saw | Oscillator 1 waveform |
| `osc1Shape` | Float | 0-1 | 0.0 | Osc1 shape/pulse width |
| `osc2Type` | Choice | 5 options | Sine | Oscillator 2 waveform |
| `osc2Detune` | Float | -100..100 | 0 | Osc2 detune in cents |
| `osc2Transpose` | Int | -24..24 | -12 | Osc2 semitone offset |
| `osc1Gain` | Float | 0-2 | 0.5 | Osc1 mix level |
| `osc2Gain` | Float | 0-2 | 0.398 | Osc2 mix level |
| `noiseLevel` | Float | 0-2 | 0.0 | Noise mix level |
| `osc1On` | Bool | -- | true | Osc1 enable |
| `osc2On` | Bool | -- | true | Osc2 enable |
| `noiseOn` | Bool | -- | true | Noise enable |
| `filterType` | Choice | 8 options | I | Filter algorithm |
| `filterFreq` | Float | 20-20000 | 20000 | Filter cutoff (skewed) |
| `filterRes` | Float | 0-1 | 0.0 | Filter resonance |
| `filterTracking` | Float | 0-1 | 0.0 | Key tracking amount |
| `env1Attack` | Float | 0.001-6 | 0.001 | Amp envelope attack |
| `env1Decay` | Float | 0.01-10 | 0.6 | Amp envelope decay |
| `env1Sustain` | Float | 0-1 | 0.7 | Amp envelope sustain |
| `env1Release` | Float | 0.01-10 | 0.6 | Amp envelope release |
| `lfoShape` | Choice | 8 options | Sine | LFO waveform |
| `lfoRate` | Float | 0.01-30 | 0.4 | LFO frequency (Hz) |
| `lfoAmount` | Float | 0-1 | 1.0 | LFO modulation depth |
| `volume` | Float | 0-1 | 0.5 | Master volume |
| `voiceMode` | Choice | 4 options | Poly | Voice allocation mode |
| `glide` | Float | 0-1 | 0.0 | Portamento time |
| `driftDepth` | Float | 0-1 | 0.072 | Analog drift amount |
| `volVelMod` | Float | 0-1 | 0.5 | Velocity sensitivity |
| `transpose` | Int | -24..24 | 0 | Global pitch shift |
| `hiQuality` | Bool | -- | false | Oversampling (stub) |
| `resetOscPhase` | Bool | -- | false | Reset phase on note-on |
| `pitchBendRange` | Int | 1-24 | 2 | Pitch wheel range |

### Skewed Ranges

Filter frequency and envelope times use skewed `NormalisableRange` for perceptually linear control:

```cpp
// Skew factor 0.3 = logarithmic-ish -- most of the knob range covers low frequencies
juce::NormalisableRange<float>(20.0f, 20000.0f, 0.0f, 0.3f)

// Skew factor 0.4 for envelope times -- quick at start, slow at end
juce::NormalisableRange<float>(0.001f, 6.0f, 0.0f, 0.4f)
```

The 4th parameter to `NormalisableRange` is the skew factor. Values < 1.0 concentrate more of the knob range toward the low end (logarithmic feel), which matches how humans perceive frequency and time.

### Osc2 Type Mapping

Osc2 has 5 waveform choices (subset of Osc1's 7), so the choice index must be remapped to the `OscillatorType1` enum:

```cpp
// Choices: Saw(0), Triangle(1), Sine(2), Rectangle(3), Saturated(4)
// OscillatorType1: Saw(0), Triangle(1), Sine(2), Rectangle(3), Pulse(4), SharkTooth(5), Saturated(6)
sp.osc2Type = static_cast<OscillatorType1>(osc2TypeIdx <= 3 ? osc2TypeIdx : 6);
```

---

## Parameter Smoothing

Four critical parameters use `juce::SmoothedValue` to prevent audio clicks when values change:

```cpp
juce::SmoothedValue<float> smoothedVolume { 0.5f };
juce::SmoothedValue<float> smoothedFilterFreq { 20000.0f };
juce::SmoothedValue<float> smoothedOsc1Gain { 0.5f };
juce::SmoothedValue<float> smoothedOsc2Gain { 0.398f };
```

In `prepareToPlay()`, each smoother is configured with a ramp time:

```cpp
smoothedVolume.reset(sampleRate, 0.02);      // 20ms ramp
smoothedFilterFreq.reset(sampleRate, 0.005);  // 5ms ramp (faster for filter)
```

Then in the per-sample loop:

```cpp
for (int i = 0; i < numSamples; ++i) {
    float vol = smoothedVolume.getNextValue();
    auto [l, r] = synth.process();
    leftChan[i] = l * vol;
    rightChan[i] = r * vol;
}
```

Volume uses 20ms to avoid clicks. Filter frequency uses a shorter 5ms since filter sweeps should feel responsive.

---

## MIDI Processing

### Pitch Bend

MIDI pitch wheel is 14-bit (0-16383, center 8192). We normalize to [-1, +1] and scale by the configurable bend range:

```cpp
if (msg.isPitchWheel()) {
    float normalized = (msg.getPitchWheelValue() - 8192) / 8192.0f;
    synth.setPitchBend(normalized * static_cast<float>(pitchBendRange));
}
```

With the default `pitchBendRange = 2`, full wheel deflection bends +/- 2 semitones.

### Panic Messages

```cpp
if (msg.isAllNotesOff() || msg.isAllSoundOff()) {
    for (int n = 0; n < 128; ++n)
        synth.noteOff(n);
}
```

---

## GUI Architecture

### Custom LookAndFeel

The `VamosLookAndFeel` class provides a dark-themed UI with custom rotary knobs:

```cpp
void drawRotarySlider(Graphics& g, ...) {
    // Background arc (full range, dimmed)
    Path bgArc;
    bgArc.addCentredArc(..., rotaryStartAngle, rotaryEndAngle, true);
    g.setColour(kKnobOutline.withAlpha(0.4f));
    g.strokePath(bgArc, PathStrokeType(3.0f));

    // Value arc (current position, bright)
    Path valueArc;
    valueArc.addCentredArc(..., rotaryStartAngle, angle, true);
    g.setColour(kOscColour);
    g.strokePath(valueArc, PathStrokeType(3.0f));

    // Pointer dot
    g.setColour(Colours::white);
    g.fillEllipse(pointerX - 3, pointerY - 3, 6, 6);
}
```

### KnobWithLabel / ComboWithLabel Helpers

Each control is a struct bundling the widget, its label, and its APVTS attachment:

```cpp
struct KnobWithLabel {
    std::unique_ptr<juce::Slider> slider;
    std::unique_ptr<juce::Label> label;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> attachment;
};
```

The `createKnob()` factory method handles all boilerplate:

```cpp
KnobWithLabel createKnob(const String& paramId, const String& labelText) {
    KnobWithLabel kwl;
    kwl.slider = make_unique<Slider>(Slider::RotaryHorizontalVerticalDrag, Slider::NoTextBox);
    kwl.slider->setLookAndFeel(&getVamosLAF());
    addAndMakeVisible(kwl.slider.get());

    kwl.label = make_unique<Label>("", labelText);
    // ... font, color, justification ...
    addAndMakeVisible(kwl.label.get());

    kwl.attachment = make_unique<SliderAttachment>(processor.apvts, paramId, *kwl.slider);
    return kwl;
}
```

The `SliderAttachment` automatically synchronizes the slider with the APVTS parameter -- changes in either direction propagate instantly.

### Signal Flow Diagram

The top section of the GUI draws the complete signal chain as labeled blocks with arrows:

```
[Osc 1] ---> [Mixer] ---> [Filter] ---> [Amp] ---> [OUT]
[Osc 2] --->
[Noise] --->

Modulators: [Env 2] [CycEnv] [LFO] [ModMatrix] [Drift]

Voices: [1] [2] [3] [4] [5] [6] [7] [8]
```

Active voices light up green in real-time (refreshed at 30 Hz via `Timer`).

### Layout

Controls are organized into labeled sections:

| Row | Sections |
|-----|----------|
| Top | Signal flow diagram (painted, not interactive) |
| Middle | OSC 1, OSC 2, MIXER, FILTER, GLOBAL |
| Bottom | ENVELOPE (ADSR), LFO, PERFORMANCE (glide, transpose, vel, bend) |

---

## State Save/Load

Parameters are serialized to XML via APVTS:

```cpp
void getStateInformation(MemoryBlock& destData) {
    auto state = apvts.copyState();
    auto xml = state.createXml();
    copyXmlToBinary(*xml, destData);
}

void setStateInformation(const void* data, int sizeInBytes) {
    auto xml = getXmlFromBinary(data, sizeInBytes);
    if (xml && xml->hasTagName(apvts.state.getType()))
        apvts.replaceState(ValueTree::fromXml(*xml));
}
```

This handles DAW project save/recall automatically. The XML format includes all parameter values by their string IDs.

---

## Velocity Modulation

The `volVelMod` parameter controls how much MIDI velocity affects output volume:

- `volVelMod = 0.0` -- velocity has no effect (constant volume)
- `volVelMod = 0.5` -- velocity scales volume by ~50% range (Drift default)
- `volVelMod = 1.0` -- full velocity sensitivity

This is applied in the Voice's `process()` method using linear interpolation:

```cpp
float velScale = (1.0f - volVelMod) + volVelMod * currentVelocity;
return sample * velScale;
```

---

## Color Scheme

| Constant | Hex | Usage |
|----------|-----|-------|
| `kBackground` | `#1A1A2E` | Window background |
| `kOscColour` | `#4FC3F7` | Oscillator blocks, knob arcs |
| `kMixerColour` | `#FFB74D` | Mixer block |
| `kFilterColour` | `#E57373` | Filter block |
| `kAmpColour` | `#81C784` | Amp block, active voice indicators |
| `kModColour` | `#CE93D8` | Modulator blocks |
| `kKnobFill` | `#2A2A4E` | Combo box background |
| `kKnobOutline` | `#555588` | Knob/combo outlines |

---

## What's Complete

With Phase 7, the Vamos synthesizer has a fully functional parameter pipeline:

```
APVTS parameters (automatable)
    |
    v
processBlock() reads all values each block
    |
    v
SynthParams struct passed to Synth::setParameters()
    |
    v
Per-voice parameter application
    |
    v
SmoothedValue for click-free transitions
    |
    v
GUI knobs/combos with bidirectional sync
```

All 7 phases of the Drift architecture are now implemented. The synth produces audio with:
- 7 oscillator waveforms with shape control
- Dual oscillators with detune and transpose
- White/pink noise
- 8 filter types (Sallen-Key, SVF, Comb, Vowel, DJ, Resampling)
- ADSR amplitude envelope
- LFO (8 shapes), Cycling Envelope, Envelope 2
- 3-slot modulation matrix
- 4 voice modes (Poly/Mono/Stereo/Unison)
- Analog drift, glide/portamento
- Pitch bend, velocity sensitivity, global transpose
- Full preset save/load
