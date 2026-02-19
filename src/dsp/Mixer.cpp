#include "Mixer.h"

namespace vamos {

float Mixer::process(float osc1Sample, float osc2Sample, float noiseSample) const {
    float out = 0.0f;
    if (osc1On)  out += osc1Sample * osc1Gain;
    if (osc2On)  out += osc2Sample * osc2Gain;
    if (noiseOn) out += noiseSample * noiseLevel;
    return out;
}

} // namespace vamos
