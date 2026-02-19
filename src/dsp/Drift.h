#pragma once
#include <cmath>
#include <random>

namespace vamos {

// Per-voice slow random pitch wander — mimics analog oscillator instability.
// Generates a smoothly wandering value in the range [-1, +1] that is scaled
// by a depth parameter (in cents) before being applied to the oscillator pitch.
class AnalogDrift {
public:
    void setSampleRate(float sr) {
        sampleRate = sr;
        // One-pole smoothing rate: ~2 Hz corner for slow wander
        rate = 1.0f - std::exp(-2.0f * 3.14159f * 2.0f / sr);
        // How many samples between new target picks (~0.5-2 seconds)
        samplesPerTarget = static_cast<int>(sr * 1.0f); // ~1 second average
        counter = 0;
    }

    void reset() {
        value = 0.0f;
        target = 0.0f;
        counter = 0;
    }

    // Returns pitch offset in cents, scaled by depth.
    // depth is typically 0.0 - 1.0 (mapped to 0 - ~7 cents at default 0.072).
    float process(float depth) {
        // Pick a new random target periodically
        if (--counter <= 0) {
            // Random target in [-1, +1]
            std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
            target = dist(rng);
            // Randomize next interval: 0.5 to 2.0 seconds
            std::uniform_real_distribution<float> timeDist(0.5f, 2.0f);
            counter = static_cast<int>(timeDist(rng) * sampleRate);
        }

        // Smooth toward target with one-pole lowpass
        value += (target - value) * rate;

        // Scale: depth of 1.0 = ~100 cents of wander
        return value * depth * 100.0f;
    }

private:
    float value = 0.0f;
    float target = 0.0f;
    float rate = 0.001f;
    float sampleRate = 44100.0f;
    int counter = 0;
    int samplesPerTarget = 44100;
    std::mt19937 rng{std::random_device{}()};
};

} // namespace vamos
