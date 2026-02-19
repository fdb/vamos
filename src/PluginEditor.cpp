#include "PluginEditor.h"

// ── Synthwave Palette ──────────────────────────────────────────────────────
static const juce::Colour kBackground  (0xFF0D0D1A);
static const juce::Colour kPanelBg     (0xFF12122B);
static const juce::Colour kKnobTrack   (0xFF222244);
static const juce::Colour kText        (0xFFE0E0F0);
static const juce::Colour kDimText     (0xFF8888AA);
static const juce::Colour kCyan        (0xFF00E5FF);
static const juce::Colour kPink        (0xFFFF2D7B);
static const juce::Colour kGreen       (0xFF39FF14);
static const juce::Colour kAmber       (0xFFFFAA00);
static const juce::Colour kViolet      (0xFFBB44FF);
static const juce::Colour kDriftYellow (0xFFFFF176);

// Sushi section layout constants
static constexpr int kSeparatorY = 160;
static constexpr int kSectionTop = kSeparatorY + 4;
static constexpr int kHeaderH    = 20;
static constexpr int kParamTop   = kSectionTop + kHeaderH + 2;
static constexpr int kKnobSize   = 48;
static constexpr int kLabelH     = 14;
static constexpr int kComboW     = 86;
static constexpr int kComboH     = 22;
static constexpr int kToggleSize = 20;
static constexpr int kMarginX    = 8;

// Section X positions and widths
static constexpr int kOscX   = 6;    static constexpr int kOscW   = 195;
static constexpr int kMixX   = 203;  static constexpr int kMixW   = 105;
static constexpr int kFiltX  = 310;  static constexpr int kFiltW  = 160;
static constexpr int kEnvX   = 472;  static constexpr int kEnvW   = 195;
static constexpr int kLfoX   = 669;  static constexpr int kLfoW   = 115;
static constexpr int kGlobX  = 786;  static constexpr int kGlobW  = 168;

// ── VamosLookAndFeel ───────────────────────────────────────────────────────

VamosLookAndFeel::VamosLookAndFeel() {
    setColour(juce::ComboBox::textColourId, kText);
    setColour(juce::ComboBox::backgroundColourId, kPanelBg);
    setColour(juce::ComboBox::outlineColourId, kKnobTrack);
    setColour(juce::PopupMenu::backgroundColourId, kPanelBg);
    setColour(juce::PopupMenu::textColourId, kText);
    setColour(juce::PopupMenu::highlightedBackgroundColourId, kCyan.withAlpha(0.25f));
}

void VamosLookAndFeel::drawRotarySlider(juce::Graphics& g, int x, int y, int width, int height,
                                         float sliderPos, float rotaryStartAngle, float rotaryEndAngle,
                                         juce::Slider&)
{
    auto radius = (float)juce::jmin(width / 2, height / 2) - 4.0f;
    auto centreX = (float)x + (float)width * 0.5f;
    auto centreY = (float)y + (float)height * 0.5f;
    auto angle = rotaryStartAngle + sliderPos * (rotaryEndAngle - rotaryStartAngle);

    // Dark track arc
    juce::Path bgArc;
    bgArc.addCentredArc(centreX, centreY, radius, radius, 0.0f,
                         rotaryStartAngle, rotaryEndAngle, true);
    g.setColour(kKnobTrack);
    g.strokePath(bgArc, juce::PathStrokeType(3.0f));

    // Value arc with glow
    if (sliderPos > 0.001f) {
        juce::Path valueArc;
        valueArc.addCentredArc(centreX, centreY, radius, radius, 0.0f,
                                rotaryStartAngle, angle, true);
        g.setColour(accentColour.withAlpha(0.2f));
        g.strokePath(valueArc, juce::PathStrokeType(7.0f));
        g.setColour(accentColour);
        g.strokePath(valueArc, juce::PathStrokeType(2.5f));
    }

    // White pointer line
    auto pointerLen = radius * 0.82f;
    auto px = centreX + pointerLen * std::cos(angle - juce::MathConstants<float>::halfPi);
    auto py = centreY + pointerLen * std::sin(angle - juce::MathConstants<float>::halfPi);
    g.setColour(juce::Colours::white);
    g.drawLine(centreX, centreY, px, py, 2.0f);
}

