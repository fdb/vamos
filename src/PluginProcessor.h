#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include "dsp/Synth.h"

class VamosProcessor : public juce::AudioProcessor {
public:
    VamosProcessor();
    ~VamosProcessor() override = default;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override {}
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "Vamos"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int, const juce::String&) override {}

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    const vamos::Synth& getSynth() const { return synth; }

    juce::AudioProcessorValueTreeState apvts;

    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

private:
    vamos::Synth synth;

    // Smoothed parameters
    juce::SmoothedValue<float> smoothedVolume { 0.5f };
    juce::SmoothedValue<float> smoothedFilterFreq { 20000.0f };
    juce::SmoothedValue<float> smoothedOsc1Gain { 0.5f };
    juce::SmoothedValue<float> smoothedOsc2Gain { 0.398f };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(VamosProcessor)
};
