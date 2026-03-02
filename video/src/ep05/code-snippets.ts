// Episode 5: Modulators — code snippets from actual C++ source

// LFO.cpp:27-66 — Eight LFO shape generators (compact)
export const LFO_SHAPES_CODE = `float generateSine(float phase) {
    return std::sin(2.0f * PI * phase);
}
float generateTriangle(float phase) {
    return phase < 0.5f ? 4.0f * phase - 1.0f
                        : 3.0f - 4.0f * phase;
}
float generateSawUp(float phase) {
    return 2.0f * phase - 1.0f;
}
float generateSquare(float phase) {
    return phase < 0.5f ? 1.0f : -1.0f;
}
float generateSampleAndHold(float phase, bool wrapped) {
    if (wrapped) shValue = generateRandom();
    return shValue;
}
float generateWander() {
    float noise = generateRandom();
    float smoothing = 1.0f - std::exp(
        -2.0f * PI * rate / sampleRate);
    wanderValue += smoothing * (noise - wanderValue);
    return wanderValue;
}`;

// LFO.cpp:68-91 — process() with switch + amount scaling
export const LFO_PROCESS_CODE = `float LFO::process() {
    float phase = phasor.tick(rate, sampleRate);

    bool wrapped = (phase > prevPhase + 0.5f)
                || (phase < prevPhase - 0.5f);

    float raw = 0.0f;
    switch (shape) {
        case Sine:          raw = generateSine(phase); break;
        case Triangle:      raw = generateTriangle(phase); break;
        case SawUp:         raw = generateSawUp(phase); break;
        case SawDown:       raw = generateSawDown(phase); break;
        case Square:        raw = generateSquare(phase); break;
        case SampleAndHold: raw = generateSampleAndHold(phase, wrapped); break;
        case Wander:        raw = generateWander(); break;
        case ExponentialEnv:raw = generateExponentialEnv(phase); break;
    }

    prevPhase = phase;
    return raw * amount;
}`;

// CyclingEnvelope.cpp:10-38 — complete process() function
export const CYCLING_ENV_CODE = `float CyclingEnvelope::process() {
    float phase = phasor.tick(rate, sampleRate);

    // MidPoint divides the cycle into rise and fall.
    // 0: instant rise, slow fall  (plucked string)
    // 0.5: symmetric rise and fall
    // 1: slow rise, instant fall  (swell cutoff)
    float riseEnd = std::clamp(midPoint, 0.001f, 0.999f);

    float holdFrac = std::clamp(
        hold, 0.0f, 1.0f - riseEnd - 0.001f);
    float fallStart = riseEnd + holdFrac;

    if (phase < riseEnd) {
        return phase / riseEnd;          // Rise: 0→1
    } else if (phase < fallStart) {
        return 1.0f;                     // Hold at peak
    } else {
        float fallDuration = 1.0f - fallStart;
        if (fallDuration < 0.001f) return 0.0f;
        return 1.0f - (phase - fallStart) // Fall: 1→0
                     / fallDuration;
    }
}`;

// ModContext.h:26-49 — Per-voice modulation context struct
export const MOD_CONTEXT_CODE = `struct ModContext {
    float env1     = 0.0f;
    float env2Cyc  = 0.0f;
    float lfo      = 0.0f;
    float velocity = 0.0f;
    float modwheel = 0.0f;
    float pressure = 0.0f;
    float slide    = 0.0f;
    float key      = 0.0f;

    float get(ModSource src) const {
        switch (src) {
            case Env1:     return env1;
            case Env2Cyc:  return env2Cyc;
            case LFO:      return lfo;
            case Velocity: return velocity;
            case Modwheel: return modwheel;
            case Pressure: return pressure;
            case Slide:    return slide;
            case Key:      return key;
        }
        return 0.0f;
    }
};`;

// Modulation.h:33-62 — ModMatrix struct with resolveTarget()
export const MOD_MATRIX_CODE = `struct ModMatrix {
    // 3 general-purpose slots (source/amount/target)
    std::array<ModSlot, 3> slots;

    // Dedicated filter cutoff mod (2 slots)
    ModSource filterModSource1 = Env2Cyc;
    float     filterModAmount1 = 0.8f;
    ModSource filterModSource2 = Pressure;
    float     filterModAmount2 = 0.15f;

    // Dedicated pitch mod (2 slots)
    ModSource pitchModSource1 = Env2Cyc;
    float     pitchModAmount1 = 0.0f;
    ModSource pitchModSource2 = LFO;
    float     pitchModAmount2 = 0.0f;

    // Osc1 shape mod
    ModSource shapeModSource = Velocity;
    float     shapeModAmount = 0.0f;

    float resolveTarget(ModTarget target,
                        const ModContext& ctx) const {
        float total = 0.0f;
        for (auto& slot : slots) {
            if (slot.target == target)
                total += ctx.get(slot.source) * slot.amount;
        }
        return total;
    }
};`;

// Voice.cpp:162-176 — Building ModContext per sample
export const VOICE_MOD_CODE = `// 1. Tick all modulators and build ModContext
float env1Val   = ampEnv.getLevel();
float modEnvVal = modEnv.process();
float cycEnvVal = cycEnv.process();
float lfoVal    = lfo.process();

modCtx.env1    = env1Val;
modCtx.env2Cyc = (env2Mode == Env)
                   ? modEnvVal : cycEnvVal;
modCtx.lfo      = lfoVal;
modCtx.velocity = currentVelocity;
modCtx.modwheel = 0.0f;
modCtx.pressure = 0.0f;
modCtx.slide    = 0.0f;
modCtx.key = (float(currentNote) - 60.0f) / 60.0f;`;
