#pragma once
#include <cstdint>

namespace vamos {

enum class NoiseType {
    White,
    Pink
};

// Noise generator with White and Pink noise.
// White: xorshift32 PRNG scaled to [-1, 1]
// Pink: Paul Kellet's pink noise filter (3 first-order filters on white noise)
class Noise {
public:
    void setType(NoiseType t) { type = t; }
    NoiseType getType() const { return type; }
    void setSampleRate(float sr) { sampleRate = sr; }
    void reset();

    float process();

private:
    float generateWhite();
    float generatePink();

    NoiseType type = NoiseType::White;
    float sampleRate = 44100.0f;

    // xorshift32 state (non-zero seed)
    uint32_t rngState = 0x12345678;

    // Paul Kellet pink noise filter state
    float b0 = 0.0f;
    float b1 = 0.0f;
    float b2 = 0.0f;
    float b3 = 0.0f;
    float b4 = 0.0f;
    float b5 = 0.0f;
    float b6 = 0.0f;
};

} // namespace vamos
