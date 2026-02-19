#include "PluginEditor.h"

static const juce::Colour kBackground   (0xFF1A1A2E);
static const juce::Colour kOscColour    (0xFF4FC3F7);
static const juce::Colour kMixerColour  (0xFFFFB74D);
static const juce::Colour kFilterColour (0xFFE57373);
static const juce::Colour kAmpColour    (0xFF81C784);
static const juce::Colour kModColour    (0xFFCE93D8);
static const juce::Colour kLabelColour  (0xFFCCCCCC);
static const juce::Colour kKnobFill     (0xFF2A2A4E);
static const juce::Colour kKnobOutline  (0xFF555588);

class VamosLookAndFeel : public juce::LookAndFeel_V4 {
public:
    VamosLookAndFeel() {
        setColour(juce::Slider::rotarySliderFillColourId, kOscColour);
        setColour(juce::Slider::rotarySliderOutlineColourId, kKnobOutline);
        setColour(juce::Slider::thumbColourId, juce::Colours::white);
        setColour(juce::ComboBox::backgroundColourId, kKnobFill);
        setColour(juce::ComboBox::outlineColourId, kKnobOutline);
        setColour(juce::ComboBox::textColourId, juce::Colours::white);
        setColour(juce::PopupMenu::backgroundColourId, juce::Colour(0xFF222244));
        setColour(juce::PopupMenu::textColourId, juce::Colours::white);
        setColour(juce::PopupMenu::highlightedBackgroundColourId, kOscColour.withAlpha(0.3f));
    }

    void drawRotarySlider(juce::Graphics& g, int x, int y, int width, int height,
                          float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                          juce::Slider& slider) override
    {
        auto radius = (float)juce::jmin(width / 2, height / 2) - 4.0f;
        auto centreX = (float)x + (float)width * 0.5f;
        auto centreY = (float)y + (float)height * 0.5f;
        auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);

        juce::Path bgArc;
        bgArc.addCentredArc(centreX, centreY, radius, radius, 0.0f,
                            rotaryStartAngle, rotaryEndAngle, true);
        g.setColour(kKnobOutline.withAlpha(0.4f));
        g.strokePath(bgArc, juce::PathStrokeType(3.0f));

        juce::Path valueArc;
        valueArc.addCentredArc(centreX, centreY, radius, radius, 0.0f,
                               rotaryStartAngle, angle, true);
        g.setColour(kOscColour);
        g.strokePath(valueArc, juce::PathStrokeType(3.0f));

        auto pointerLength = radius * 0.6f;
        auto pointerX = centreX + pointerLength * std::cos(angle - juce::MathConstants<float>::halfPi);
        auto pointerY = centreY + pointerLength * std::sin(angle - juce::MathConstants<float>::halfPi);
        g.setColour(juce::Colours::white);
        g.fillEllipse(pointerX - 3.0f, pointerY - 3.0f, 6.0f, 6.0f);

        (void)slider;
    }
};

static VamosLookAndFeel& getVamosLAF() {
    static VamosLookAndFeel laf;
    return laf;
}

VamosEditor::VamosEditor(VamosProcessor& p)
    : AudioProcessorEditor(p), processor(p)
{
    setLookAndFeel(&getVamosLAF());

    // Create all child components BEFORE setSize() -- setSize triggers resized()
    // which calls setBounds on these widgets. If they're null, we crash.
    osc1TypeCombo  = createCombo("osc1Type", "Type");
    osc1ShapeKnob  = createKnob("osc1Shape", "Shape");
    osc2TypeCombo  = createCombo("osc2Type", "Type");
    osc2DetuneKnob = createKnob("osc2Detune", "Detune");
    osc1GainKnob   = createKnob("osc1Gain", "Osc1");
    osc2GainKnob   = createKnob("osc2Gain", "Osc2");
    noiseLevelKnob = createKnob("noiseLevel", "Noise");
    filterTypeCombo = createCombo("filterType", "Type");
    filterFreqKnob  = createKnob("filterFreq", "Freq");
    filterResKnob   = createKnob("filterRes", "Res");
    envAttackKnob  = createKnob("env1Attack", "A");
    envDecayKnob   = createKnob("env1Decay", "D");
    envSustainKnob = createKnob("env1Sustain", "S");
    envReleaseKnob = createKnob("env1Release", "R");
    lfoShapeCombo  = createCombo("lfoShape", "Shape");
    lfoRateKnob    = createKnob("lfoRate", "Rate");
    volumeKnob     = createKnob("volume", "Volume");
    driftKnob      = createKnob("driftDepth", "Drift");
    voiceModeCombo = createCombo("voiceMode", "Voice");
    glideKnob      = createKnob("glide", "Glide");
    transposeKnob  = createKnob("transpose", "Trans");
    velModKnob     = createKnob("volVelMod", "VelMod");
    bendRangeKnob  = createKnob("pitchBendRange", "Bend");

    setSize(900, 700);
    startTimerHz(30);
}

