#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <cmath>
#include "dsp/Synth.h"

using namespace vamos;
using Catch::Approx;

static constexpr float kSampleRate = 44100.0f;

static Synth createSynth() {
    Synth s;
    s.setSampleRate(kSampleRate);

    SynthParams params;
    params.env1Attack = 0.001f;
    params.env1Decay = 0.5f;
    params.env1Sustain = 0.7f;
    params.env1Release = 0.1f;
    params.driftDepth = 0.0f;
    params.voiceMode = VoiceMode::Poly;
    s.setParameters(params);

    return s;
}

static int countActiveVoices(const Synth& s) {
    int count = 0;
    for (const auto& v : s.getVoices()) {
        if (v.isActive()) count++;
    }
    return count;
}

TEST_CASE("8-voice polyphony: 8 noteOn activates 8 voices", "[synth][poly]") {
    auto synth = createSynth();

    for (int i = 0; i < 8; ++i) {
        synth.noteOn(60 + i, 0.8f);
        // Process a few samples to let state settle
        for (int s = 0; s < 10; ++s) synth.process();
    }

    REQUIRE(countActiveVoices(synth) == 8);
}

TEST_CASE("9th note steals oldest voice", "[synth][stealing]") {
    auto synth = createSynth();

    // Play 8 notes
    for (int i = 0; i < 8; ++i) {
        synth.noteOn(60 + i, 0.8f);
        for (int s = 0; s < 10; ++s) synth.process();
    }
    REQUIRE(countActiveVoices(synth) == 8);

    // Play a 9th note - should steal oldest
    synth.noteOn(80, 0.8f);
    for (int s = 0; s < 10; ++s) synth.process();

    // Still 8 voices (one was stolen)
    REQUIRE(countActiveVoices(synth) == 8);

    // The 9th note (80) should be playing on one of the voices
    bool found80 = false;
    for (const auto& v : synth.getVoices()) {
        if (v.getCurrentNote() == 80 && v.isActive()) {
            found80 = true;
            break;
        }
    }
    REQUIRE(found80);
}

TEST_CASE("noteOff releases the correct voice", "[synth][noteoff]") {
    auto synth = createSynth();

    synth.noteOn(60, 0.8f);
    synth.noteOn(64, 0.8f);
    synth.noteOn(67, 0.8f);
    for (int s = 0; s < 100; ++s) synth.process();

    REQUIRE(countActiveVoices(synth) == 3);

    // Release middle note
    synth.noteOff(64);

    // Process through release phase
    SynthParams params;
    params.env1Release = 0.01f;
    params.driftDepth = 0.0f;
    synth.setParameters(params);

    for (int s = 0; s < 10000; ++s) synth.process();

    // Note 64 should have finished its release
    // Notes 60 and 67 should still be active
    bool found60 = false, found67 = false;
    for (const auto& v : synth.getVoices()) {
        if (v.getCurrentNote() == 60 && v.isActive()) found60 = true;
        if (v.getCurrentNote() == 67 && v.isActive()) found67 = true;
    }
    REQUIRE(found60);
    REQUIRE(found67);
}

TEST_CASE("Mono mode uses 1 voice", "[synth][mono]") {
    Synth synth;
    synth.setSampleRate(kSampleRate);

    SynthParams params;
    params.voiceMode = VoiceMode::Mono;
    params.env1Attack = 0.001f;
    params.env1Sustain = 0.7f;
    params.driftDepth = 0.0f;
    synth.setParameters(params);

    synth.noteOn(60, 0.8f);
    for (int s = 0; s < 100; ++s) synth.process();

    REQUIRE(countActiveVoices(synth) == 1);

    // Playing another note in mono should still use 1 voice
    synth.noteOn(64, 0.8f);
    for (int s = 0; s < 100; ++s) synth.process();

    REQUIRE(countActiveVoices(synth) == 1);
}

TEST_CASE("Stereo mode uses 2 voices", "[synth][stereo]") {
    Synth synth;
    synth.setSampleRate(kSampleRate);

    SynthParams params;
    params.voiceMode = VoiceMode::Stereo;
    params.env1Attack = 0.001f;
    params.env1Sustain = 0.7f;
    params.driftDepth = 0.0f;
    synth.setParameters(params);

    synth.noteOn(60, 0.8f);
    for (int s = 0; s < 100; ++s) synth.process();

    REQUIRE(countActiveVoices(synth) == 2);
}

TEST_CASE("Unison mode uses 4 voices", "[synth][unison]") {
    Synth synth;
    synth.setSampleRate(kSampleRate);

    SynthParams params;
    params.voiceMode = VoiceMode::Unison;
    params.env1Attack = 0.001f;
    params.env1Sustain = 0.7f;
    params.driftDepth = 0.0f;
    synth.setParameters(params);

    synth.noteOn(60, 0.8f);
    for (int s = 0; s < 100; ++s) synth.process();

    REQUIRE(countActiveVoices(synth) == 4);
}

TEST_CASE("Synth produces stereo output", "[synth][stereo_output]") {
    auto synth = createSynth();

    synth.noteOn(60, 1.0f);

    float sumL = 0.0f, sumR = 0.0f;
    for (int i = 0; i < 4410; ++i) {
        auto [l, r] = synth.process();
        sumL += std::abs(l);
        sumR += std::abs(r);
    }

    REQUIRE(sumL > 0.0f);
    REQUIRE(sumR > 0.0f);
}

TEST_CASE("Synth with no notes produces silence", "[synth][silence]") {
    auto synth = createSynth();

    float sumAbs = 0.0f;
    for (int i = 0; i < 1000; ++i) {
        auto [l, r] = synth.process();
        sumAbs += std::abs(l) + std::abs(r);
    }

    REQUIRE(sumAbs == Approx(0.0f).margin(0.001f));
}

TEST_CASE("Pitch bend is applied to active voices", "[synth][pitchbend]") {
    auto synth = createSynth();
    synth.noteOn(60, 1.0f);

    // Process some samples without pitch bend
    float sumNoBend = 0.0f;
    for (int i = 0; i < 441; ++i) {
        auto [l, r] = synth.process();
        sumNoBend += l;
    }

    // Reset and apply pitch bend
    auto synth2 = createSynth();
    synth2.noteOn(60, 1.0f);
    synth2.setPitchBend(2.0f); // Bend up 2 semitones

    float sumWithBend = 0.0f;
    for (int i = 0; i < 441; ++i) {
        auto [l, r] = synth2.process();
        sumWithBend += l;
    }

    // Output should differ with pitch bend applied
    REQUIRE(sumNoBend != Approx(sumWithBend).margin(0.01f));
}
