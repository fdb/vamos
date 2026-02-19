#pragma once

namespace vamos {

// Mixer blends Osc1, Osc2, and Noise before feeding the filter.
// Matches Drift's Mixer parameters: OscillatorGain1/2, NoiseLevel, On/Off switches.
// Gain range: 0.0 to ~2.0 (rangeMax 1.995 from Drift preset analysis).
class Mixer {
public:
    void setOsc1Gain(float g) { osc1Gain = g; }
    void setOsc2Gain(float g) { osc2Gain = g; }
    void setNoiseLevel(float g) { noiseLevel = g; }

    void setOsc1On(bool on) { osc1On = on; }
    void setOsc2On(bool on) { osc2On = on; }
    void setNoiseOn(bool on) { noiseOn = on; }

    float getOsc1Gain() const { return osc1Gain; }
    float getOsc2Gain() const { return osc2Gain; }
    float getNoiseLevel() const { return noiseLevel; }

    bool isOsc1On() const { return osc1On; }
    bool isOsc2On() const { return osc2On; }
    bool isNoiseOn() const { return noiseOn; }

    // Mix the three sources into a single output
    float process(float osc1Sample, float osc2Sample, float noiseSample) const;

private:
    float osc1Gain = 0.5f;     // Drift default
    float osc2Gain = 0.398f;   // Drift default
    float noiseLevel = 0.0f;   // Drift default

    bool osc1On = true;
    bool osc2On = true;
    bool noiseOn = true;
};

} // namespace vamos