VamosEditor::KnobWithLabel VamosEditor::createKnob(const juce::String& paramId,
                                                    const juce::String& labelText)
{
    KnobWithLabel kwl;
    kwl.slider = std::make_unique<juce::Slider>(juce::Slider::RotaryHorizontalVerticalDrag,
                                                 juce::Slider::NoTextBox);
    kwl.slider->setLookAndFeel(&getVamosLAF());
    addAndMakeVisible(kwl.slider.get());

    kwl.label = std::make_unique<juce::Label>("", labelText);
    kwl.label->setFont(juce::Font(11.0f));
    kwl.label->setColour(juce::Label::textColourId, kLabelColour);
    kwl.label->setJustificationType(juce::Justification::centred);
    addAndMakeVisible(kwl.label.get());

    kwl.attachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(
        processor.apvts, paramId, *kwl.slider);

    return kwl;
}

VamosEditor::ComboWithLabel VamosEditor::createCombo(const juce::String& paramId,
                                                      const juce::String& labelText)
{
    ComboWithLabel cwl;
    cwl.combo = std::make_unique<juce::ComboBox>();
    cwl.combo->setLookAndFeel(&getVamosLAF());

    // Populate combo box items from the AudioParameterChoice before attaching.
    // ComboBoxAttachment does not auto-populate — the combo must already have items.
    if (auto* choiceParam = dynamic_cast<juce::AudioParameterChoice*>(
            processor.apvts.getParameter(paramId))) {
        cwl.combo->addItemList(choiceParam->choices, 1);
    }

    addAndMakeVisible(cwl.combo.get());

    cwl.label = std::make_unique<juce::Label>("", labelText);
    cwl.label->setFont(juce::Font(11.0f));
    cwl.label->setColour(juce::Label::textColourId, kLabelColour);
    cwl.label->setJustificationType(juce::Justification::centred);
    addAndMakeVisible(cwl.label.get());

    cwl.attachment = std::make_unique<juce::AudioProcessorValueTreeState::ComboBoxAttachment>(
        processor.apvts, paramId, *cwl.combo);

    return cwl;
}

void VamosEditor::drawBlock(juce::Graphics& g, juce::Rectangle<float> bounds,
                            const juce::String& label, bool active,
                            juce::Colour colour)
{
    auto alpha = active ? 1.0f : 0.3f;
    g.setColour(colour.withAlpha(alpha * 0.15f));
    g.fillRoundedRectangle(bounds, 6.0f);
    g.setColour(colour.withAlpha(alpha * 0.7f));
    g.drawRoundedRectangle(bounds, 6.0f, active ? 2.0f : 1.0f);
    g.setColour(colour.withAlpha(alpha));
    g.setFont(juce::Font(11.0f));
    g.drawText(label, bounds, juce::Justification::centred);
}

void VamosEditor::drawArrow(juce::Graphics& g, float x1, float y1, float x2, float y2) {
    g.setColour(juce::Colours::grey.withAlpha(0.6f));
    g.drawArrow(juce::Line<float>(x1, y1, x2, y2), 1.5f, 6.0f, 6.0f);
}

