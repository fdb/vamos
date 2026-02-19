#pragma once
#include "Oscillator.h"
#include "Envelope.h"
#include "Noise.h"
#include "Mixer.h"
#include "Filter.h"
#include "LFO.h"
#include "CyclingEnvelope.h"
#include "Modulation.h"
#include "Drift.h"

namespace vamos {

// Forward declaration
struct SynthParams;

// A single synth voice — equivalent to Ableton's DriftVoiceBlock.
// Signal flow: Osc1 + Osc2 + Noise -> Mixer gains -> Filter (with Through routing) -> Amp (Env1)
// Modulators: Env2, CyclingEnvelope, LFO — computed per-sample, stored in ModContext.
class Voice {
public:
    void setSampleRate(float sr);
    void noteOn(int midiNote, float velocity);
    void noteOnLegato(int midiNote);  // Change pitch without retriggering envelopes
    void noteOff();
    bool isActive() const { return ampEnv.isActive(); }
    int getCurrentNote() const { return currentNote; }

    // Apply parameter state from APVTS (called each block)
    void setParameters(const SynthParams& params);

    // Render one sample (mono -- stereo pair is at the Synth level)
    float process();

    // Glide control
    void setGlideTime(float seconds);
    float getGlideTime() const { return glideTime; }

    // Drift control
    void setDriftDepth(float depth) { driftDepth = depth; }
    float getDriftDepth() const { return driftDepth; }

    // Per-voice detune offset in cents (used for stereo/unison modes)
    void setDetuneOffset(float cents) { detuneOffset = cents; }
    float getDetuneOffset() const { return detuneOffset; }

    // Per-voice pan (-1 = full left, +1 = full right, 0 = center)
    void setPan(float p) { pan = p; }
    float getPan() const { return pan; }

    // Pitch bend (in semitones, applied to all oscillators)
    void setPitchBend(float semitones) { pitchBendValue = semitones; }

    // Access components for visualization
    const Oscillator& getOsc1() const { return osc1; }
    const Oscillator& getOsc2() const { return osc2; }
    const Noise& getNoise() const { return noise; }
    const Mixer& getMixer() const { return mixer; }
    const Filter& getFilter() const { return filter; }
    const Envelope& getAmpEnv() const { return ampEnv; }
    const LFO& getLfo() const { return lfo; }
    const CyclingEnvelope& getCycEnv() const { return cycEnv; }
    const Envelope& getModEnv() const { return modEnv; }
    const ModContext& getModContext() const { return modCtx; }
    const ModMatrix& getModMatrix() const { return modMatrix; }

    void setEnvelope2Mode(Envelope2Mode mode) { env2Mode = mode; }
    Envelope2Mode getEnvelope2Mode() const { return env2Mode; }

private:
    static float midiToFreq(int note);

    // === Active DSP blocks ===
    Oscillator osc1;
    Oscillator osc2;       // Osc2: uses Oscillator class, limited to Type2 waveforms
    Noise noise;
    Mixer mixer;
    Filter filter;
    Envelope ampEnv;

    // === Modulators (Phase 4) ===
    Envelope modEnv;            // Envelope 2 (ADSR mode)
    CyclingEnvelope cycEnv;     // Envelope 2 (Cycling mode)
    LFO lfo;
    Envelope2Mode env2Mode = Envelope2Mode::Env;
    ModContext modCtx;

    // === Modulation routing (Phase 5) ===
    ModMatrix modMatrix;        // Drift defaults set in constructor

    // === Analog Drift (Phase 6) ===
    AnalogDrift drift;
    float driftDepth = 0.072f;  // Drift preset default

    // === Glide / Portamento (Phase 6) ===
    float targetFreq = 440.0f;
    float currentFreq = 440.0f;
    float glideTime = 0.0f;     // seconds (0 = instant)
    float glideRate = 1.0f;     // calculated from glideTime and sampleRate

    // === Voice mode support (Phase 6) ===
    float detuneOffset = 0.0f;  // cents, for stereo/unison detuning
    float pan = 0.0f;           // -1..+1, for stereo mode panning

    // === Osc2 parameters ===
    float osc2Detune = 0.0f;     // cents
    int osc2Transpose = -12;     // semitones (Drift default: -1 octave)

    // === APVTS-driven filter parameters ===
    FilterType paramFilterType = FilterType::I;
    float paramFilterFreq = 20000.0f;
    float paramFilterRes = 0.0f;
    float paramFilterTracking = 0.0f;

    // === Global parameters (Phase 7) ===
    float volVelMod = 0.5f;
    int globalTranspose = 0;
    bool resetOscPhase = false;
    int pitchBendRange = 2;
    float pitchBendValue = 0.0f;    // current pitch bend in semitones

    // === State ===
    int currentNote = -1;
    float currentVelocity = 0.0f;
    float sampleRate = 44100.0f;
};

} // namespace vamos
