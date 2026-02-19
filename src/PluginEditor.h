#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include "PluginProcessor.h"

class VamosEditor : public juce::AudioProcessorEditor, private juce::Timer {
public:
    explicit VamosEditor(VamosProcessor&);
    ~VamosEditor() override = default;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    void timerCallback() override { repaint(); }

    // Draw individual signal blocks
    void drawBlock(juce::Graphics& g, juce::Rectangle<float> bounds,
                   const juce::String& label, bool active,
                   juce::Colour colour);
    void drawArrow(juce::Graphics& g, float x1, float y1, float x2, float y2);
    void drawSignalFlow(juce::Graphics& g);

    // Helper to create a rotary knob with label
    struct KnobWithLabel {
        std::unique_ptr<juce::Slider> slider;
        std::unique_ptr<juce::Label> label;
        std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> attachment;
    };

    KnobWithLabel createKnob(const juce::String& paramId, const juce::String& labelText);

    // Helper to create a combo box with label
    struct ComboWithLabel {
        std::unique_ptr<juce::ComboBox> combo;
        std::unique_ptr<juce::Label> label;
        std::unique_ptr<juce::AudioProcessorValueTreeState::ComboBoxAttachment> attachment;
    };

    ComboWithLabel createCombo(const juce::String& paramId, const juce::String& labelText);

    VamosProcessor& processor;

    // --- Oscillator 1 controls ---
    ComboWithLabel osc1TypeCombo;
    KnobWithLabel osc1ShapeKnob;

    // --- Oscillator 2 controls ---
    ComboWithLabel osc2TypeCombo;
    KnobWithLabel osc2DetuneKnob;

    // --- Mixer controls ---
    KnobWithLabel osc1GainKnob;
    KnobWithLabel osc2GainKnob;
    KnobWithLabel noiseLevelKnob;

    // --- Filter controls ---
    ComboWithLabel filterTypeCombo;
    KnobWithLabel filterFreqKnob;
    KnobWithLabel filterResKnob;

    // --- Envelope 1 controls ---
    KnobWithLabel envAttackKnob;
    KnobWithLabel envDecayKnob;
    KnobWithLabel envSustainKnob;
    KnobWithLabel envReleaseKnob;

    // --- LFO controls ---
    ComboWithLabel lfoShapeCombo;
    KnobWithLabel lfoRateKnob;

    // --- Global controls ---
    KnobWithLabel volumeKnob;
    KnobWithLabel driftKnob;
    ComboWithLabel voiceModeCombo;
    KnobWithLabel glideKnob;
    KnobWithLabel transposeKnob;
    KnobWithLabel velModKnob;
    KnobWithLabel bendRangeKnob;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(VamosEditor)
};