void VamosEditor::drawSignalFlow(juce::Graphics& g) {
    const float bw = 80.0f, bh = 36.0f, gap = 14.0f;
    const float startX = 30.0f, topY = 50.0f;

    auto osc1Rect = juce::Rectangle<float>(startX, topY, bw, bh);
    drawBlock(g, osc1Rect, "Osc 1", true, kOscColour);

    auto osc2Rect = juce::Rectangle<float>(startX, topY + bh + gap, bw, bh);
    drawBlock(g, osc2Rect, "Osc 2", true, kOscColour);

    auto noiseRect = juce::Rectangle<float>(startX, topY + 2 * (bh + gap), bw, bh);
    drawBlock(g, noiseRect, "Noise", true, kOscColour);

    float mixerX = startX + bw + gap * 2;
    auto mixerRect = juce::Rectangle<float>(mixerX, topY + bh / 2 + gap / 2, bw, bh);
    drawBlock(g, mixerRect, "Mixer", true, kMixerColour);

    drawArrow(g, osc1Rect.getRight(), osc1Rect.getCentreY(), mixerRect.getX(), mixerRect.getCentreY() - 8);
    drawArrow(g, osc2Rect.getRight(), osc2Rect.getCentreY(), mixerRect.getX(), mixerRect.getCentreY());
    drawArrow(g, noiseRect.getRight(), noiseRect.getCentreY(), mixerRect.getX(), mixerRect.getCentreY() + 8);

    float filterX = mixerX + bw + gap * 2;
    auto filterRect = juce::Rectangle<float>(filterX, mixerRect.getY(), bw, bh);
    drawBlock(g, filterRect, "Filter", true, kFilterColour);
    drawArrow(g, mixerRect.getRight(), mixerRect.getCentreY(), filterRect.getX(), filterRect.getCentreY());

    float ampX = filterX + bw + gap * 2;
    auto ampRect = juce::Rectangle<float>(ampX, filterRect.getY(), bw, bh);
    drawBlock(g, ampRect, "Amp", true, kAmpColour);
    drawArrow(g, filterRect.getRight(), filterRect.getCentreY(), ampRect.getX(), ampRect.getCentreY());

    float outX = ampX + bw + gap * 2;
    auto outRect = juce::Rectangle<float>(outX, ampRect.getY(), 55, bh);
    drawBlock(g, outRect, "OUT", true, juce::Colours::white);
    drawArrow(g, ampRect.getRight(), ampRect.getCentreY(), outRect.getX(), outRect.getCentreY());

    float modY = topY + 3 * (bh + gap) + 4;
    float modBw = 70.0f;

    g.setColour(juce::Colours::grey.withAlpha(0.35f));
    g.setFont(juce::Font(10.0f));
    g.drawText("Modulators:", startX, modY - 14, 150, 12, juce::Justification::left);

    auto env2Rect = juce::Rectangle<float>(startX, modY, modBw, bh);
    drawBlock(g, env2Rect, "Env 2", true, kModColour);

    auto cycRect = juce::Rectangle<float>(startX + modBw + gap, modY, modBw, bh);
    drawBlock(g, cycRect, "CycEnv", true, kModColour);

    auto lfoRect = juce::Rectangle<float>(startX + 2 * (modBw + gap), modY, modBw, bh);
    drawBlock(g, lfoRect, "LFO", true, kModColour);

    auto modRect = juce::Rectangle<float>(startX + 3 * (modBw + gap), modY, modBw + 10, bh);
    drawBlock(g, modRect, "ModMatrix", true, kModColour);

    auto driftRect = juce::Rectangle<float>(startX + 4 * (modBw + gap) + 10, modY, modBw, bh);
    drawBlock(g, driftRect, "Drift", true, juce::Colour(0xFFFFF176));

    g.setColour(juce::Colours::grey.withAlpha(0.2f));
    float dashLengths[] = {3.0f, 3.0f};
    g.drawDashedLine(juce::Line<float>(env2Rect.getCentreX(), env2Rect.getY(),
                     filterRect.getCentreX(), filterRect.getBottom()), dashLengths, 2, 1.0f);
    g.drawDashedLine(juce::Line<float>(lfoRect.getCentreX(), lfoRect.getY(),
                     filterRect.getCentreX() + 10, filterRect.getBottom()), dashLengths, 2, 1.0f);
    g.drawDashedLine(juce::Line<float>(driftRect.getCentreX(), driftRect.getY(),
                     osc1Rect.getCentreX(), osc1Rect.getBottom()), dashLengths, 2, 1.0f);

    float voiceY = modY + bh + gap + 2;
    g.setColour(juce::Colours::grey.withAlpha(0.35f));
    g.setFont(juce::Font(10.0f));
    g.drawText("Voices:", startX, voiceY, 60, 14, juce::Justification::left);

    const auto& voices = processor.getSynth().getVoices();
    for (int i = 0; i < 8; ++i) {
        float x = startX + 55 + i * 24;
        bool active = voices[i].isActive();
        g.setColour(active ? kAmpColour : juce::Colour(0xFF333355));
        g.fillRoundedRectangle(x, voiceY, 18, 12, 3.0f);
        g.setColour(juce::Colours::white.withAlpha(active ? 0.9f : 0.3f));
        g.setFont(juce::Font(9.0f));
        g.drawText(juce::String(i + 1), (int)x, (int)voiceY, 18, 12, juce::Justification::centred);
    }
}

