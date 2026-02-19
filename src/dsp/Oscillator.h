#pragma once
#include <cmath>
#include <numbers>

namespace vamos {

// Matches Ableton's OscillatorType1 enum
enum class OscillatorType1 {
    Saw,
    Triangle,
    Sine,
    Rectangle,
    Pulse,
    SharkTooth,
    Saturated
};

// Matches Ableton's OscillatorType2 enum
enum class OscillatorType2 {
    Saw,
    Triangle,
    Sine,
    Rectangle,
    Saturated
};

// Phase accumulator — equivalent to ableton::blocks::Phasor<float, Direction=0>
// Ramps from 0.0 to 1.0 at a given frequency.
class Phasor {
public:
    void reset(float startPhase = 0.0f) { phase = startPhase; }
    float getPhase() const { return phase; }

    // Advance phase by one sample. Returns the phase BEFORE the increment.
    float tick(float freqHz, float sampleRate) {
        float prev = phase;
        float inc = freqHz / sampleRate;
        phase += inc;
        if (phase >= 1.0f) phase -= 1.0f;
        if (phase < 0.0f) phase += 1.0f;
        phaseIncrement = inc;
        return prev;
    }

    float getIncrement() const { return phaseIncrement; }

private:
    float phase = 0.0f;
    float phaseIncrement = 0.0f;
};

// Main oscillator with PolyBLEP anti-aliasing.
// Supports all 7 OscillatorType1 waveforms with Shape parameter.
class Oscillator {
public:
    void setType(OscillatorType1 type) { oscType = type; }
    OscillatorType1 getType() const { return oscType; }

    void setShape(float s) { shape = s; }
    void setFrequency(float hz) { frequency = hz; }
    void setSampleRate(float sr) { sampleRate = sr; }
    void resetPhase() { phasor.reset(); }

    // Render one sample
    float process();

private:
    // PolyBLEP correction for discontinuities (reduces aliasing).
    // t = phase position of the discontinuity, dt = phase increment per sample.
    static float polyBlep(float t, float dt);

    float generateSaw(float phase, float dt);
    float generateSine(float phase);
    float generateTriangle(float phase, float dt);
    float generateRectangle(float phase, float dt);
    float generatePulse(float phase, float dt);
    float generateSharkTooth(float phase, float dt);
    float generateSaturated(float phase, float dt);

    // Square wave used for triangle integration
    float generateSquare(float phase, float dt);

    Phasor phasor;
    OscillatorType1 oscType = OscillatorType1::Saw;
    float frequency = 440.0f;
    float sampleRate = 44100.0f;
    float shape = 0.0f;

    // Leaky integrator state for PolyBLEP triangle
    float triIntegrator = 0.0f;
};

} // namespace vamos
