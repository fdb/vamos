#pragma once
#include <cmath>
#include <numbers>
#include <vector>
#include <algorithm>

namespace vamos {

enum class FilterType {
    I,          // Sallen-Key MS-20, 12dB/oct (gentle, warm)
    II,         // Sallen-Key MS-20, 24dB/oct (aggressive)
    LowPass,    // Standard SVF low-pass
    HighPass,   // Standard SVF high-pass
    Comb,       // Delay line with feedback
    Vowel,      // Formant filter (a, e, i, o, u)
    DJ,         // Combined LP/HP crossover
    Resampling  // Bit-crush / sample-rate reduction
};

struct FilterParams {
    FilterType type = FilterType::I;
    float frequency = 20000.0f;     // 20-20000 Hz (Drift default: wide open)
    float resonance = 0.0f;         // 0-1 (Drift default: no resonance)
    float hiPassFrequency = 10.0f;  // secondary HP filter
    float tracking = 0.0f;          // keyboard tracking amount
    bool oscThrough1 = true;        // whether Osc1 goes through filter
    bool oscThrough2 = true;
    bool noiseThrough = true;
};

// Semi-discretized 2-pole (12dB/oct) SVF-style Sallen-Key filter
// Inspired by the Korg MS-20 filter with tanh saturation in the feedback path.
class SallenKeyFilter {
public:
    void reset() { s1 = 0.0f; s2 = 0.0f; }

    float process(float input, float cutoffHz, float resonance, float sampleRate) {
        // Clamp cutoff to safe range
        cutoffHz = std::clamp(cutoffHz, 20.0f, sampleRate * 0.49f);

        float g = std::tan(std::numbers::pi_v<float> * cutoffHz / sampleRate);
        // Resonance: 0 = no resonance, 1 = max resonance
        // k: 2 (no res) down to 0 (self-oscillation)
        float k = 2.0f * (1.0f - resonance);

        // Semi-discretized SVF
        float g1 = g / (1.0f + g);
        float hp = (input - (k + g) * s1 - s2) / (1.0f + g * (k + g));
        float bp = g1 * hp + s1;
        float lp = g1 * bp + s2;

        // Update state
        s1 = 2.0f * bp - s1;
        s2 = 2.0f * lp - s2;

        // MS-20 saturation: tanh on the feedback path state
        s1 = std::tanh(s1);

        return lp;
    }

private:
    float s1 = 0.0f;
    float s2 = 0.0f;
};

// Standard state variable filter for LP/HP modes
class StateVariableFilter {
public:
    void reset() { ic1eq = 0.0f; ic2eq = 0.0f; }

    // Returns {lowpass, highpass, bandpass}
    struct Output { float lp; float hp; float bp; };

    Output process(float input, float cutoffHz, float resonance, float sampleRate) {
        cutoffHz = std::clamp(cutoffHz, 20.0f, sampleRate * 0.49f);

        float g = std::tan(std::numbers::pi_v<float> * cutoffHz / sampleRate);
        float k = 2.0f * (1.0f - resonance);  // damping

        float a1 = 1.0f / (1.0f + g * (g + k));
        float a2 = g * a1;
        float a3 = g * a2;

        float v3 = input - ic2eq;
        float v1 = a1 * ic1eq + a2 * v3;
        float v2 = ic2eq + a2 * ic1eq + a3 * v3;

        ic1eq = 2.0f * v1 - ic1eq;
        ic2eq = 2.0f * v2 - ic2eq;

        float lp = v2;
        float bp = v1;
        float hp = input - k * bp - lp;

        return {lp, hp, bp};
    }

private:
    float ic1eq = 0.0f;
    float ic2eq = 0.0f;
};

// Main filter class with all 8 filter types.
// Equivalent to ableton::blocks::drift::DriftFilter / SallenK_MS2_SD_LP.
class Filter {
public:
    void setSampleRate(float sr);
    void setParams(const FilterParams& p) { params = p; }
    void reset();

    // Process with separate source signals for Through routing.
    // osc1, osc2, noise are individual source signals.
    // Returns the combined output (filtered + bypassed).
    float process(float osc1, float osc2, float noiseSample, int midiNote);

private:
    // Apply keyboard tracking to cutoff
    float applyTracking(float baseCutoff, int midiNote) const;

    // Individual filter type processors
    float processTypeI(float input, float cutoff);
    float processTypeII(float input, float cutoff);
    float processLowPass(float input, float cutoff);
    float processHighPass(float input, float cutoff);
    float processComb(float input, float cutoff);
    float processVowel(float input, float cutoff);
    float processDJ(float input, float cutoff);
    float processResampling(float input, float cutoff);

    // Secondary high-pass filter (always active)
    float processHiPass(float input);

    FilterParams params;
    float sampleRate = 44100.0f;

    // Type I: single Sallen-Key stage (12dB/oct)
    SallenKeyFilter sallenKey1;

    // Type II: two cascaded Sallen-Key stages (24dB/oct)
    SallenKeyFilter sallenKey2a;
    SallenKeyFilter sallenKey2b;

    // Standard SVF for LP/HP modes
    StateVariableFilter svf;

    // DJ filter uses two SVFs
    StateVariableFilter djLpf;
    StateVariableFilter djHpf;

    // Comb filter delay buffer
    std::vector<float> combBuffer;
    int combWritePos = 0;

    // Vowel filter: 3 parallel bandpass SVFs
    StateVariableFilter vowelBp1;
    StateVariableFilter vowelBp2;
    StateVariableFilter vowelBp3;

    // Resampling state
    float resampleHoldValue = 0.0f;
    float resampleCounter = 0.0f;

    // Secondary high-pass (1-pole) state
    float hiPassY1 = 0.0f;
    float hiPassX1 = 0.0f;
};

} // namespace vamos
