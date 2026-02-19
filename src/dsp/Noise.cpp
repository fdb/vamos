#include "Noise.h"

namespace vamos {

void Noise::reset() {
    rngState = 0x12345678;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0f;
}

float Noise::generateWhite() {
    // xorshift32 PRNG
    rngState ^= rngState << 13;
    rngState ^= rngState >> 17;
    rngState ^= rngState << 5;
    // Convert to float in [-1, 1]
    return static_cast<float>(static_cast<int32_t>(rngState)) / 2147483648.0f;
}

float Noise::generatePink() {
    // Paul Kellet's pink noise filter applied to white noise.
    // Uses 6 first-order IIR filters to approximate -3dB/octave rolloff.
    float white = generateWhite();

    b0 = 0.99886f * b0 + white * 0.0555179f;
    b1 = 0.99332f * b1 + white * 0.0750759f;
    b2 = 0.96900f * b2 + white * 0.1538520f;
    b3 = 0.86650f * b3 + white * 0.3104856f;
    b4 = 0.55000f * b4 + white * 0.5329522f;
    b5 = -0.7616f * b5 - white * 0.0168980f;

    float pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362f;
    b6 = white * 0.115926f;

    // Scale to approximately [-1, 1]
    return pink * 0.11f;
}

float Noise::process() {
    switch (type) {
        case NoiseType::White: return generateWhite();
        case NoiseType::Pink:  return generatePink();
    }
    return 0.0f;
}

} // namespace vamos
