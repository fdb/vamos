#pragma once

namespace vamos {

// Modulation sources available in Drift's modulation system.
// Maps to Drift's ModulationSources enum.
enum class ModSource {
    Env1,
    Env2Cyc,
    LFO,
    Velocity,
    Modwheel,
    Pressure,
    Slide,
    Key
};

// Envelope 2 mode: standard ADSR or cycling envelope.
enum class Envelope2Mode {
    Env,
    Cyc
};

// Per-voice modulation context, computed each sample.
// Holds the current value of every modulation source.
struct ModContext {
    float env1 = 0.0f;
    float env2Cyc = 0.0f;
    float lfo = 0.0f;
    float velocity = 0.0f;
    float modwheel = 0.0f;
    float pressure = 0.0f;
    float slide = 0.0f;
    float key = 0.0f;

    float get(ModSource src) const {
        switch (src) {
            case ModSource::Env1:     return env1;
            case ModSource::Env2Cyc:  return env2Cyc;
            case ModSource::LFO:      return lfo;
            case ModSource::Velocity: return velocity;
            case ModSource::Modwheel: return modwheel;
            case ModSource::Pressure: return pressure;
            case ModSource::Slide:    return slide;
            case ModSource::Key:      return key;
        }
        return 0.0f;
    }
};

} // namespace vamos