void VamosLookAndFeel::drawComboBox(juce::Graphics& g, int width, int height, bool,
                                     int, int, int, int, juce::ComboBox&)
{
    auto bounds = juce::Rectangle<int>(0, 0, width, height).toFloat().reduced(0.5f);
    g.setColour(kPanelBg);
    g.fillRoundedRectangle(bounds, 4.0f);
    g.setColour(accentColour.withAlpha(0.5f));
    g.drawRoundedRectangle(bounds, 4.0f, 1.0f);

    float arrowX = (float)width - 14.0f;
    float arrowY = (float)height * 0.5f;
    juce::Path arrow;
    arrow.addTriangle(arrowX - 4, arrowY - 3, arrowX + 4, arrowY - 3, arrowX, arrowY + 3);
    g.setColour(accentColour);
    g.fillPath(arrow);
}

void VamosLookAndFeel::drawPopupMenuBackground(juce::Graphics& g, int width, int height) {
    g.fillAll(kPanelBg);
    g.setColour(kKnobTrack);
    g.drawRect(0, 0, width, height);
}

void VamosLookAndFeel::drawPopupMenuItem(juce::Graphics& g, const juce::Rectangle<int>& area,
                                          bool isSeparator, bool isActive, bool isHighlighted,
                                          bool isTicked, bool,
                                          const juce::String& text, const juce::String&,
                                          const juce::Drawable*, const juce::Colour*)
{
    if (isSeparator) {
        g.setColour(kKnobTrack);
        g.fillRect(area.reduced(5, 0).withHeight(1).withY(area.getCentreY()));
        return;
    }

    if (isHighlighted && isActive) {
        g.setColour(accentColour.withAlpha(0.18f));
        g.fillRect(area);
    }

    g.setColour(isActive ? (isTicked ? accentColour : kText) : kDimText);
    g.setFont(juce::Font(13.0f));
    g.drawText(text, area.reduced(10, 0), juce::Justification::centredLeft);
}

void VamosLookAndFeel::drawToggleButton(juce::Graphics& g, juce::ToggleButton& button,
                                          bool shouldDrawButtonAsHighlighted, bool)
{
    auto bounds = button.getLocalBounds().toFloat();
    float diameter = juce::jmin(bounds.getWidth(), bounds.getHeight()) - 2.0f;
    auto circle = bounds.withSizeKeepingCentre(diameter, diameter);

    bool isOn = button.getToggleState();

    // Outer ring
    g.setColour(isOn ? accentColour : kKnobTrack);
    g.drawEllipse(circle.reduced(1.0f), 1.5f);

    // Filled centre when on
    if (isOn) {
        g.setColour(accentColour.withAlpha(0.8f));
        g.fillEllipse(circle.reduced(4.0f));
    }

    // Highlight on hover
    if (shouldDrawButtonAsHighlighted) {
        g.setColour(accentColour.withAlpha(0.12f));
        g.fillEllipse(circle);
    }
}

// ── VamosEditor ────────────────────────────────────────────────────────────

