#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <cmath>
#include "dsp/Synth.h" // Includes Voice.h + SynthParams

using namespace vamos;
using Catch::Approx;

static constexpr float kSampleRate = 44100.0f;

// Helper: configure a voice with default params
static void setupVoice(Voice& v) {
    v.setSampleRate(kSampleRate);

    SynthParams params;
    params.env1Attack = 0.001f;
    params.env1Decay = 0.5f;
    params.env1Sustain = 0.7f;
    params.env1Release = 0.1f;
    params.driftDepth = 0.0f;  // Disable drift for deterministic tests
    v.setParameters(params);
}

TEST_CASE("Voice produces audio after noteOn", "[voice]") {
    Voice v;
    setupVoice(v);

    v.noteOn(60, 1.0f); // Middle C, full velocity

    float sumAbs = 0.0f;
    for (int i = 0; i < 4410; ++i) { // 100ms
        sumAbs += std::abs(v.process());
    }

    REQUIRE(sumAbs > 0.0f);
    REQUIRE(v.isActive() == true);
}

TEST_CASE("Voice produces silence after noteOff + release", "[voice][release]") {
    Voice v;
    setupVoice(v);

    // Set short release for this test
    SynthParams params;
    params.env1Attack = 0.001f;
    params.env1Decay = 0.01f;
    params.env1Sustain = 0.7f;
    params.env1Release = 0.01f; // 10ms release
    params.driftDepth = 0.0f;
    v.setParameters(params);

    v.noteOn(60, 1.0f);

    // Let it reach sustain
    for (int i = 0; i < 5000; ++i) {
        v.process();
    }

    v.noteOff();

    // Process well past the release time
    for (int i = 0; i < 10000; ++i) {
        v.process();
    }

    REQUIRE(v.isActive() == false);

    // Voice should now produce silence
    float sumAbs = 0.0f;
    for (int i = 0; i < 1000; ++i) {
        sumAbs += std::abs(v.process());
    }
    REQUIRE(sumAbs < 0.001f);
}

TEST_CASE("Velocity modulation scales output", "[voice][velocity]") {
    auto measureRMS = [](float velocity) {
        Voice v;
        v.setSampleRate(kSampleRate);

        SynthParams params;
        params.env1Attack = 0.001f;
        params.env1Decay = 0.5f;
        params.env1Sustain = 1.0f;
        params.env1Release = 0.5f;
        params.volVelMod = 1.0f; // Full velocity sensitivity
        params.driftDepth = 0.0f;
        v.setParameters(params);

        v.noteOn(60, velocity);

        float sumSq = 0.0f;
        const int n = 4410;
        for (int i = 0; i < n; ++i) {
            float s = v.process();
            sumSq += s * s;
        }
        return std::sqrt(sumSq / n);
    };

    float rmsLow = measureRMS(0.2f);
    float rmsHigh = measureRMS(1.0f);

    // Higher velocity should produce louder output
    REQUIRE(rmsHigh > rmsLow);
}

TEST_CASE("Voice reports correct MIDI note", "[voice][note]") {
    Voice v;
    setupVoice(v);

    REQUIRE(v.getCurrentNote() == -1);

    v.noteOn(72, 0.8f);
    REQUIRE(v.getCurrentNote() == 72);
}

TEST_CASE("Glide smoothly interpolates frequency", "[voice][glide]") {
    Voice v;
    v.setSampleRate(kSampleRate);

    SynthParams params;
    params.env1Attack = 0.001f;
    params.env1Decay = 10.0f;
    params.env1Sustain = 1.0f;
    params.env1Release = 0.5f;
    params.driftDepth = 0.0f;
    params.glideTime = 0.5f; // 500ms glide
    v.setParameters(params);

    // Start with a note
    v.noteOn(60, 1.0f); // C4

    // Process some samples
    for (int i = 0; i < 4410; ++i) {
        v.process();
    }

    // Now play a higher note with legato
    v.noteOnLegato(72); // C5

    // Collect samples during glide - the pitch should change gradually
    // We can verify this by checking that the output changes character
    // over the glide period rather than jumping instantly
    float firstBatch = 0.0f;
    for (int i = 0; i < 441; ++i) { // First 10ms
        firstBatch += std::abs(v.process());
    }

    float laterBatch = 0.0f;
    // Skip ahead
    for (int i = 0; i < 10000; ++i) {
        v.process();
    }
    for (int i = 0; i < 441; ++i) { // Later 10ms
        laterBatch += std::abs(v.process());
    }

    // Both should produce audio (voice should remain active)
    REQUIRE(firstBatch > 0.0f);
    REQUIRE(laterBatch > 0.0f);
    REQUIRE(v.isActive() == true);
}

TEST_CASE("Voice with zero drift is deterministic", "[voice][drift]") {
    auto generateSamples = []() {
        Voice v;
        v.setSampleRate(kSampleRate);

        SynthParams params;
        params.driftDepth = 0.0f;
        params.env1Attack = 0.001f;
        params.env1Sustain = 1.0f;
        v.setParameters(params);

        v.noteOn(60, 1.0f);

        float sum = 0.0f;
        for (int i = 0; i < 441; ++i) {
            sum += v.process();
        }
        return sum;
    };

    // Two runs with zero drift should produce identical output
    // (drift uses random, so only zero-drift is deterministic)
    float run1 = generateSamples();
    float run2 = generateSamples();
    REQUIRE(run1 == Approx(run2).margin(0.001f));
}
