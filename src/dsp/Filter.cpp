#include "Filter.h"

namespace vamos {

// Vowel formant frequencies (F1, F2, F3) for five vowels
// Source: standard formant tables for male voice
static constexpr float kVowelFormants[5][3] = {
    // a:    F1     F2     F3
    {  800,  1200,  2800 },
    // e:
    {  400,  2200,  2800 },
    // i:
    {  350,  2700,  3200 },
    // o:
    {  500,   800,  2800 },
    // u:
    {  350,   600,  2800 },
};

void Filter::setSampleRate(float sr) {
    sampleRate = sr;

    // Allocate comb buffer: max delay for 20 Hz at current sample rate
    int maxDelay = static_cast<int>(sr / 20.0f) + 1;
    combBuffer.resize(maxDelay, 0.0f);
}

void Filter::reset() {
    sallenKey1.reset();
    sallenKey2a.reset();
    sallenKey2b.reset();
    svf.reset();
    djLpf.reset();
    djHpf.reset();
    vowelBp1.reset();
    vowelBp2.reset();
    vowelBp3.reset();

    std::fill(combBuffer.begin(), combBuffer.end(), 0.0f);
    combWritePos = 0;

    resampleHoldValue = 0.0f;
    resampleCounter = 0.0f;
    hiPassY1 = 0.0f;
    hiPassX1 = 0.0f;
}

float Filter::applyTracking(float baseCutoff, int midiNote) const {
    if (params.tracking <= 0.0f || midiNote < 0)
        return baseCutoff;

    // Keyboard tracking: shift cutoff relative to middle C (MIDI 60)
    // Full tracking (1.0): cutoff follows pitch exactly
    float semitoneOffset = params.tracking * static_cast<float>(midiNote - 60);
    return baseCutoff * std::pow(2.0f, semitoneOffset / 12.0f);
}

float Filter::process(float osc1, float osc2, float noiseSample, int midiNote) {
    // Compute effective cutoff with keyboard tracking
    float cutoff = applyTracking(params.frequency, midiNote);
    cutoff = std::clamp(cutoff, 20.0f, 20000.0f);

    // Split signal into filtered and bypassed paths based on Through params
    float toFilter = 0.0f;
    float bypassed = 0.0f;

    if (params.oscThrough1)
        toFilter += osc1;
    else
        bypassed += osc1;

    if (params.oscThrough2)
        toFilter += osc2;
    else
        bypassed += osc2;

    if (params.noiseThrough)
        toFilter += noiseSample;
    else
        bypassed += noiseSample;

    // Apply the selected filter type
    float filtered = 0.0f;
    switch (params.type) {
        case FilterType::I:          filtered = processTypeI(toFilter, cutoff); break;
        case FilterType::II:         filtered = processTypeII(toFilter, cutoff); break;
        case FilterType::LowPass:    filtered = processLowPass(toFilter, cutoff); break;
        case FilterType::HighPass:   filtered = processHighPass(toFilter, cutoff); break;
        case FilterType::Comb:       filtered = processComb(toFilter, cutoff); break;
        case FilterType::Vowel:      filtered = processVowel(toFilter, cutoff); break;
        case FilterType::DJ:         filtered = processDJ(toFilter, cutoff); break;
        case FilterType::Resampling: filtered = processResampling(toFilter, cutoff); break;
    }

    // Combine filtered and bypassed
    float output = filtered + bypassed;

    // Apply secondary high-pass filter
    output = processHiPass(output);

    return output;
}

float Filter::processTypeI(float input, float cutoff) {
    // Single Sallen-Key stage: 12dB/oct, gentle and warm
    return sallenKey1.process(input, cutoff, params.resonance, sampleRate);
}

float Filter::processTypeII(float input, float cutoff) {
    // Two cascaded Sallen-Key stages: 24dB/oct, aggressive
    float stage1 = sallenKey2a.process(input, cutoff, params.resonance, sampleRate);
    return sallenKey2b.process(stage1, cutoff, params.resonance, sampleRate);
}

float Filter::processLowPass(float input, float cutoff) {
    auto out = svf.process(input, cutoff, params.resonance, sampleRate);
    return out.lp;
}

float Filter::processHighPass(float input, float cutoff) {
    auto out = svf.process(input, cutoff, params.resonance, sampleRate);
    return out.hp;
}

float Filter::processComb(float input, float cutoff) {
    if (combBuffer.empty()) return input;

    // Comb filter: delay line with feedback
    // Frequency parameter controls the delay time (pitch of the comb)
    float freq = std::clamp(cutoff, 20.0f, sampleRate * 0.49f);
    float delaySamplesF = sampleRate / freq;
    int delaySamples = static_cast<int>(delaySamplesF);
    delaySamples = std::clamp(delaySamples, 1, static_cast<int>(combBuffer.size()) - 1);

    // Linear interpolation for fractional delay
    float frac = delaySamplesF - static_cast<float>(delaySamples);
    int readPos1 = combWritePos - delaySamples;
    if (readPos1 < 0) readPos1 += static_cast<int>(combBuffer.size());
    int readPos2 = readPos1 - 1;
    if (readPos2 < 0) readPos2 += static_cast<int>(combBuffer.size());

    float delayed = combBuffer[readPos1] * (1.0f - frac) + combBuffer[readPos2] * frac;

    // Resonance controls feedback amount (0 = no feedback, 1 = high feedback)
    float feedback = params.resonance * 0.95f; // cap below 1.0 for stability

    combBuffer[combWritePos] = input + delayed * feedback;
    combWritePos++;
    if (combWritePos >= static_cast<int>(combBuffer.size()))
        combWritePos = 0;

    return input + delayed;
}

float Filter::processVowel(float input, float cutoff) {
    // Formant filter: 3 parallel bandpass filters at vowel formant frequencies.
    // Frequency parameter interpolates between vowels (a, e, i, o, u).

    // Map cutoff (20-20000) to vowel position (0-4)
    // Use log scale for more even distribution
    float logMin = std::log(20.0f);
    float logMax = std::log(20000.0f);
    float logCutoff = std::log(std::clamp(cutoff, 20.0f, 20000.0f));
    float vowelPos = (logCutoff - logMin) / (logMax - logMin) * 4.0f;
    vowelPos = std::clamp(vowelPos, 0.0f, 3.999f);

    // Interpolate between two adjacent vowels
    int idx = static_cast<int>(vowelPos);
    float frac = vowelPos - static_cast<float>(idx);

    float f1 = kVowelFormants[idx][0] * (1.0f - frac) + kVowelFormants[idx + 1][0] * frac;
    float f2 = kVowelFormants[idx][1] * (1.0f - frac) + kVowelFormants[idx + 1][1] * frac;
    float f3 = kVowelFormants[idx][2] * (1.0f - frac) + kVowelFormants[idx + 1][2] * frac;

    // Higher resonance = narrower formant bandwidths
    float formantRes = 0.5f + params.resonance * 0.45f;

    auto bp1 = vowelBp1.process(input, f1, formantRes, sampleRate);
    auto bp2 = vowelBp2.process(input, f2, formantRes, sampleRate);
    auto bp3 = vowelBp3.process(input, f3, formantRes, sampleRate);

    // Mix formants with decreasing amplitude for higher formants
    return bp1.bp * 0.5f + bp2.bp * 0.35f + bp3.bp * 0.15f;
}

float Filter::processDJ(float input, float cutoff) {
    // DJ filter: below center frequency = low-pass, above = high-pass.
    // Center frequency = geometric mean of range = sqrt(20 * 20000) ~ 632 Hz.
    // Resonance adds a peak at the crossover.

    float centerFreq = 632.0f;

    if (cutoff <= centerFreq) {
        // Low-pass region
        float lpRes = params.resonance * 0.5f;
        auto out = djLpf.process(input, cutoff, lpRes, sampleRate);
        return out.lp;
    } else {
        // High-pass region
        float hpRes = params.resonance * 0.5f;
        auto out = djHpf.process(input, cutoff, hpRes, sampleRate);
        return out.hp;
    }
}

float Filter::processResampling(float input, float cutoff) {
    // Bit-crush / sample-rate reduction.
    // Frequency controls the decimation factor:
    //   20000 Hz = decimation ~1 (transparent)
    //   20 Hz = maximum decimation

    float effectiveSR = std::clamp(cutoff, 20.0f, 20000.0f);
    float decimation = sampleRate / effectiveSR;

    resampleCounter += 1.0f;
    if (resampleCounter >= decimation) {
        resampleCounter -= decimation;
        resampleHoldValue = input;
    }

    return resampleHoldValue;
}

float Filter::processHiPass(float input) {
    // 1-pole high-pass filter for the secondary HP
    // Bypassed when frequency is at minimum (10 Hz)
    if (params.hiPassFrequency <= 10.0f)
        return input;

    float freq = std::clamp(params.hiPassFrequency, 10.0f, 20000.0f);

    // 1-pole HP: y[n] = alpha * (y[n-1] + x[n] - x[n-1])
    // alpha = RC / (RC + dt), where RC = 1/(2*pi*freq), dt = 1/sampleRate
    float rc = 1.0f / (2.0f * std::numbers::pi_v<float> * freq);
    float dt = 1.0f / sampleRate;
    float alpha = rc / (rc + dt);

    float y = alpha * (hiPassY1 + input - hiPassX1);
    hiPassX1 = input;
    hiPassY1 = y;

    return y;
}

} // namespace vamos