VamosEditor::VamosEditor(VamosProcessor& p)
    : AudioProcessorEditor(p), processor(p)
{
    setLookAndFeel(&vamosLAF);

    // Create ALL child components before setSize
    osc1TypeCombo      = createCombo("osc1Type", "Type");
    osc1ShapeKnob      = createKnob("osc1Shape", "Shape");
    osc2TypeCombo      = createCombo("osc2Type", "Type");
    osc2DetuneKnob     = createKnob("osc2Detune", "Detune");
    osc2TransposeKnob  = createKnob("osc2Transpose", "Trans");
    osc1GainKnob       = createKnob("osc1Gain", "Osc1");
    osc2GainKnob       = createKnob("osc2Gain", "Osc2");
    noiseLevelKnob     = createKnob("noiseLevel", "Noise");
    osc1OnToggle       = createToggle("osc1On", "On");
    osc2OnToggle       = createToggle("osc2On", "On");
    noiseOnToggle      = createToggle("noiseOn", "On");
    filterTypeCombo    = createCombo("filterType", "Type");
    filterFreqKnob     = createKnob("filterFreq", "Freq");
    filterResKnob      = createKnob("filterRes", "Res");
    filterTrackingKnob = createKnob("filterTracking", "Key");
    envAttackKnob      = createKnob("env1Attack", "A");
    envDecayKnob       = createKnob("env1Decay", "D");
    envSustainKnob     = createKnob("env1Sustain", "S");
    envReleaseKnob     = createKnob("env1Release", "R");
    lfoShapeCombo      = createCombo("lfoShape", "Shape");
    lfoRateKnob        = createKnob("lfoRate", "Rate");
    lfoAmountKnob      = createKnob("lfoAmount", "Amt");
    volumeKnob         = createKnob("volume", "Vol");
    driftKnob          = createKnob("driftDepth", "Drift");
    voiceModeCombo     = createCombo("voiceMode", "Voice");
    glideKnob          = createKnob("glide", "Glide");
    transposeKnob      = createKnob("transpose", "Trans");
    velModKnob         = createKnob("volVelMod", "Vel");
    bendRangeKnob      = createKnob("pitchBendRange", "Bend");
    hiQualityToggle    = createToggle("hiQuality", "HQ");
    resetPhaseToggle   = createToggle("resetOscPhase", "Reset");

    setSize(960, 500);
    startTimerHz(30);
}

VamosEditor::~VamosEditor() {
    setLookAndFeel(nullptr);
}

// ── Component factories ────────────────────────────────────────────────────

VamosEditor::KnobWithLabel VamosEditor::createKnob(const juce::String& paramId,
                                                    const juce::String& labelText)
{
    KnobWithLabel kwl;
    kwl.slider = std::make_unique<juce::Slider>(juce::Slider::RotaryHorizontalVerticalDrag,
                                                 juce::Slider::NoTextBox);
    kwl.slider->setLookAndFeel(&vamosLAF);
    addAndMakeVisible(kwl.slider.get());

    kwl.label = std::make_unique<juce::Label>("", labelText);
    kwl.label->setFont(juce::Font(10.0f));
    kwl.label->setColour(juce::Label::textColourId, kDimText);
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
    cwl.combo->setLookAndFeel(&vamosLAF);

    if (auto* choiceParam = dynamic_cast<juce::AudioParameterChoice*>(
            processor.apvts.getParameter(paramId))) {
        cwl.combo->addItemList(choiceParam->choices, 1);
    }

    addAndMakeVisible(cwl.combo.get());

    cwl.label = std::make_unique<juce::Label>("", labelText);
    cwl.label->setFont(juce::Font(10.0f));
    cwl.label->setColour(juce::Label::textColourId, kDimText);
    cwl.label->setJustificationType(juce::Justification::centred);
    addAndMakeVisible(cwl.label.get());

    cwl.attachment = std::make_unique<juce::AudioProcessorValueTreeState::ComboBoxAttachment>(
        processor.apvts, paramId, *cwl.combo);

    return cwl;
}

VamosEditor::ToggleWithLabel VamosEditor::createToggle(const juce::String& paramId,
                                                        const juce::String& labelText)
{
    ToggleWithLabel twl;
    twl.button = std::make_unique<juce::ToggleButton>();
    twl.button->setLookAndFeel(&vamosLAF);
    addAndMakeVisible(twl.button.get());

    twl.label = std::make_unique<juce::Label>("", labelText);
    twl.label->setFont(juce::Font(9.0f));
    twl.label->setColour(juce::Label::textColourId, kDimText);
    twl.label->setJustificationType(juce::Justification::centred);
    addAndMakeVisible(twl.label.get());

    twl.attachment = std::make_unique<juce::AudioProcessorValueTreeState::ButtonAttachment>(
        processor.apvts, paramId, *twl.button);

    return twl;
}

// ── Colour / name helpers ──────────────────────────────────────────────────