void VamosEditor::paint(juce::Graphics& g) {
    g.fillAll(kBackground);

    g.setColour(juce::Colours::white);
    g.setFont(juce::Font(18.0f).boldened());
    g.drawText("VAMOS", getLocalBounds().removeFromTop(30), juce::Justification::centred);

    g.setFont(juce::Font(10.0f));
    g.setColour(juce::Colours::grey);
    g.drawText("Phase 7: Parameters + GUI", getLocalBounds().removeFromTop(42), juce::Justification::centred);

    drawSignalFlow(g);

    int sectionY = 310;
    g.setFont(juce::Font(12.0f).boldened());

    g.setColour(kOscColour);
    g.drawText("OSC 1", 20, sectionY, 120, 16, juce::Justification::left);
    g.drawText("OSC 2", 175, sectionY, 120, 16, juce::Justification::left);

    g.setColour(kMixerColour);
    g.drawText("MIXER", 330, sectionY, 120, 16, juce::Justification::left);

    g.setColour(kFilterColour);
    g.drawText("FILTER", 500, sectionY, 120, 16, juce::Justification::left);

    g.setColour(juce::Colours::white);
    g.drawText("GLOBAL", 720, sectionY, 120, 16, juce::Justification::left);

    int envY = 450;
    g.setColour(kAmpColour);
    g.drawText("ENVELOPE", 20, envY, 200, 16, juce::Justification::left);

    g.setColour(kModColour);
    g.drawText("LFO", 350, envY, 100, 16, juce::Justification::left);

    g.setColour(juce::Colours::white.withAlpha(0.8f));
    g.drawText("PERFORMANCE", 540, envY, 200, 16, juce::Justification::left);

    g.setColour(juce::Colours::grey.withAlpha(0.15f));
    g.drawLine(20, 308, 880, 308, 1.0f);
    g.drawLine(20, 448, 880, 448, 1.0f);
}

void VamosEditor::resized() {
    const int knobSize = 50, comboW = 95, comboH = 22, labelH = 14;
    const int ctrlY = 330, envY = 470;

    auto placeKnob = [&](KnobWithLabel& k, int x, int y) {
        k.slider->setBounds(x, y, knobSize, knobSize);
        k.label->setBounds(x, y + knobSize, knobSize, labelH);
    };
    auto placeCombo = [&](ComboWithLabel& c, int x, int y) {
        c.combo->setBounds(x, y + 6, comboW, comboH);
        c.label->setBounds(x, y - 8, comboW, labelH);
    };

    placeCombo(osc1TypeCombo, 20, ctrlY);
    placeKnob(osc1ShapeKnob, 120, ctrlY - 4);
    placeCombo(osc2TypeCombo, 185, ctrlY);
    placeKnob(osc2DetuneKnob, 285, ctrlY - 4);
    placeKnob(osc1GainKnob, 340, ctrlY - 4);
    placeKnob(osc2GainKnob, 395, ctrlY - 4);
    placeKnob(noiseLevelKnob, 450, ctrlY - 4);
    placeCombo(filterTypeCombo, 510, ctrlY);
    placeKnob(filterFreqKnob, 615, ctrlY - 4);
    placeKnob(filterResKnob, 670, ctrlY - 4);
    placeKnob(volumeKnob, 730, ctrlY - 4);
    placeKnob(driftKnob, 785, ctrlY - 4);
    placeCombo(voiceModeCombo, 730, ctrlY + 65);
    placeKnob(envAttackKnob, 20, envY);
    placeKnob(envDecayKnob, 80, envY);
    placeKnob(envSustainKnob, 140, envY);
    placeKnob(envReleaseKnob, 200, envY);
    placeCombo(lfoShapeCombo, 350, envY + 4);
    placeKnob(lfoRateKnob, 455, envY);

    // Global row (bottom-right area)
    int globalY = envY;
    placeKnob(glideKnob, 540, globalY);
    placeKnob(transposeKnob, 600, globalY);
    placeKnob(velModKnob, 660, globalY);
    placeKnob(bendRangeKnob, 720, globalY);
}
