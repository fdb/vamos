#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "dsp/Envelope.h"

using namespace vamos;
using Catch::Approx;

static constexpr float kSampleRate = 44100.0f;

TEST_CASE("Envelope starts in Idle stage", "[envelope]") {
    Envelope env;
    env.setSampleRate(kSampleRate);

    REQUIRE(env.getStage() == Envelope::Stage::Idle);
    REQUIRE(env.isActive() == false);
    REQUIRE(env.getLevel() == Approx(0.0f));
}

TEST_CASE("noteOn triggers attack, level rises toward 1.0", "[envelope][attack]") {
    Envelope env;
    env.setSampleRate(kSampleRate);
    env.setParams({.attack = 0.01f, .decay = 0.5f, .sustain = 0.7f, .release = 0.5f});

    env.noteOn();
    REQUIRE(env.getStage() == Envelope::Stage::Attack);
    REQUIRE(env.isActive() == true);

    // Process through attack phase (~441 samples for 10ms attack at 44100)
    float prevLevel = 0.0f;
    for (int i = 0; i < 2000; ++i) {
        float level = env.process();
        // Level should be monotonically increasing during attack
        if (env.getStage() == Envelope::Stage::Attack) {
            REQUIRE(level >= prevLevel - 0.001f); // small tolerance for float
        }
        prevLevel = level;
    }

    // After attack, level should have reached near 1.0 at some point
    // Now should be in Decay or Sustain
    REQUIRE((env.getStage() == Envelope::Stage::Decay ||
             env.getStage() == Envelope::Stage::Sustain));
}

TEST_CASE("noteOff triggers release, level decays to 0", "[envelope][release]") {
    Envelope env;
    env.setSampleRate(kSampleRate);
    env.setParams({.attack = 0.001f, .decay = 0.01f, .sustain = 0.7f, .release = 0.05f});

    // Trigger and let it reach sustain
    env.noteOn();
    for (int i = 0; i < 5000; ++i) {
        env.process();
    }
    REQUIRE(env.getStage() == Envelope::Stage::Sustain);
    float sustainLevel = env.getLevel();
    REQUIRE(sustainLevel > 0.5f);

    // Release
    env.noteOff();
    REQUIRE(env.getStage() == Envelope::Stage::Release);

    // Process through release (~2205 samples for 50ms)
    for (int i = 0; i < 20000; ++i) {
        env.process();
    }

    // Should be back to idle with near-zero level
    REQUIRE(env.getStage() == Envelope::Stage::Idle);
    REQUIRE(env.getLevel() < 0.001f);
}

TEST_CASE("Envelope reports Idle after release completes", "[envelope][lifecycle]") {
    Envelope env;
    env.setSampleRate(kSampleRate);
    env.setParams({.attack = 0.001f, .decay = 0.01f, .sustain = 0.8f, .release = 0.01f});

    // Full lifecycle: Idle -> Attack -> Decay -> Sustain -> Release -> Idle
    REQUIRE(env.getStage() == Envelope::Stage::Idle);

    env.noteOn();
    REQUIRE(env.isActive() == true);

    // Process through attack + decay to sustain
    for (int i = 0; i < 5000; ++i) {
        env.process();
    }
    REQUIRE(env.getStage() == Envelope::Stage::Sustain);

    env.noteOff();
    // Process through release
    for (int i = 0; i < 10000; ++i) {
        env.process();
    }

    REQUIRE(env.getStage() == Envelope::Stage::Idle);
    REQUIRE(env.isActive() == false);
}

TEST_CASE("isActive reflects lifecycle correctly", "[envelope][active]") {
    Envelope env;
    env.setSampleRate(kSampleRate);
    env.setParams({.attack = 0.001f, .decay = 0.01f, .sustain = 0.7f, .release = 0.01f});

    REQUIRE(env.isActive() == false);

    env.noteOn();
    REQUIRE(env.isActive() == true);

    // Process to sustain
    for (int i = 0; i < 5000; ++i) {
        env.process();
    }
    REQUIRE(env.isActive() == true);

    env.noteOff();
    REQUIRE(env.isActive() == true); // Still active during release

    // Process through release
    for (int i = 0; i < 10000; ++i) {
        env.process();
    }
    REQUIRE(env.isActive() == false);
}

TEST_CASE("Sustain level is respected", "[envelope][sustain]") {
    Envelope env;
    env.setSampleRate(kSampleRate);
    env.setParams({.attack = 0.001f, .decay = 0.1f, .sustain = 0.5f, .release = 0.5f});

    env.noteOn();
    // Process well past attack and decay
    for (int i = 0; i < 44100; ++i) {
        env.process();
    }

    REQUIRE(env.getStage() == Envelope::Stage::Sustain);
    REQUIRE(env.getLevel() == Approx(0.5f).margin(0.05f));
}

TEST_CASE("Re-trigger resets to attack", "[envelope][retrigger]") {
    Envelope env;
    env.setSampleRate(kSampleRate);
    env.setParams({.attack = 0.01f, .decay = 0.5f, .sustain = 0.7f, .release = 0.5f});

    env.noteOn();
    for (int i = 0; i < 5000; ++i) {
        env.process();
    }

    // Re-trigger while in sustain
    env.noteOn();
    REQUIRE(env.getStage() == Envelope::Stage::Attack);
}
