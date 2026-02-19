#pragma once
#include "Oscillator.h" // for Phasor

namespace vamos {

// Cycling Envelope — a looping modulator that rises and falls repeatedly.
// Equivalent to Drift's CyclingEnvelope.
// Output: unipolar 0-1.
class CyclingEnvelope {
public:
    void setSampleRate(float sr) { sampleRate = sr; }
    void setRate(float hz) { rate = hz; }
    void setMidPoint(float mp) { midPoint = mp; }
    void setHold(float h) { hold = h; }

    float getRate() const { return rate; }
    float getMidPoint() const { return midPoint; }
    float getHold() const { return hold; }

    void reset();
    float process();

private:
    float rate = 5.0f;
    float midPoint = 0.5f;  // 0=instant rise, 0.5=symmetric, 1=instant fall
    float hold = 0.0f;
    float sampleRate = 44100.0f;

    Phasor phasor;
};

} // namespace vamos
