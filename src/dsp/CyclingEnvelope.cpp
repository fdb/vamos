#include "CyclingEnvelope.h"
#include <algorithm>

namespace vamos {

void CyclingEnvelope::reset() {
    phasor.reset();
}

float CyclingEnvelope::process() {
    float phase = phasor.tick(rate, sampleRate);

    // MidPoint divides the cycle into rise and fall portions.
    // midPoint=0: instant rise (no rise phase), slow fall
    // midPoint=0.5: symmetric rise and fall
    // midPoint=1: slow rise, instant fall (no fall phase)

    // Clamp to avoid division by zero
    float riseEnd = std::clamp(midPoint, 0.001f, 0.999f);

    // Account for hold: hold takes time from the fall phase
    // Total cycle: rise [0..riseEnd] + hold [riseEnd..riseEnd+holdFrac] + fall [riseEnd+holdFrac..1]
    float holdFrac = std::clamp(hold, 0.0f, 1.0f - riseEnd - 0.001f);
    float fallStart = riseEnd + holdFrac;

    if (phase < riseEnd) {
        // Rise phase: 0 to 1
        return phase / riseEnd;
    } else if (phase < fallStart) {
        // Hold phase: stay at 1
        return 1.0f;
    } else {
        // Fall phase: 1 to 0
        float fallDuration = 1.0f - fallStart;
        if (fallDuration < 0.001f) return 0.0f;
        return 1.0f - (phase - fallStart) / fallDuration;
    }
}

} // namespace vamos