juce::Colour VamosEditor::getBlockColour(Block b) const {
    switch (b) {
        case Block::Osc1:
        case Block::Osc2:
        case Block::Noise:      return kCyan;
        case Block::Mixer:      return kAmber;
        case Block::Filter:     return kPink;
        case Block::Amp:        return kGreen;
        case Block::Out:        return juce::Colours::white;
        case Block::Env2:
        case Block::CycEnv:
        case Block::LFO:
        case Block::ModMatrix:  return kViolet;
        case Block::Drift:      return kDriftYellow;
    }
    return kCyan;
}

juce::String VamosEditor::getBlockName(Block b) const {
    switch (b) {
        case Block::Osc1:      return "OSC 1";
        case Block::Osc2:      return "OSC 2";
        case Block::Noise:     return "NOISE";
        case Block::Mixer:     return "MIXER";
        case Block::Filter:    return "FILTER";
        case Block::Amp:       return "AMP ENVELOPE";
        case Block::Out:       return "OUTPUT";
        case Block::Env2:      return "ENVELOPE 2";
        case Block::CycEnv:    return "CYCLING ENVELOPE";
        case Block::LFO:       return "LFO";
        case Block::ModMatrix: return "MOD MATRIX";
        case Block::Drift:     return "DRIFT";
    }
    return {};
}

// ── Drawing helpers ────────────────────────────────────────────────────────

void VamosEditor::drawBlock(juce::Graphics& g, juce::Rectangle<float> bounds,
                             const juce::String& label, bool, juce::Colour colour)
{
    // All blocks draw in dim/unselected style (decorative only)
    g.setColour(colour.withAlpha(0.06f));
    g.fillRoundedRectangle(bounds, 5.0f);
    g.setColour(colour.withAlpha(0.25f));
    g.drawRoundedRectangle(bounds, 5.0f, 1.0f);
    g.setColour(colour.withAlpha(0.45f));
    g.setFont(juce::Font(10.0f));
    g.drawText(label, bounds, juce::Justification::centred);
}

void VamosEditor::drawNeonLine(juce::Graphics& g, float x1, float y1, float x2, float y2,
                                juce::Colour colour)
{
    g.setColour(colour.withAlpha(0.15f));
    g.drawLine(x1, y1, x2, y2, 4.0f);
    g.setColour(colour.withAlpha(0.6f));
    g.drawLine(x1, y1, x2, y2, 1.5f);
}

