#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <cmath>
#include <numbers>
#include "dsp/Filter.h"

using namespace vamos;
using Catch::Approx;

static constexpr float kSampleRate = 44100.0f;

// Generate a sine wave sample at a given phase
static float sineSample(float freq, int sampleIndex, float sampleRate) {
    return std::sin(2.0f * std::numbers::pi_v<float> * freq * sampleIndex / sampleRate);
}

TEST_CASE("All 8 filter types don't produce NaN or Inf", "[filter][stability]") {
    const FilterType types[] = {
        FilterType::I, FilterType::II,
        FilterType::LowPass, FilterType::HighPass,
        FilterType::Comb, FilterType::Vowel,
        FilterType::DJ, FilterType::Resampling
    };

    for (auto type : types) {
        SECTION("Filter type " + std::to_string(static_cast<int>(type))) {
            Filter filter;
            filter.setSampleRate(kSampleRate);

            FilterParams params;
            params.type = type;
            params.frequency = 1000.0f;
            params.resonance = 0.8f;
            filter.setParams(params);

            for (int i = 0; i < 4410; ++i) {
                float input = sineSample(440.0f, i, kSampleRate);
                float output = filter.process(input, input, input, 60);

                REQUIRE_FALSE(std::isnan(output));
                REQUIRE_FALSE(std::isinf(output));
            }
        }
    }
}

TEST_CASE("Low-pass at 200 Hz attenuates 10 kHz signal", "[filter][lowpass]") {
    Filter filter;
    filter.setSampleRate(kSampleRate);

    FilterParams params;
    params.type = FilterType::LowPass;
    params.frequency = 200.0f;
    params.resonance = 0.0f;
    filter.setParams(params);

    // Measure RMS of 10 kHz signal through filter
    float sumSqInput = 0.0f;
    float sumSqOutput = 0.0f;
    const int numSamples = 44100;

    for (int i = 0; i < numSamples; ++i) {
        float input = sineSample(10000.0f, i, kSampleRate);
        float output = filter.process(input, input, input, 60);
        sumSqInput += input * input;
        sumSqOutput += output * output;
    }

    float rmsInput = std::sqrt(sumSqInput / numSamples);
    float rmsOutput = std::sqrt(sumSqOutput / numSamples);

    // 10 kHz should be heavily attenuated through a 200 Hz low-pass
    REQUIRE(rmsOutput < rmsInput * 0.1f);
}

TEST_CASE("Low-pass passes low frequency signal", "[filter][lowpass]") {
    Filter filter;
    filter.setSampleRate(kSampleRate);

    FilterParams params;
    params.type = FilterType::LowPass;
    params.frequency = 5000.0f;
    params.resonance = 0.0f;
    filter.setParams(params);

    float sumSqInput = 0.0f;
    float sumSqOutput = 0.0f;
    const int numSamples = 44100;

    for (int i = 0; i < numSamples; ++i) {
        float input = sineSample(100.0f, i, kSampleRate);
        float output = filter.process(input, input, input, 60);
        sumSqInput += input * input;
        sumSqOutput += output * output;
    }

    float rmsInput = std::sqrt(sumSqInput / numSamples);
    float rmsOutput = std::sqrt(sumSqOutput / numSamples);

    // 100 Hz through a 5 kHz LP should pass mostly unchanged
    REQUIRE(rmsOutput > rmsInput * 0.7f);
}

TEST_CASE("Filter reset clears internal state", "[filter][reset]") {
    Filter filter;
    filter.setSampleRate(kSampleRate);

    FilterParams params;
    params.type = FilterType::I;
    params.frequency = 1000.0f;
    params.resonance = 0.9f;
    filter.setParams(params);

    // Feed signal to build up internal state
    for (int i = 0; i < 1000; ++i) {
        float input = sineSample(440.0f, i, kSampleRate);
        filter.process(input, input, input, 60);
    }

    // Reset
    filter.reset();

    // After reset, processing silence should produce near-silence
    float maxAfterReset = 0.0f;
    for (int i = 0; i < 100; ++i) {
        float output = filter.process(0.0f, 0.0f, 0.0f, 60);
        maxAfterReset = std::max(maxAfterReset, std::abs(output));
    }

    REQUIRE(maxAfterReset < 0.01f);
}

TEST_CASE("Sallen-Key filter with high resonance doesn't blow up", "[filter][resonance]") {
    Filter filter;
    filter.setSampleRate(kSampleRate);

    FilterParams params;
    params.type = FilterType::I;
    params.frequency = 1000.0f;
    params.resonance = 0.99f; // Near self-oscillation
    filter.setParams(params);

    float maxOutput = 0.0f;
    for (int i = 0; i < 44100; ++i) {
        float input = (i < 100) ? 1.0f : 0.0f; // Impulse
        float output = filter.process(input, input, input, 60);

        REQUIRE_FALSE(std::isnan(output));
        REQUIRE_FALSE(std::isinf(output));
        maxOutput = std::max(maxOutput, std::abs(output));
    }

    // Should produce some resonant ringing but not explode
    REQUIRE(maxOutput < 100.0f);
}
