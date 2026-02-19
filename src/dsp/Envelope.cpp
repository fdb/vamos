#include "Envelope.h"
#include <algorithm>

namespace vamos {

float Envelope::calcCoeff(float timeSeconds, float sampleRate) {
    // Exponential curve: how much to multiply per sample to reach ~1/e in timeSeconds.
    // We target reaching 99.97% in the given time (exp(-6.9) ≈ 0.001).
    if (timeSeconds <= 0.0f) return 0.0f;
    return std::exp(-6.9f / (timeSeconds * sampleRate));
}

void Envelope::noteOn() {
    stage = Stage::Attack;
}

void Envelope::noteOff() {
    if (stage != Stage::Idle)
        stage = Stage::Release;
}

float Envelope::process() {
    switch (stage) {
        case Stage::Idle:
            return 0.0f;

        case Stage::Attack: {
            // Exponential attack toward 1.0
            float coeff = calcCoeff(params.attack, sampleRate);
            // Attack: exponential rise — we approach a target above 1.0 so we cross 1.0 faster
            level = 1.0f + (level - 1.0f) * coeff;
            if (level >= 0.999f) {
                level = 1.0f;
                stage = Stage::Decay;
            }
            return level;
        }

        case Stage::Decay: {
            float coeff = calcCoeff(params.decay, sampleRate);
            level = params.sustain + (level - params.sustain) * coeff;
            if (level <= params.sustain + 0.0001f) {
                level = params.sustain;
                stage = Stage::Sustain;
            }
            return level;
        }

        case Stage::Sustain:
            level = params.sustain;
            return level;

        case Stage::Release: {
            float coeff = calcCoeff(params.release, sampleRate);
            level *= coeff;
            if (level < 0.0001f) {
                level = 0.0f;
                stage = Stage::Idle;
            }
            return level;
        }
    }
    return 0.0f;
}

} // namespace vamos