void VamosEditor::drawSignalFlow(juce::Graphics& g) {
    const float bw = 66.0f, bh = 26.0f;
    const float startX = 30.0f, topY = 36.0f;
    const float vGap = 5.0f, hGap = 18.0f;

    // ── Source column ──
    auto osc1Rect  = juce::Rectangle<float>(startX, topY, bw, bh);
    auto osc2Rect  = juce::Rectangle<float>(startX, topY + bh + vGap, bw, bh);
    auto noiseRect = juce::Rectangle<float>(startX, topY + 2 * (bh + vGap), bw, bh);

    drawBlock(g, osc1Rect,  "Osc 1", false, kCyan);
    drawBlock(g, osc2Rect,  "Osc 2", false, kCyan);
    drawBlock(g, noiseRect, "Noise", false, kCyan);

    // ── Mixer ──
    float mixerX = startX + bw + hGap;
    auto mixerRect = juce::Rectangle<float>(mixerX, osc2Rect.getY(), bw, bh);
    drawBlock(g, mixerRect, "Mixer", false, kAmber);

    drawNeonLine(g, osc1Rect.getRight(),  osc1Rect.getCentreY(),  mixerRect.getX(), mixerRect.getCentreY() - 6, kCyan);
    drawNeonLine(g, osc2Rect.getRight(),  osc2Rect.getCentreY(),  mixerRect.getX(), mixerRect.getCentreY(),     kCyan);
    drawNeonLine(g, noiseRect.getRight(), noiseRect.getCentreY(), mixerRect.getX(), mixerRect.getCentreY() + 6, kCyan);

    // ── Filter ──
    float filterX = mixerX + bw + hGap;
    auto filterRect = juce::Rectangle<float>(filterX, osc2Rect.getY(), bw, bh);
    drawBlock(g, filterRect, "Filter", false, kPink);
    drawNeonLine(g, mixerRect.getRight(), mixerRect.getCentreY(), filterRect.getX(), filterRect.getCentreY(), kAmber);

    // ── Amp ──
    float ampX = filterX + bw + hGap;
    auto ampRect = juce::Rectangle<float>(ampX, osc2Rect.getY(), bw, bh);
    drawBlock(g, ampRect, "Amp", false, kGreen);
    drawNeonLine(g, filterRect.getRight(), filterRect.getCentreY(), ampRect.getX(), ampRect.getCentreY(), kPink);

    // ── OUT ──
    float outX = ampX + bw + hGap;
    auto outRect = juce::Rectangle<float>(outX, osc2Rect.getY(), 44, bh);
    drawBlock(g, outRect, "OUT", false, juce::Colours::white);
    drawNeonLine(g, ampRect.getRight(), ampRect.getCentreY(), outRect.getX(), outRect.getCentreY(), kGreen);

    // ── Modulator row ──
    float modY = noiseRect.getBottom() + 14.0f;
    float modBw = 56.0f, modGap = 6.0f;

    g.setColour(kDimText);
    g.setFont(juce::Font(8.0f));
    g.drawText("MODULATORS", startX, modY - 10, 100, 10, juce::Justification::left);

    auto env2Rect = juce::Rectangle<float>(startX, modY, modBw, bh);
    drawBlock(g, env2Rect, "Env 2", false, kViolet);

    auto cycRect = juce::Rectangle<float>(startX + modBw + modGap, modY, modBw, bh);
    drawBlock(g, cycRect, "CycEnv", false, kViolet);

    auto lfoRect = juce::Rectangle<float>(startX + 2 * (modBw + modGap), modY, modBw, bh);
    drawBlock(g, lfoRect, "LFO", false, kViolet);

    auto modMatRect = juce::Rectangle<float>(startX + 3 * (modBw + modGap), modY, modBw + 8, bh);
    drawBlock(g, modMatRect, "ModMtx", false, kViolet);

    auto driftRect = juce::Rectangle<float>(startX + 4 * (modBw + modGap) + 8, modY, modBw, bh);
    drawBlock(g, driftRect, "Drift", false, kDriftYellow);

    // ── Dashed mod connections ──
    float dashLengths[] = {3.0f, 3.0f};
    g.setColour(kViolet.withAlpha(0.15f));
    g.drawDashedLine(juce::Line<float>(env2Rect.getCentreX(), env2Rect.getY(),
                     filterRect.getCentreX(), filterRect.getBottom()), dashLengths, 2, 1.0f);
    g.drawDashedLine(juce::Line<float>(lfoRect.getCentreX(), lfoRect.getY(),
                     filterRect.getCentreX() + 10, filterRect.getBottom()), dashLengths, 2, 1.0f);
    g.setColour(kDriftYellow.withAlpha(0.15f));
    g.drawDashedLine(juce::Line<float>(driftRect.getCentreX(), driftRect.getY(),
                     osc1Rect.getCentreX(), osc1Rect.getBottom()), dashLengths, 2, 1.0f);

    // ── Voice indicators ──
    const auto& voices = processor.getSynth().getVoices();
    float voiceX = outRect.getRight() + 20.0f;
    float voiceBaseY = osc1Rect.getY();

    g.setColour(kDimText);
    g.setFont(juce::Font(8.0f));
    g.drawText("VOICES", voiceX, voiceBaseY - 2, 60, 10, juce::Justification::left);

    for (int i = 0; i < 8; ++i) {
        float vx = voiceX + (float)(i % 4) * 18.0f;
        float vy = voiceBaseY + 10.0f + (float)(i / 4) * 14.0f;
        bool active = voices[i].isActive();
        g.setColour(active ? kGreen : juce::Colour(0xFF222244));
        g.fillRoundedRectangle(vx, vy, 12, 9, 2.0f);
        g.setColour(juce::Colours::white.withAlpha(active ? 0.9f : 0.2f));
        g.setFont(juce::Font(7.0f));
        g.drawText(juce::String(i + 1), (int)vx, (int)vy, 12, 9, juce::Justification::centred);
    }
}

