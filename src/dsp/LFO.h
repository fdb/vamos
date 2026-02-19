#pragma once
#include "Oscillator.h" // for Phasor
#include <cstdint>

namespace vamos {

enum class LfoShape {
    Sine,
    Triangle,
    SawUp,
    SawDown,
    Square,
    SampleAndHold,
    Wander,
    ExponentialEnv
};

// Low-Frequency Oscillator with 8 shapes.
// Equivalent to Drift's DriftLfo / LfoShapes.
// Output: bipolar (-1 to +1) * amount.
class LFO {
public:
    void setSampleRate(float sr) { sampleRate = sr; }
    void setShape(LfoShape s) { shape = s; }
    void setRate(float hz) { rate = hz; }
    void setAmount(float a) { amount = a; }
    void setRetrigger(bool r) { retrigger = r; }

    LfoShape getShape() const { return shape; }
    float getRate() const { return rate; }
    float getAmount() const { return amount; }
    bool getRetrigger() const { return retrigger; }

    // Reset phase (called on note-on when retrigger is enabled)
    void reset();

    // Called on note-on to handle retrigger
    void noteOn();

    // Render one sample, returns bipolar output (-1..+1) * amount
    float process();

private:
    float generateSine(float phase);
    float generateTriangle(float phase);
    float generateSawUp(float phase);
    float generateSawDown(float phase);
    float generateSquare(float phase);
    float generateSampleAndHold(float phase, bool wrapped);
    float generateWander();
    float generateExponentialEnv(float phase);

    LfoShape shape = LfoShape::Sine;
    float rate = 0.4f;
    float amount = 1.0f;
    bool retrigger = false;
    float sampleRate = 44100.0f;

    Phasor phasor;
    float prevPhase = 0.0f;

    // Sample & Hold state
    float shValue = 0.0f;

    // Wander state: filtered random walk
    float wanderValue = 0.0f;
    uint32_t rngState = 0xDEADBEEF;

    float generateRandom();
};

} // namespace vamos
