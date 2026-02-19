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
        // Glow layer (wide, semi-transparent)
        g.setColour(accentColour.withAlpha(0.2f));
        g.strokePath(valueArc, juce::PathStrokeType(7.0f));
        // Bright core
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

    // Triangle arrow
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

// ── VamosEditor ────────────────────────────────────────────────────────────

VamosEditor::VamosEditor(VamosProcessor& p)
    : AudioProcessorEditor(p), processor(p)
{
    // 1. Set LookAndFeel
    setLookAndFeel(&vamosLAF);

    // 2. Create ALL child components before setSize
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

    // 3. Set initial visibility (hides non-Osc1 controls)
    showBlockParams(Block::Osc1);

    // 4. setSize triggers resized() -> layoutParamPanel()
    setSize(740, 440);

    // 5. Start repaint timer
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
    kwl.label->setFont(juce::Font(11.0f));
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
    cwl.label->setFont(juce::Font(11.0f));
    cwl.label->setColour(juce::Label::textColourId, kDimText);
    cwl.label->setJustificationType(juce::Justification::centred);
    addAndMakeVisible(cwl.label.get());

    cwl.attachment = std::make_unique<juce::AudioProcessorValueTreeState::ComboBoxAttachment>(
        processor.apvts, paramId, *cwl.combo);

    return cwl;
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
                             const juce::String& label, bool selected, juce::Colour colour)
{
    if (selected) {
        // Glow halo (layered semi-transparent rects)
        g.setColour(colour.withAlpha(0.07f));
        g.fillRoundedRectangle(bounds.expanded(6), 8.0f);
        g.setColour(colour.withAlpha(0.12f));
        g.fillRoundedRectangle(bounds.expanded(3), 7.0f);

        // Bright fill
        g.setColour(colour.withAlpha(0.2f));
        g.fillRoundedRectangle(bounds, 5.0f);

        // Bright border
        g.setColour(colour);
        g.drawRoundedRectangle(bounds, 5.0f, 1.5f);

        // Full-alpha label
        g.setColour(colour);
        g.setFont(juce::Font(11.0f).boldened());
        g.drawText(label, bounds, juce::Justification::centred);
    } else {
        // Dim fill
        g.setColour(colour.withAlpha(0.06f));
        g.fillRoundedRectangle(bounds, 5.0f);

        // Subtle border
        g.setColour(colour.withAlpha(0.25f));
        g.drawRoundedRectangle(bounds, 5.0f, 1.0f);

        // 0.45 alpha label
        g.setColour(colour.withAlpha(0.45f));
        g.setFont(juce::Font(11.0f));
        g.drawText(label, bounds, juce::Justification::centred);
    }
}

void VamosEditor::drawNeonLine(juce::Graphics& g, float x1, float y1, float x2, float y2,
                                juce::Colour colour)
{
    // Wide glow layer
    g.setColour(colour.withAlpha(0.15f));
    g.drawLine(x1, y1, x2, y2, 4.0f);
    // Thin bright core
    g.setColour(colour.withAlpha(0.6f));
    g.drawLine(x1, y1, x2, y2, 1.5f);
}