// ── Sushi sections ─────────────────────────────────────────────────────────

void VamosEditor::drawSushiSections(juce::Graphics& g) {
    struct Section {
        int x, w;
        const char* name;
    };
    Section sections[] = {
        { kOscX,  kOscW,  "OSC 1+2"  },
        { kMixX,  kMixW,  "MIX"      },
        { kFiltX, kFiltW, "FILTER"   },
        { kEnvX,  kEnvW,  "ENVELOPE" },
        { kLfoX,  kLfoW,  "LFO"     },
        { kGlobX, kGlobW, "GLOBAL"  },
    };

    for (auto& s : sections) {
        auto area = juce::Rectangle<int>(s.x, kSectionTop, s.w, getHeight() - kSectionTop - 4).toFloat();

        // Section background
        g.setColour(kPanelBg.withAlpha(0.6f));
        g.fillRoundedRectangle(area, 4.0f);

        // Section border
        g.setColour(kKnobTrack.withAlpha(0.5f));
        g.drawRoundedRectangle(area, 4.0f, 1.0f);

        // Section header
        g.setColour(kCyan);
        g.setFont(juce::Font(11.0f).boldened());
        g.drawText(s.name, s.x + 6, kSectionTop + 2, s.w - 12, kHeaderH,
                   juce::Justification::centredLeft);
    }
}

// ── Paint ──────────────────────────────────────────────────────────────────

void VamosEditor::paint(juce::Graphics& g) {
    g.fillAll(kBackground);

    // Title
    g.setColour(kText);
    g.setFont(juce::Font(18.0f).boldened());
    g.drawText("VAMOS", 0, 4, getWidth(), 22, juce::Justification::centred);

    // Signal flow diagram (top section)
    drawSignalFlow(g);

    // Accent separator line at y=kSeparatorY
    g.setColour(kCyan.withAlpha(0.10f));
    g.fillRect(0.0f, (float)kSeparatorY - 2, (float)getWidth(), 7.0f);
    g.setColour(kCyan);
    g.fillRect(0.0f, (float)kSeparatorY, (float)getWidth(), 2.0f);

    // Sushi section backgrounds + headers
    drawSushiSections(g);

    // Sub-headers in OSC section
    g.setColour(kDimText);
    g.setFont(juce::Font(9.0f));
    g.drawText("Osc 1", kOscX + kMarginX, kParamTop, 80, 12, juce::Justification::left);
    g.drawText("Osc 2", kOscX + kMarginX, kParamTop + kComboH + kKnobSize + kLabelH + 14, 80, 12,
               juce::Justification::left);

    // CRT scan lines
    g.setColour(juce::Colours::black.withAlpha(0.07f));
    for (int sy = 0; sy < getHeight(); sy += 3)
        g.fillRect(0, sy, getWidth(), 1);
}

// ── Layout ─────────────────────────────────────────────────────────────────

