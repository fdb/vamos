#include "LFO.h"
#include <cmath>
#include <numbers>

namespace vamos {

float LFO::generateRandom() {
    // xorshift32
    rngState ^= rngState << 13;
    rngState ^= rngState >> 17;
    rngState ^= rngState << 5;
    return static_cast<float>(static_cast<int32_t>(rngState)) / 2147483648.0f;
}

void LFO::reset() {
    phasor.reset();
    prevPhase = 0.0f;
    shValue = 0.0f;
    wanderValue = 0.0f;
}

void LFO::noteOn() {
    if (retrigger)
        reset();
}

float LFO::generateSine(float phase) {
    return std::sin(2.0f * std::numbers::pi_v<float> * phase);
}

float LFO::generateTriangle(float phase) {
    if (phase < 0.5f)
        return 4.0f * phase - 1.0f;
    else
        return 3.0f - 4.0f * phase;
}

float LFO::generateSawUp(float phase) {
    return 2.0f * phase - 1.0f;
}

float LFO::generateSawDown(float phase) {
    return 1.0f - 2.0f * phase;
}

float LFO::generateSquare(float phase) {
    return phase < 0.5f ? 1.0f : -1.0f;
}

float LFO::generateSampleAndHold(float phase, bool wrapped) {
    if (wrapped)
        shValue = generateRandom();
    return shValue;
}

float LFO::generateWander() {
    // Smooth random walk: low-pass filtered random noise
    float noise = generateRandom();
    float smoothing = 1.0f - std::exp(-2.0f * std::numbers::pi_v<float> * rate / sampleRate);
    wanderValue += smoothing * (noise - wanderValue);
    return wanderValue;
}

float LFO::generateExponentialEnv(float phase) {
    return std::exp(-phase * 6.0f);
}

float LFO::process() {
    float phase = phasor.tick(rate, sampleRate);

    // Detect phase wrap for S&H
    bool wrapped = (phase > prevPhase + 0.5f) || (phase < prevPhase - 0.5f);
    // On first sample, don't trigger a wrap
    if (prevPhase == 0.0f && phase == 0.0f)
        wrapped = true; // initial trigger for S&H

    float raw = 0.0f;
    switch (shape) {
        case LfoShape::Sine:            raw = generateSine(phase); break;
        case LfoShape::Triangle:        raw = generateTriangle(phase); break;
        case LfoShape::SawUp:           raw = generateSawUp(phase); break;
        case LfoShape::SawDown:         raw = generateSawDown(phase); break;
        case LfoShape::Square:          raw = generateSquare(phase); break;
        case LfoShape::SampleAndHold:   raw = generateSampleAndHold(phase, wrapped); break;
        case LfoShape::Wander:          raw = generateWander(); break;
        case LfoShape::ExponentialEnv:  raw = generateExponentialEnv(phase); break;
    }

    prevPhase = phase;
    return raw * amount;
}

} // namespace vamos