void VamosEditor::drawSignalFlow(juce::Graphics& g) {
    blockHitAreas.clear();

    const float bw = 72.0f, bh = 30.0f;
    const float startX = 30.0f, topY = 40.0f;
    const float vGap = 8.0f, hGap = 22.0f;

    // ── Source column ──
    auto osc1Rect  = juce::Rectangle<float>(startX, topY, bw, bh);
    auto osc2Rect  = juce::Rectangle<float>(startX, topY + bh + vGap, bw, bh);
    auto noiseRect = juce::Rectangle<float>(startX, topY + 2 * (bh + vGap), bw, bh);

    drawBlock(g, osc1Rect,  "Osc 1", selectedBlock == Block::Osc1,  kCyan);
    drawBlock(g, osc2Rect,  "Osc 2", selectedBlock == Block::Osc2,  kCyan);
    drawBlock(g, noiseRect, "Noise", selectedBlock == Block::Noise, kCyan);

    blockHitAreas.push_back({Block::Osc1,  osc1Rect});
    blockHitAreas.push_back({Block::Osc2,  osc2Rect});
    blockHitAreas.push_back({Block::Noise, noiseRect});

    // ── Mixer ──
    float mixerX = startX + bw + hGap;
    auto mixerRect = juce::Rectangle<float>(mixerX, osc2Rect.getY(), bw, bh);
    drawBlock(g, mixerRect, "Mixer", selectedBlock == Block::Mixer, kAmber);
    blockHitAreas.push_back({Block::Mixer, mixerRect});

    // Neon arrows: sources → mixer
    drawNeonLine(g, osc1Rect.getRight(),  osc1Rect.getCentreY(),  mixerRect.getX(), mixerRect.getCentreY() - 6, kCyan);
    drawNeonLine(g, osc2Rect.getRight(),  osc2Rect.getCentreY(),  mixerRect.getX(), mixerRect.getCentreY(),     kCyan);
    drawNeonLine(g, noiseRect.getRight(), noiseRect.getCentreY(), mixerRect.getX(), mixerRect.getCentreY() + 6, kCyan);

    // ── Filter ──
    float filterX = mixerX + bw + hGap;
    auto filterRect = juce::Rectangle<float>(filterX, osc2Rect.getY(), bw, bh);
    drawBlock(g, filterRect, "Filter", selectedBlock == Block::Filter, kPink);
    blockHitAreas.push_back({Block::Filter, filterRect});
    drawNeonLine(g, mixerRect.getRight(), mixerRect.getCentreY(), filterRect.getX(), filterRect.getCentreY(), kAmber);

    // ── Amp ──
    float ampX = filterX + bw + hGap;
    auto ampRect = juce::Rectangle<float>(ampX, osc2Rect.getY(), bw, bh);
    drawBlock(g, ampRect, "Amp", selectedBlock == Block::Amp, kGreen);
    blockHitAreas.push_back({Block::Amp, ampRect});
    drawNeonLine(g, filterRect.getRight(), filterRect.getCentreY(), ampRect.getX(), ampRect.getCentreY(), kPink);

    // ── OUT ──
    float outX = ampX + bw + hGap;
    auto outRect = juce::Rectangle<float>(outX, osc2Rect.getY(), 50, bh);
    drawBlock(g, outRect, "OUT", selectedBlock == Block::Out, juce::Colours::white);
    blockHitAreas.push_back({Block::Out, outRect});
    drawNeonLine(g, ampRect.getRight(), ampRect.getCentreY(), outRect.getX(), outRect.getCentreY(), kGreen);

    // ── Modulator row ──
    float modY = noiseRect.getBottom() + 18.0f;
    float modBw = 62.0f, modGap = 8.0f;

    g.setColour(kDimText);
    g.setFont(juce::Font(9.0f));
    g.drawText("MODULATORS", startX, modY - 12, 120, 10, juce::Justification::left);

    auto env2Rect = juce::Rectangle<float>(startX, modY, modBw, bh);
    drawBlock(g, env2Rect, "Env 2", selectedBlock == Block::Env2, kViolet);
    blockHitAreas.push_back({Block::Env2, env2Rect});

    auto cycRect = juce::Rectangle<float>(startX + modBw + modGap, modY, modBw, bh);
    drawBlock(g, cycRect, "CycEnv", selectedBlock == Block::CycEnv, kViolet);
    blockHitAreas.push_back({Block::CycEnv, cycRect});

    auto lfoRect = juce::Rectangle<float>(startX + 2 * (modBw + modGap), modY, modBw, bh);
    drawBlock(g, lfoRect, "LFO", selectedBlock == Block::LFO, kViolet);
    blockHitAreas.push_back({Block::LFO, lfoRect});

    auto modMatRect = juce::Rectangle<float>(startX + 3 * (modBw + modGap), modY, modBw + 10, bh);
    drawBlock(g, modMatRect, "ModMtx", selectedBlock == Block::ModMatrix, kViolet);
    blockHitAreas.push_back({Block::ModMatrix, modMatRect});

    auto driftRect = juce::Rectangle<float>(startX + 4 * (modBw + modGap) + 10, modY, modBw, bh);
    drawBlock(g, driftRect, "Drift", selectedBlock == Block::Drift, kDriftYellow);
    blockHitAreas.push_back({Block::Drift, driftRect});

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
    float voiceX = outRect.getRight() + 24.0f;
    float voiceBaseY = osc1Rect.getY();

    g.setColour(kDimText);
    g.setFont(juce::Font(9.0f));
    g.drawText("VOICES", voiceX, voiceBaseY - 2, 60, 10, juce::Justification::left);

    for (int i = 0; i < 8; ++i) {
        float vx = voiceX + (float)(i % 4) * 20.0f;
        float vy = voiceBaseY + 12.0f + (float)(i / 4) * 16.0f;
        bool active = voices[i].isActive();
        g.setColour(active ? kGreen : juce::Colour(0xFF222244));
        g.fillRoundedRectangle(vx, vy, 14, 10, 2.0f);
        g.setColour(juce::Colours::white.withAlpha(active ? 0.9f : 0.2f));
        g.setFont(juce::Font(8.0f));
        g.drawText(juce::String(i + 1), (int)vx, (int)vy, 14, 10, juce::Justification::centred);
    }
}

