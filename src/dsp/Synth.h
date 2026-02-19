#pragma once
#include "Voice.h"
#include <array>

namespace vamos {

// Voice mode -- matches Drift's VoiceModes enum.
enum class VoiceMode { Poly, Mono, Stereo, Unison };

// Polyphonic synth engine -- equivalent to Drift's VoiceModeHandler + PolyNoteAllocator<8, N>.
// Manages 8 voices across 4 voice modes.
static constexpr int kMaxVoices = 8;

// Parameter state passed from the JUCE processor to the DSP engine.
struct SynthParams {
    // Oscillator 1
    OscillatorType1 osc1Type = OscillatorType1::Saw;
    float osc1Shape = 0.0f;

    // Oscillator 2
    OscillatorType1 osc2Type = OscillatorType1::Sine;
    float osc2Detune = 0.0f;
    int osc2Transpose = -12;

    // Mixer
    float osc1Gain = 0.5f;
    float osc2Gain = 0.398f;
    float noiseLevel = 0.0f;
    NoiseType noiseType = NoiseType::White;
    bool osc1On = true;
    bool osc2On = true;
    bool noiseOn = true;

    // Filter
    FilterType filterType = FilterType::I;
    float filterFreq = 20000.0f;
    float filterRes = 0.0f;
    float filterTracking = 0.0f;

    // Envelope 1
    float env1Attack = 0.001f;
    float env1Decay = 0.6f;
    float env1Sustain = 0.7f;
    float env1Release = 0.6f;

    // LFO
    LfoShape lfoShape = LfoShape::Sine;
    float lfoRate = 0.4f;
    float lfoAmount = 1.0f;

    // Global / Voice Architecture (Phase 6)
    float driftDepth = 0.072f;
    float glideTime = 0.0f;         // seconds (0 = instant)
    VoiceMode voiceMode = VoiceMode::Poly;
    bool legato = false;
    float polyVoiceDepth = 0.0f;
    float monoVoiceDepth = 0.0f;
    float stereoVoiceDepth = 0.1f;  // detune between L/R voices
    float unisonVoiceDepth = 0.05f; // detune spread for unison voices

    // Global parameters (Phase 7)
    float volVelMod = 0.5f;         // velocity-to-volume sensitivity (0-1)
    int transpose = 0;              // global pitch shift in semitones (-24..+24)
    bool hiQuality = false;         // oversampling (stub)
    bool resetOscPhase = false;     // reset oscillator phase on note-on
    int pitchBendRange = 2;         // pitch bend range in semitones (1-24)
};

class Synth {
public:
    void setSampleRate(float sr);
    void noteOn(int midiNote, float velocity);
    void noteOff(int midiNote);

    // Apply parameter state from APVTS
    void setParameters(const SynthParams& params);

    // Render one stereo frame (left, right)
    std::pair<float, float> process();

    // Access voices for visualization
    const std::array<Voice, kMaxVoices>& getVoices() const { return voices; }

    // Access current voice mode for UI
    VoiceMode getVoiceMode() const { return voiceMode; }

    // Pitch bend (applied to all active voices)
    void setPitchBend(float semitones);

private:
    // Find a free voice, or steal the oldest one
    int allocateVoice();

    // Per-mode note handlers
    void noteOnPoly(int midiNote, float velocity);
    void noteOnMono(int midiNote, float velocity);
    void noteOnStereo(int midiNote, float velocity);
    void noteOnUnison(int midiNote, float velocity);
    void noteOffPoly(int midiNote);
    void noteOffMono(int midiNote);
    void noteOffStereo(int midiNote);
    void noteOffUnison(int midiNote);

    std::array<Voice, kMaxVoices> voices;
    // Track allocation order for voice stealing (oldest first)
    std::array<int, kMaxVoices> voiceAge{};
    int ageCounter = 0;
    float sampleRate = 44100.0f;

    SynthParams currentParams;

    // Voice mode state (Phase 6)
    VoiceMode voiceMode = VoiceMode::Poly;
    bool legato = false;
    float stereoVoiceDepth = 0.1f;
    float unisonVoiceDepth = 0.05f;

    // Pitch bend state
    int pitchBendRange = 2;  // semitones

    // Mono mode: held note stack for legato
    static constexpr int kMaxHeldNotes = 16;
    std::array<int, kMaxHeldNotes> heldNotes{};
    int heldNoteCount = 0;
    void pushHeldNote(int note);
    void removeHeldNote(int note);
};

} // namespace vamos
