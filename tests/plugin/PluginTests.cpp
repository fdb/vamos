#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include <catch2/reporters/catch_reporter_event_listener.hpp>
#include <catch2/reporters/catch_reporter_registrars.hpp>

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_gui_basics/juce_gui_basics.h>
#include "PluginProcessor.h"
#include "PluginEditor.h"

using Catch::Approx;

// JUCE requires a message manager for GUI tests.
// We use a Catch2 listener to initialize/shutdown JUCE at the right time.
// The Desktop singleton must be deleted before MessageManager.
struct JuceGuard : Catch::EventListenerBase {
    using EventListenerBase::EventListenerBase;

    void testRunStarting(Catch::TestRunInfo const&) override {
        juce::MessageManager::getInstance();
    }

    void testRunEnded(Catch::TestRunStats const&) override {
        juce::Desktop::getInstance().setDefaultLookAndFeel(nullptr);
        juce::DeletedAtShutdown::deleteAll();
        juce::MessageManager::deleteInstance();
    }
};
CATCH_REGISTER_LISTENER(JuceGuard)

TEST_CASE("Plugin constructs without crash", "[plugin]") {
    VamosProcessor processor;
    REQUIRE(processor.getName() == "Vamos");
    REQUIRE(processor.acceptsMidi() == true);
    REQUIRE(processor.producesMidi() == false);
}

TEST_CASE("processBlock with empty MIDI produces silence", "[plugin][audio]") {
    VamosProcessor processor;
    processor.prepareToPlay(44100.0, 512);

    juce::AudioBuffer<float> buffer(2, 512);
    buffer.clear();
    juce::MidiBuffer midi;

    processor.processBlock(buffer, midi);

    // No notes playing, output should be silence
    float maxSample = 0.0f;
    for (int ch = 0; ch < buffer.getNumChannels(); ++ch) {
        for (int i = 0; i < buffer.getNumSamples(); ++i) {
            maxSample = std::max(maxSample, std::abs(buffer.getSample(ch, i)));
        }
    }

    REQUIRE(maxSample < 0.001f);
}

TEST_CASE("processBlock with noteOn produces non-zero audio", "[plugin][audio]") {
    VamosProcessor processor;
    processor.prepareToPlay(44100.0, 512);

    juce::AudioBuffer<float> buffer(2, 512);
    buffer.clear();
    juce::MidiBuffer midi;
    midi.addEvent(juce::MidiMessage::noteOn(1, 60, 0.8f), 0);

    processor.processBlock(buffer, midi);

    float maxSample = 0.0f;
    for (int ch = 0; ch < buffer.getNumChannels(); ++ch) {
        for (int i = 0; i < buffer.getNumSamples(); ++i) {
            maxSample = std::max(maxSample, std::abs(buffer.getSample(ch, i)));
        }
    }

    REQUIRE(maxSample > 0.0f);
}

TEST_CASE("Editor creates and destroys without crash", "[plugin][editor]") {
    // This test catches the setSize() ordering bug:
    // If setSize() is called before child components are created,
    // resized() will try to access null unique_ptrs and crash.
    VamosProcessor processor;
    processor.prepareToPlay(44100.0, 512);

    {
        auto* editor = processor.createEditor();
        REQUIRE(editor != nullptr);

        // Verify the editor has the expected size
        REQUIRE(editor->getWidth() == 740);
        REQUIRE(editor->getHeight() == 440);

        delete editor;
    }
    // If we get here without crashing, the test passes
    REQUIRE(true);
}

TEST_CASE("State save/load round-trip preserves parameters", "[plugin][state]") {
    // Save state from one processor
    juce::MemoryBlock savedState;
    {
        VamosProcessor processor;
        processor.prepareToPlay(44100.0, 512);

        // Modify a parameter
        if (auto* param = processor.apvts.getParameter("volume")) {
            param->setValueNotifyingHost(0.75f);
        }
        if (auto* param = processor.apvts.getParameter("filterFreq")) {
            param->setValueNotifyingHost(0.5f); // Normalized
        }

        processor.getStateInformation(savedState);
    }

    // Load state into a fresh processor
    {
        VamosProcessor processor2;
        processor2.prepareToPlay(44100.0, 512);

        processor2.setStateInformation(savedState.getData(),
                                        static_cast<int>(savedState.getSize()));

        // Check the volume was restored
        auto* volumeParam = processor2.apvts.getParameter("volume");
        REQUIRE(volumeParam != nullptr);
        REQUIRE(volumeParam->getValue() == Approx(0.75f).margin(0.01f));
    }
}

TEST_CASE("Parameter layout has expected number of parameters", "[plugin][params]") {
    VamosProcessor processor;

    // Count parameters (should be 27+ based on the APVTS setup)
    int paramCount = 0;
    for (auto& p : processor.getParameters()) {
        (void)p;
        paramCount++;
    }

    REQUIRE(paramCount >= 27);
}