// ── Paint ──────────────────────────────────────────────────────────────────

void VamosEditor::paint(juce::Graphics& g) {
    // Background
    g.fillAll(kBackground);

    // Title
    g.setColour(kText);
    g.setFont(juce::Font(20.0f).boldened());
    g.drawText("VAMOS", 0, 6, getWidth(), 24, juce::Justification::centred);

    // Signal flow diagram (top section, 0–210)
    drawSignalFlow(g);

    // Accent separator — glowing 3px line at y=210
    auto accent = getBlockColour(selectedBlock);
    g.setColour(accent.withAlpha(0.10f));
    g.fillRect(0.0f, 207.0f, (float)getWidth(), 9.0f);
    g.setColour(accent);
    g.fillRect(0.0f, 210.0f, (float)getWidth(), 3.0f);

    // Panel background (213 → bottom)
    g.setColour(kPanelBg);
    g.fillRect(0, 213, getWidth(), getHeight() - 213);

    // Block name in panel header
    g.setColour(accent);
    g.setFont(juce::Font(14.0f).boldened());
    g.drawText(getBlockName(selectedBlock), 24, 218, 300, 22, juce::Justification::left);

    // "No parameters" for empty blocks
    if (selectedBlock == Block::Env2 || selectedBlock == Block::CycEnv || selectedBlock == Block::ModMatrix) {
        g.setColour(kDimText);
        g.setFont(juce::Font(13.0f));
        g.drawText("No parameters", 0, 310, getWidth(), 30, juce::Justification::centred);
    }

    // CRT scan lines — faint horizontal lines every 3px
    g.setColour(juce::Colours::black.withAlpha(0.07f));
    for (int sy = 0; sy < getHeight(); sy += 3)
        g.fillRect(0, sy, getWidth(), 1);
}

// ── Block interaction ──────────────────────────────────────────────────────

void VamosEditor::mouseDown(const juce::MouseEvent& e) {
    auto pos = e.getPosition().toFloat();
    for (auto& [block, rect] : blockHitAreas) {
        if (rect.contains(pos)) {
            showBlockParams(block);
            return;
        }
    }
}

void VamosEditor::showBlockParams(Block b) {
    selectedBlock = b;
    vamosLAF.accentColour = getBlockColour(b);

    // ── Hide ALL controls ──
    auto hideKnob = [](KnobWithLabel& k) {
        k.slider->setVisible(false);
        k.label->setVisible(false);
    };
    auto hideCombo = [](ComboWithLabel& c) {
        c.combo->setVisible(false);
        c.label->setVisible(false);
    };
    auto showKnob = [](KnobWithLabel& k) {
        k.slider->setVisible(true);
        k.label->setVisible(true);
    };
    auto showCombo = [](ComboWithLabel& c) {
        c.combo->setVisible(true);
        c.label->setVisible(true);
    };

    hideCombo(osc1TypeCombo);   hideKnob(osc1ShapeKnob);
    hideCombo(osc2TypeCombo);   hideKnob(osc2DetuneKnob);
    hideKnob(osc1GainKnob);    hideKnob(osc2GainKnob);    hideKnob(noiseLevelKnob);
    hideCombo(filterTypeCombo); hideKnob(filterFreqKnob);  hideKnob(filterResKnob);
    hideKnob(envAttackKnob);   hideKnob(envDecayKnob);
    hideKnob(envSustainKnob);  hideKnob(envReleaseKnob);
    hideCombo(lfoShapeCombo);   hideKnob(lfoRateKnob);
    hideKnob(volumeKnob);      hideKnob(driftKnob);
    hideCombo(voiceModeCombo);  hideKnob(glideKnob);
    hideKnob(transposeKnob);   hideKnob(velModKnob);      hideKnob(bendRangeKnob);

    // ── Show selected block's controls ──
    switch (b) {
        case Block::Osc1:
            showCombo(osc1TypeCombo);
            showKnob(osc1ShapeKnob);
            break;
        case Block::Osc2:
            showCombo(osc2TypeCombo);
            showKnob(osc2DetuneKnob);
            break;
        case Block::Noise:
            showKnob(noiseLevelKnob);
            break;
        case Block::Mixer:
            showKnob(osc1GainKnob);
            showKnob(osc2GainKnob);
            showKnob(noiseLevelKnob);
            break;
        case Block::Filter:
            showCombo(filterTypeCombo);
            showKnob(filterFreqKnob);
            showKnob(filterResKnob);
            break;
        case Block::Amp:
            showKnob(envAttackKnob);
            showKnob(envDecayKnob);
            showKnob(envSustainKnob);
            showKnob(envReleaseKnob);
            break;
        case Block::Out:
            showKnob(volumeKnob);
            showCombo(voiceModeCombo);
            showKnob(glideKnob);
            showKnob(transposeKnob);
            showKnob(velModKnob);
            showKnob(bendRangeKnob);
            break;
        case Block::LFO:
            showCombo(lfoShapeCombo);
            showKnob(lfoRateKnob);
            break;
        case Block::Drift:
            showKnob(driftKnob);
            break;
        case Block::Env2:
        case Block::CycEnv:
        case Block::ModMatrix:
            break;  // No parameters
    }

    layoutParamPanel();
    repaint();
}

