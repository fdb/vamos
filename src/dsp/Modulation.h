#pragma once
#include "ModContext.h"
#include <array>

namespace vamos {

// Modulation matrix target destinations.
// Maps to Drift's ModMatrixModulationTarget enum (12 targets).
enum class ModTarget {
    None,
    LPFrequency,
    HPFrequency,
    LPResonance,
    Osc1Shape,
    Osc1Gain,
    Osc2Detune,
    Osc2Gain,
    NoiseGain,
    LFORate,
    CycEnvRate,
    MainVolume
};

// A single routing slot in the general-purpose mod matrix.
struct ModSlot {
    ModSource source = ModSource::Env1;
    float amount = 0.0f;
    ModTarget target = ModTarget::None;
};

// Complete modulation routing configuration.
// Contains dedicated filter/pitch mod slots plus the 3-slot general matrix.
struct ModMatrix {
    // --- 3 general-purpose slots (user-assignable source/amount/target) ---
    std::array<ModSlot, 3> slots;

    // --- Dedicated filter cutoff modulation (2 slots) ---
    ModSource filterModSource1 = ModSource::Env2Cyc;
    float filterModAmount1 = 0.8f;
    ModSource filterModSource2 = ModSource::Pressure;
    float filterModAmount2 = 0.15f;

    // --- Dedicated pitch modulation (2 slots) ---
    ModSource pitchModSource1 = ModSource::Env2Cyc;
    float pitchModAmount1 = 0.0f;
    ModSource pitchModSource2 = ModSource::LFO;
    float pitchModAmount2 = 0.0f;

    // --- Osc1 shape modulation ---
    ModSource shapeModSource = ModSource::Velocity;
    float shapeModAmount = 0.0f;

    // Resolve the total modulation offset for a given target from general slots.
    // Returns the sum of (source_value * amount) for all slots targeting this destination.
    float resolveTarget(ModTarget target, const ModContext& ctx) const {
        float total = 0.0f;
        for (auto& slot : slots) {
            if (slot.target == target)
                total += ctx.get(slot.source) * slot.amount;
        }
        return total;
    }
};

} // namespace vamos
