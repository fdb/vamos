#pragma once
#include <cmath>

namespace vamos {

// ADSR Envelope — equivalent to Drift's Envelope1 (amplitude) and Envelope2 (modulation).
// Uses exponential curves for natural-sounding attack/decay/release.
class Envelope {
public:
    enum class Stage { Idle, Attack, Decay, Sustain, Release };

    struct Params {
        float attack  = 0.001f; // seconds (Drift default)
        float decay   = 0.6f;   // seconds
        float sustain = 0.7f;   // level 0-1
        float release = 0.6f;   // seconds
    };

    void setSampleRate(float sr) { sampleRate = sr; }
    void setParams(const Params& p) { params = p; }
    void noteOn();
    void noteOff();
    float process();
    bool isActive() const { return stage != Stage::Idle; }
    Stage getStage() const { return stage; }
    float getLevel() const { return level; }

private:
    // Calculate exponential coefficient for a given time constant
    static float calcCoeff(float timeSeconds, float sampleRate);

    Params params;
    Stage stage = Stage::Idle;
    float level = 0.0f;
    float sampleRate = 44100.0f;
};

} // namespace vamos
