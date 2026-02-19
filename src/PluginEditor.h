#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include "PluginProcessor.h"

// ── Synthwave LookAndFeel ──────────────────────────────────────────────────
class VamosLookAndFeel : public juce::LookAndFeel_V4 {
public:
    VamosLookAndFeel();

    juce::Colour accentColour { 0xFF00E5FF };

    void drawRotarySlider(juce::Graphics&, int x, int y, int width, int height,
                          float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                          juce::Slider&) override;

    void drawComboBox(juce::Graphics&, int width, int height, bool isButtonDown,
                      int buttonX, int buttonY, int buttonW, int buttonH,
                      juce::ComboBox&) override;

    void drawPopupMenuBackground(juce::Graphics&, int width, int height) override;

    void drawPopupMenuItem(juce::Graphics&, const juce::Rectangle<int>& area,
                           bool isSeparator, bool isActive, bool isHighlighted,
                           bool isTicked, bool hasSubMenu,
                           const juce::String& text, const juce::String& shortcutKeyText,
                           const juce::Drawable* icon, const juce::Colour* textColour) override;

    void drawToggleButton(juce::Graphics&, juce::ToggleButton&,
                          bool shouldDrawButtonAsHighlighted,
                          bool shouldDrawButtonAsDown) override;
};

// ── Editor ─────────────────────────────────────────────────────────────────
class VamosEditor : public juce::AudioProcessorEditor, private juce::Timer {
public:
    enum class Block {
        Osc1, Osc2, Noise, Mixer, Filter, Amp, Out,
        Env2, CycEnv, LFO, ModMatrix, Drift
    };

    explicit VamosEditor(VamosProcessor&);
    ~VamosEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    void timerCallback() override { repaint(); }

    // Drawing helpers
    void drawSignalFlow(juce::Graphics& g);
    void drawBlock(juce::Graphics& g, juce::Rectangle<float> bounds,
                   const juce::String& label, bool selected, juce::Colour colour);
    void drawNeonLine(juce::Graphics& g, float x1, float y1, float x2, float y2,
                      juce::Colour colour);
    void drawSushiSections(juce::Graphics& g);

    juce::Colour getBlockColour(Block b) const;
    juce::String getBlockName(Block b) const;

    // Component factories
    struct KnobWithLabel {
        std::unique_ptr<juce::Slider> slider;
        std::unique_ptr<juce::Label> label;
        std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> attachment;
    };
    KnobWithLabel createKnob(const juce::String& paramId, const juce::String& labelText);

    struct ComboWithLabel {
        std::unique_ptr<juce::ComboBox> combo;
        std::unique_ptr<juce::Label> label;
        std::unique_ptr<juce::AudioProcessorValueTreeState::ComboBoxAttachment> attachment;
    };
    ComboWithLabel createCombo(const juce::String& paramId, const juce::String& labelText);

    struct ToggleWithLabel {
        std::unique_ptr<juce::ToggleButton> button;
        std::unique_ptr<juce::Label> label;
        std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment> attachment;
    };
    ToggleWithLabel createToggle(const juce::String& paramId, const juce::String& labelText);

    // ── Members (declaration order matters for destruction) ──
    VamosLookAndFeel vamosLAF;
    VamosProcessor& processor;

    // --- Oscillator 1 controls ---
    ComboWithLabel osc1TypeCombo;
    KnobWithLabel osc1ShapeKnob;

    // --- Oscillator 2 controls ---
    ComboWithLabel osc2TypeCombo;
    KnobWithLabel osc2DetuneKnob;
    KnobWithLabel osc2TransposeKnob;

    // --- Noise ---
    ComboWithLabel noiseTypeCombo;

    // --- Mixer controls ---
    KnobWithLabel osc1GainKnob;
    KnobWithLabel osc2GainKnob;
    KnobWithLabel noiseLevelKnob;
    ToggleWithLabel osc1OnToggle;
    ToggleWithLabel osc2OnToggle;
    ToggleWithLabel noiseOnToggle;

    // --- Filter controls ---
    ComboWithLabel filterTypeCombo;
    KnobWithLabel filterFreqKnob;
    KnobWithLabel filterResKnob;
    KnobWithLabel filterTrackingKnob;

    // --- Envelope 1 controls ---
    KnobWithLabel envAttackKnob;
    KnobWithLabel envDecayKnob;
    KnobWithLabel envSustainKnob;
    KnobWithLabel envReleaseKnob;

    // --- LFO controls ---
    ComboWithLabel lfoShapeCombo;
    KnobWithLabel lfoRateKnob;
    KnobWithLabel lfoAmountKnob;

    // --- Global controls ---
    KnobWithLabel volumeKnob;
    KnobWithLabel driftKnob;
    ComboWithLabel voiceModeCombo;
    KnobWithLabel glideKnob;
    KnobWithLabel transposeKnob;
    KnobWithLabel velModKnob;
    KnobWithLabel bendRangeKnob;
    ToggleWithLabel hiQualityToggle;
    ToggleWithLabel resetPhaseToggle;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(VamosEditor)
};
