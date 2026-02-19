#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include "PluginProcessor.h"
#include <vector>

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
    void mouseDown(const juce::MouseEvent&) override;

private:
    void timerCallback() override { repaint(); }

    // Drawing helpers
    void drawSignalFlow(juce::Graphics& g);
    void drawBlock(juce::Graphics& g, juce::Rectangle<float> bounds,
                   const juce::String& label, bool selected, juce::Colour colour);
    void drawNeonLine(juce::Graphics& g, float x1, float y1, float x2, float y2,
                      juce::Colour colour);

    // Block interaction
    void showBlockParams(Block b);
    void layoutParamPanel();
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

    // ── Members (declaration order matters for destruction) ──
    VamosLookAndFeel vamosLAF;
    VamosProcessor& processor;
    Block selectedBlock = Block::Osc1;
    std::vector<std::pair<Block, juce::Rectangle<float>>> blockHitAreas;

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