void VamosEditor::resized() {
    auto placeKnob = [](KnobWithLabel& k, int x, int y) {
        k.slider->setBounds(x, y, kKnobSize, kKnobSize);
        k.label->setBounds(x, y + kKnobSize, kKnobSize, kLabelH);
    };
    auto placeCombo = [](ComboWithLabel& c, int x, int y) {
        c.combo->setBounds(x, y, kComboW, kComboH);
        c.label->setBounds(x, y - kLabelH, kComboW, kLabelH);
    };
    auto placeToggle = [](ToggleWithLabel& t, int x, int y) {
        t.button->setBounds(x, y, kToggleSize, kToggleSize);
        t.label->setBounds(x - 4, y + kToggleSize, kToggleSize + 8, kLabelH);
    };

    int py = kParamTop;  // base Y for params

    // ── OSC 1+2 section ──
    int oscInner = kOscX + kMarginX;
    int osc1Y = py + 14; // after sub-header
    placeCombo(osc1TypeCombo, oscInner, osc1Y + kLabelH);
    placeKnob(osc1ShapeKnob, oscInner + kComboW + 8, osc1Y);

    int osc2Y = osc1Y + kComboH + kKnobSize + kLabelH + 14 + 12; // after "Osc 2" sub-header
    placeCombo(osc2TypeCombo, oscInner, osc2Y + kLabelH);
    placeKnob(osc2DetuneKnob, oscInner, osc2Y + kLabelH + kComboH + 6);
    placeKnob(osc2TransposeKnob, oscInner + kKnobSize + 4, osc2Y + kLabelH + kComboH + 6);

    // ── MIX section ──
    int mixInner = kMixX + kMarginX;
    int mixRow = py + 8;
    int mixRowH = kKnobSize + kLabelH + 4;
    placeKnob(osc1GainKnob, mixInner, mixRow);
    placeToggle(osc1OnToggle, mixInner + kKnobSize + 6, mixRow + 14);
    placeKnob(osc2GainKnob, mixInner, mixRow + mixRowH);
    placeToggle(osc2OnToggle, mixInner + kKnobSize + 6, mixRow + mixRowH + 14);
    placeKnob(noiseLevelKnob, mixInner, mixRow + 2 * mixRowH);
    placeToggle(noiseOnToggle, mixInner + kKnobSize + 6, mixRow + 2 * mixRowH + 14);

    // ── FILTER section ──
    int filtInner = kFiltX + kMarginX;
    int filtY = py + 8;
    placeCombo(filterTypeCombo, filtInner, filtY + kLabelH);
    int filtKnobY = filtY + kLabelH + kComboH + 8;
    placeKnob(filterFreqKnob, filtInner, filtKnobY);
    placeKnob(filterResKnob, filtInner + kKnobSize + 4, filtKnobY);
    placeKnob(filterTrackingKnob, filtInner, filtKnobY + kKnobSize + kLabelH + 4);

    // ── ENVELOPE section ──
    int envInner = kEnvX + kMarginX;
    int envY = py + 8;
    // 2x2 grid
    int envColW = kKnobSize + 4;
    placeKnob(envAttackKnob,  envInner, envY);
    placeKnob(envDecayKnob,   envInner + envColW, envY);
    placeKnob(envSustainKnob, envInner + 2 * envColW, envY);
    placeKnob(envReleaseKnob, envInner + 3 * envColW, envY);

    // ── LFO section ──
    int lfoInner = kLfoX + kMarginX;
    int lfoY = py + 8;
    placeCombo(lfoShapeCombo, lfoInner, lfoY + kLabelH);
    int lfoKnobY = lfoY + kLabelH + kComboH + 8;
    placeKnob(lfoRateKnob, lfoInner, lfoKnobY);
    placeKnob(lfoAmountKnob, lfoInner + kKnobSize + 4, lfoKnobY);

    // ── GLOBAL section ──
    int globInner = kGlobX + kMarginX;
    int globY = py + 8;
    placeCombo(voiceModeCombo, globInner, globY + kLabelH);
    int globKnobY = globY + kLabelH + kComboH + 8;
    int globColW = kKnobSize + 4;
    // 2-column grid of knobs
    placeKnob(volumeKnob,    globInner, globKnobY);
    placeKnob(driftKnob,     globInner + globColW, globKnobY);
    placeKnob(transposeKnob, globInner, globKnobY + kKnobSize + kLabelH + 2);
    placeKnob(glideKnob,     globInner + globColW, globKnobY + kKnobSize + kLabelH + 2);
    placeKnob(velModKnob,    globInner, globKnobY + 2 * (kKnobSize + kLabelH + 2));
    placeKnob(bendRangeKnob, globInner + globColW, globKnobY + 2 * (kKnobSize + kLabelH + 2));
    // Toggles below the knob grid
    int globToggleY = globKnobY + 3 * (kKnobSize + kLabelH + 2);
    placeToggle(hiQualityToggle, globInner + 10, globToggleY);
    placeToggle(resetPhaseToggle, globInner + 10 + kToggleSize + 30, globToggleY);
}