// ── Layout ─────────────────────────────────────────────────────────────────

void VamosEditor::layoutParamPanel() {
    const int panelY = 250;
    const int knobSize = 56;
    const int comboW = 100, comboH = 24;
    const int labelH = 16;
    const int spacing = 16;
    int cx = getWidth() / 2;

    auto placeKnob = [&](KnobWithLabel& k, int x, int y) {
        if (k.slider->isVisible()) {
            k.slider->setBounds(x, y, knobSize, knobSize);
            k.label->setBounds(x, y + knobSize, knobSize, labelH);
        }
    };
    auto placeCombo = [&](ComboWithLabel& c, int x, int y) {
        if (c.combo->isVisible()) {
            c.combo->setBounds(x, y, comboW, comboH);
            c.label->setBounds(x, y - labelH - 2, comboW, labelH);
        }
    };

    switch (selectedBlock) {
        case Block::Osc1: {
            int totalW = comboW + spacing + knobSize;
            int sx = cx - totalW / 2;
            placeCombo(osc1TypeCombo, sx, panelY + 20);
            placeKnob(osc1ShapeKnob, sx + comboW + spacing, panelY);
            break;
        }
        case Block::Osc2: {
            int totalW = comboW + spacing + knobSize;
            int sx = cx - totalW / 2;
            placeCombo(osc2TypeCombo, sx, panelY + 20);
            placeKnob(osc2DetuneKnob, sx + comboW + spacing, panelY);
            break;
        }
        case Block::Noise: {
            placeKnob(noiseLevelKnob, cx - knobSize / 2, panelY);
            break;
        }
        case Block::Mixer: {
            int totalW = 3 * knobSize + 2 * spacing;
            int sx = cx - totalW / 2;
            placeKnob(osc1GainKnob,   sx, panelY);
            placeKnob(osc2GainKnob,   sx + knobSize + spacing, panelY);
            placeKnob(noiseLevelKnob,  sx + 2 * (knobSize + spacing), panelY);
            break;
        }
        case Block::Filter: {
            int totalW = comboW + spacing + 2 * knobSize + spacing;
            int sx = cx - totalW / 2;
            placeCombo(filterTypeCombo, sx, panelY + 20);
            placeKnob(filterFreqKnob,   sx + comboW + spacing, panelY);
            placeKnob(filterResKnob,    sx + comboW + 2 * spacing + knobSize, panelY);
            break;
        }
        case Block::Amp: {
            int totalW = 4 * knobSize + 3 * spacing;
            int sx = cx - totalW / 2;
            placeKnob(envAttackKnob,  sx, panelY);
            placeKnob(envDecayKnob,   sx + (knobSize + spacing), panelY);
            placeKnob(envSustainKnob, sx + 2 * (knobSize + spacing), panelY);
            placeKnob(envReleaseKnob, sx + 3 * (knobSize + spacing), panelY);
            break;
        }
        case Block::Out: {
            int totalW = 5 * knobSize + 4 * spacing;
            int sx = cx - totalW / 2;
            placeKnob(volumeKnob,    sx, panelY);
            placeKnob(glideKnob,     sx + (knobSize + spacing), panelY);
            placeKnob(transposeKnob, sx + 2 * (knobSize + spacing), panelY);
            placeKnob(velModKnob,    sx + 3 * (knobSize + spacing), panelY);
            placeKnob(bendRangeKnob, sx + 4 * (knobSize + spacing), panelY);
            placeCombo(voiceModeCombo, cx - comboW / 2, panelY + knobSize + labelH + 10);
            break;
        }
        case Block::LFO: {
            int totalW = comboW + spacing + knobSize;
            int sx = cx - totalW / 2;
            placeCombo(lfoShapeCombo, sx, panelY + 20);
            placeKnob(lfoRateKnob,   sx + comboW + spacing, panelY);
            break;
        }
        case Block::Drift: {
            placeKnob(driftKnob, cx - knobSize / 2, panelY);
            break;
        }
        default:
            break;
    }
}

void VamosEditor::resized() {
    layoutParamPanel();
}
