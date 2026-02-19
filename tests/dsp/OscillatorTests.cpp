#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <cmath>
#include "dsp/Oscillator.h"

using namespace vamos;
using Catch::Approx;

TEST_CASE("Phasor wraps 0 to 1 correctly", "[oscillator][phasor]") {
    Phasor p;
    p.reset(0.0f);

    const float sampleRate = 44100.0f;
    const float freq = 440.0f;

    // Run for one full cycle (sampleRate / freq samples)
    int samplesPerCycle = static_cast<int>(sampleRate / freq);
    for (int i = 0; i < samplesPerCycle * 3; ++i) {
        float phase = p.tick(freq, sampleRate);
        REQUIRE(phase >= 0.0f);
        REQUIRE(phase < 1.0f);
    }
}

TEST_CASE("Phasor completes one cycle and wraps", "[oscillator][phasor]") {
    Phasor p;
    p.reset(0.0f);

    const float sampleRate = 44100.0f;
    const float freq = 441.0f;

    // Run for slightly more than one cycle and verify the phase wraps at least once
    // (float accumulation means we can't rely on exact sample counts)
    int samplesPerCycle = static_cast<int>(sampleRate / freq); // 100
    bool wrapped = false;
    float prevPhase = 0.0f;

    for (int i = 0; i < samplesPerCycle + 10; ++i) {
        p.tick(freq, sampleRate);
        float phase = p.getPhase();
        if (phase < prevPhase - 0.5f) { // Detected a wrap (phase jumped back)
            wrapped = true;
            break;
        }
        prevPhase = phase;
    }

    REQUIRE(wrapped);
}

TEST_CASE("Saw oscillator at 440 Hz produces correct period length", "[oscillator][saw]") {
    Oscillator osc;
    osc.setType(OscillatorType1::Saw);
    osc.setFrequency(440.0f);
    osc.setSampleRate(44100.0f);
    osc.setShape(0.0f);
    osc.resetPhase();

    // Saw wave ramps from -1 to +1, then resets. PolyBLEP smooths the
    // transition over ~2 samples, so detect any downward jump > 1.0.
    float prev = osc.process();
    int resets = 0;

    for (int i = 1; i < 44100; ++i) { // 1 second = ~440 cycles
        float sample = osc.process();
        if (prev - sample > 1.0f) { // Saw reset detected
            resets++;
        }
        prev = sample;
    }

    // Should be approximately 440 resets in 1 second
    // (PolyBLEP can mask some resets at buffer boundaries, so allow +-15)
    REQUIRE(resets >= 425);
    REQUIRE(resets <= 455);
}

TEST_CASE("All 7 waveform types produce output in [-1, +1] range", "[oscillator][range]") {
    const OscillatorType1 types[] = {
        OscillatorType1::Saw,
        OscillatorType1::Triangle,
        OscillatorType1::Sine,
        OscillatorType1::Rectangle,
        OscillatorType1::Pulse,
        OscillatorType1::SharkTooth,
        OscillatorType1::Saturated
    };

    for (auto type : types) {
        SECTION("Waveform type " + std::to_string(static_cast<int>(type))) {
            Oscillator osc;
            osc.setType(type);
            osc.setFrequency(440.0f);
            osc.setSampleRate(44100.0f);
            osc.setShape(0.0f); // Use default shape to get full range
            osc.resetPhase();

            float minVal = 1.0f, maxVal = -1.0f;
            for (int i = 0; i < 44100; ++i) { // 1 second of audio
                float sample = osc.process();
                minVal = std::min(minVal, sample);
                maxVal = std::max(maxVal, sample);

                // Allow small overshoots from PolyBLEP but nothing extreme
                REQUIRE(sample >= -1.5f);
                REQUIRE(sample <= 1.5f);
            }

            // Should produce meaningful bipolar output
            REQUIRE(maxVal > 0.3f);
            REQUIRE(minVal < -0.3f);
        }
    }
}

TEST_CASE("Oscillator produces non-zero output", "[oscillator]") {
    Oscillator osc;
    osc.setType(OscillatorType1::Saw);
    osc.setFrequency(440.0f);
    osc.setSampleRate(44100.0f);
    osc.resetPhase();

    float sum = 0.0f;
    for (int i = 0; i < 1000; ++i) {
        sum += std::abs(osc.process());
    }
    REQUIRE(sum > 0.0f);
}

TEST_CASE("Oscillator shape parameter changes output", "[oscillator][shape]") {
    // Use Rectangle waveform where shape visibly changes pulse width
    // (shape=0: 50% duty square, shape=1: ~99% duty pulse).
    // Compare the actual sample buffers — they should differ.
    auto generateSamples = [](float shape) {
        Oscillator osc;
        osc.setType(OscillatorType1::Rectangle);
        osc.setFrequency(440.0f);
        osc.setSampleRate(44100.0f);
        osc.setShape(shape);
        osc.resetPhase();

        std::vector<float> samples(441);
        for (int i = 0; i < 441; ++i) {
            samples[i] = osc.process();
        }
        return samples;
    };

    auto samplesShape0 = generateSamples(0.0f);
    auto samplesShape1 = generateSamples(1.0f);

    // Count how many samples differ between the two shapes
    int diffCount = 0;
    for (size_t i = 0; i < samplesShape0.size(); ++i) {
        if (std::abs(samplesShape0[i] - samplesShape1[i]) > 0.01f) {
            diffCount++;
        }
    }

    // With different pulse widths, a significant portion of samples should differ
    REQUIRE(diffCount > 50);
}
