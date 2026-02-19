#include "PluginProcessor.h"
#include "PluginEditor.h"

static juce::StringArray oscType1Choices() {
    return { "Saw", "Triangle", "Sine", "Rectangle", "Pulse", "SharkTooth", "Saturated" };
}

static juce::StringArray oscType2Choices() {
    return { "Saw", "Triangle", "Sine", "Rectangle", "Saturated" };
}

static juce::StringArray filterTypeChoices() {
    return { "I", "II", "LowPass", "HighPass", "Comb", "Vowel", "DJ", "Resampling" };
}

static juce::StringArray lfoShapeChoices() {
    return { "Sine", "Triangle", "SawUp", "SawDown", "Square", "S&H", "Wander", "ExpEnv" };
}

static juce::StringArray noiseTypeChoices() {
    return { "White", "Pink" };
}

static juce::StringArray voiceModeChoices() {
    return { "Poly", "Mono", "Stereo", "Unison" };
}

juce::AudioProcessorValueTreeState::ParameterLayout VamosProcessor::createParameterLayout() {
    auto osc1 = std::make_unique<juce::AudioProcessorParameterGroup>("osc1", "Oscillator 1", "|");
    osc1->addChild(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID("osc1Type", 1), "Osc1 Type", oscType1Choices(), 0));
    osc1->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("osc1Shape", 1), "Osc1 Shape",
        juce::NormalisableRange<float>(0.0f, 1.0f), 0.0f));

    auto osc2 = std::make_unique<juce::AudioProcessorParameterGroup>("osc2", "Oscillator 2", "|");
    osc2->addChild(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID("osc2Type", 1), "Osc2 Type", oscType2Choices(), 2));
    osc2->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("osc2Detune", 1), "Osc2 Detune",
        juce::NormalisableRange<float>(-100.0f, 100.0f), 0.0f));
    osc2->addChild(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID("osc2Transpose", 1), "Osc2 Transpose", -24, 24, -12));

    auto mixer = std::make_unique<juce::AudioProcessorParameterGroup>("mixer", "Mixer", "|");
    mixer->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("osc1Gain", 1), "Osc1 Gain",
        juce::NormalisableRange<float>(0.0f, 2.0f), 0.5f));
    mixer->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("osc2Gain", 1), "Osc2 Gain",
        juce::NormalisableRange<float>(0.0f, 2.0f), 0.398f));
    mixer->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("noiseLevel", 1), "Noise Level",
        juce::NormalisableRange<float>(0.0f, 2.0f), 0.0f));
    mixer->addChild(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID("noiseType", 1), "Noise Type", noiseTypeChoices(), 0));
    mixer->addChild(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID("osc1On", 1), "Osc1 On", true));
    mixer->addChild(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID("osc2On", 1), "Osc2 On", true));
    mixer->addChild(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID("noiseOn", 1), "Noise On", true));

    auto filter = std::make_unique<juce::AudioProcessorParameterGroup>("filter", "Filter", "|");
    filter->addChild(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID("filterType", 1), "Filter Type", filterTypeChoices(), 0));
    filter->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("filterFreq", 1), "Filter Freq",
        juce::NormalisableRange<float>(20.0f, 20000.0f, 0.0f, 0.3f), 20000.0f));
    filter->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("filterRes", 1), "Filter Res",
        juce::NormalisableRange<float>(0.0f, 1.0f), 0.0f));
    filter->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("filterTracking", 1), "Filter Tracking",
        juce::NormalisableRange<float>(0.0f, 1.0f), 0.0f));

    auto envelope = std::make_unique<juce::AudioProcessorParameterGroup>("envelope", "Envelope", "|");
    envelope->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("env1Attack", 1), "Env1 Attack",
        juce::NormalisableRange<float>(0.001f, 6.0f, 0.0f, 0.4f), 0.001f));
    envelope->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("env1Decay", 1), "Env1 Decay",
        juce::NormalisableRange<float>(0.01f, 10.0f, 0.0f, 0.4f), 0.6f));
    envelope->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("env1Sustain", 1), "Env1 Sustain",
        juce::NormalisableRange<float>(0.0f, 1.0f), 0.7f));
    envelope->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("env1Release", 1), "Env1 Release",
        juce::NormalisableRange<float>(0.01f, 10.0f, 0.0f, 0.4f), 0.6f));

    auto lfo = std::make_unique<juce::AudioProcessorParameterGroup>("lfo", "LFO", "|");
    lfo->addChild(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID("lfoShape", 1), "LFO Shape", lfoShapeChoices(), 0));
    lfo->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("lfoRate", 1), "LFO Rate",
        juce::NormalisableRange<float>(0.01f, 30.0f, 0.0f, 0.4f), 0.4f));
    lfo->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("lfoAmount", 1), "LFO Amount",
        juce::NormalisableRange<float>(0.0f, 1.0f), 1.0f));

    auto global = std::make_unique<juce::AudioProcessorParameterGroup>("global", "Global", "|");
    global->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("volume", 1), "Volume",
        juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
    global->addChild(std::make_unique<juce::AudioParameterChoice>(
        juce::ParameterID("voiceMode", 1), "Voice Mode", voiceModeChoices(), 0));
    global->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("glide", 1), "Glide",
        juce::NormalisableRange<float>(0.0f, 1.0f), 0.0f));
    global->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("driftDepth", 1), "Drift Depth",
        juce::NormalisableRange<float>(0.0f, 1.0f), 0.072f));
    global->addChild(std::make_unique<juce::AudioParameterFloat>(
        juce::ParameterID("volVelMod", 1), "Vel Mod",
        juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
    global->addChild(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID("transpose", 1), "Transpose", -24, 24, 0));
    global->addChild(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID("hiQuality", 1), "Hi Quality", false));
    global->addChild(std::make_unique<juce::AudioParameterBool>(
        juce::ParameterID("resetOscPhase", 1), "Reset Phase", false));
    global->addChild(std::make_unique<juce::AudioParameterInt>(
        juce::ParameterID("pitchBendRange", 1), "Bend Range", 1, 24, 2));

    juce::AudioProcessorValueTreeState::ParameterLayout layout;
    layout.add(std::move(osc1));
    layout.add(std::move(osc2));
    layout.add(std::move(mixer));
    layout.add(std::move(filter));
    layout.add(std::move(envelope));
    layout.add(std::move(lfo));
    layout.add(std::move(global));
    return layout;
}

VamosProcessor::VamosProcessor()
    : AudioProcessor(BusesProperties()
          .withOutput("Output", juce::AudioChannelSet::stereo(), true)),
      apvts(*this, nullptr, "PARAMETERS", createParameterLayout())
{
}

void VamosProcessor::prepareToPlay(double sampleRate, int /*samplesPerBlock*/) {
    synth.setSampleRate(static_cast<float>(sampleRate));

    smoothedVolume.reset(sampleRate, 0.02);
    smoothedFilterFreq.reset(sampleRate, 0.005);
    smoothedOsc1Gain.reset(sampleRate, 0.02);
    smoothedOsc2Gain.reset(sampleRate, 0.02);
}

void VamosProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages) {
    buffer.clear();

    // Read APVTS parameters
    auto osc1TypeIdx = static_cast<int>(apvts.getRawParameterValue("osc1Type")->load());
    auto osc1Shape   = apvts.getRawParameterValue("osc1Shape")->load();
    auto osc2TypeIdx = static_cast<int>(apvts.getRawParameterValue("osc2Type")->load());
    auto osc2Detune  = apvts.getRawParameterValue("osc2Detune")->load();
    auto osc2Trans   = static_cast<int>(apvts.getRawParameterValue("osc2Transpose")->load());

    auto osc1Gain    = apvts.getRawParameterValue("osc1Gain")->load();
    auto osc2Gain    = apvts.getRawParameterValue("osc2Gain")->load();
    auto noiseLevel  = apvts.getRawParameterValue("noiseLevel")->load();
    auto noiseTypeIdx = static_cast<int>(apvts.getRawParameterValue("noiseType")->load());
    auto osc1On      = apvts.getRawParameterValue("osc1On")->load() > 0.5f;
    auto osc2On      = apvts.getRawParameterValue("osc2On")->load() > 0.5f;
    auto noiseOn     = apvts.getRawParameterValue("noiseOn")->load() > 0.5f;

    auto filterTypeIdx = static_cast<int>(apvts.getRawParameterValue("filterType")->load());
    auto filterFreq    = apvts.getRawParameterValue("filterFreq")->load();
    auto filterRes     = apvts.getRawParameterValue("filterRes")->load();
    auto filterTrack   = apvts.getRawParameterValue("filterTracking")->load();

    auto envA = apvts.getRawParameterValue("env1Attack")->load();
    auto envD = apvts.getRawParameterValue("env1Decay")->load();
    auto envS = apvts.getRawParameterValue("env1Sustain")->load();
    auto envR = apvts.getRawParameterValue("env1Release")->load();

    auto lfoShapeIdx = static_cast<int>(apvts.getRawParameterValue("lfoShape")->load());
    auto lfoRate     = apvts.getRawParameterValue("lfoRate")->load();
    auto lfoAmount   = apvts.getRawParameterValue("lfoAmount")->load();

    auto volume      = apvts.getRawParameterValue("volume")->load();
    auto voiceModeIdx = static_cast<int>(apvts.getRawParameterValue("voiceMode")->load());
    auto glide       = apvts.getRawParameterValue("glide")->load();
    auto driftDepth  = apvts.getRawParameterValue("driftDepth")->load();

    auto volVelMod       = apvts.getRawParameterValue("volVelMod")->load();
    auto transpose       = static_cast<int>(apvts.getRawParameterValue("transpose")->load());
    auto resetOscPhase   = apvts.getRawParameterValue("resetOscPhase")->load() > 0.5f;
    auto pitchBendRange  = static_cast<int>(apvts.getRawParameterValue("pitchBendRange")->load());

    // Build parameter state for the synth
    vamos::SynthParams sp;
    sp.osc1Type      = static_cast<vamos::OscillatorType1>(osc1TypeIdx);
    sp.osc1Shape     = osc1Shape;
    sp.osc2Type      = static_cast<vamos::OscillatorType1>(
        // Map OscType2 choice indices to OscillatorType1 enum
        // Choices: Saw(0), Triangle(1), Sine(2), Rectangle(3), Saturated(4)
        // OscillatorType1: Saw(0), Triangle(1), Sine(2), Rectangle(3), ..., Saturated(6)
        osc2TypeIdx <= 3 ? osc2TypeIdx : 6);
    sp.osc2Detune    = osc2Detune;
    sp.osc2Transpose = osc2Trans;

    sp.osc1Gain      = osc1Gain;
    sp.osc2Gain      = osc2Gain;
    sp.noiseLevel    = noiseLevel;
    sp.noiseType     = static_cast<vamos::NoiseType>(noiseTypeIdx);
    sp.osc1On        = osc1On;
    sp.osc2On        = osc2On;
    sp.noiseOn       = noiseOn;

    sp.filterType    = static_cast<vamos::FilterType>(filterTypeIdx);
    sp.filterFreq    = filterFreq;
    sp.filterRes     = filterRes;
    sp.filterTracking = filterTrack;

    sp.env1Attack    = envA;
    sp.env1Decay     = envD;
    sp.env1Sustain   = envS;
    sp.env1Release   = envR;

    sp.lfoShape      = static_cast<vamos::LfoShape>(lfoShapeIdx);
    sp.lfoRate       = lfoRate;
    sp.lfoAmount     = lfoAmount;

    sp.driftDepth    = driftDepth;
    sp.voiceMode     = static_cast<vamos::VoiceMode>(voiceModeIdx);
    // Glide parameter 0-1 maps to 0-2 seconds (exponential feel)
    sp.glideTime     = glide * 2.0f;

    sp.volVelMod     = volVelMod;
    sp.transpose     = transpose;
    sp.resetOscPhase = resetOscPhase;
    sp.pitchBendRange = pitchBendRange;

    synth.setParameters(sp);

    // Set smoothed targets
    smoothedVolume.setTargetValue(volume);
    smoothedFilterFreq.setTargetValue(filterFreq);
    smoothedOsc1Gain.setTargetValue(osc1Gain);
    smoothedOsc2Gain.setTargetValue(osc2Gain);

    // Process MIDI events
    for (const auto metadata : midiMessages) {
        auto msg = metadata.getMessage();
        if (msg.isNoteOn())
            synth.noteOn(msg.getNoteNumber(), msg.getFloatVelocity());
        else if (msg.isNoteOff())
            synth.noteOff(msg.getNoteNumber());
        else if (msg.isPitchWheel()) {
            // Convert 14-bit MIDI pitch wheel (0-16383, center 8192) to semitones
            float normalized = (msg.getPitchWheelValue() - 8192) / 8192.0f;
            synth.setPitchBend(normalized * static_cast<float>(pitchBendRange));
        }
        else if (msg.isAllNotesOff() || msg.isAllSoundOff()) {
            for (int n = 0; n < 128; ++n)
                synth.noteOff(n);
        }
    }

    // Render audio
    auto* leftChan = buffer.getWritePointer(0);
    auto* rightChan = buffer.getNumChannels() > 1 ? buffer.getWritePointer(1) : nullptr;

    for (int i = 0; i < buffer.getNumSamples(); ++i) {
        float vol = smoothedVolume.getNextValue();
        auto [l, r] = synth.process();
        l *= vol;
        r *= vol;
        leftChan[i] = l;
        if (rightChan) rightChan[i] = r;
    }
}

juce::AudioProcessorEditor* VamosProcessor::createEditor() {
    return new VamosEditor(*this);
}

void VamosProcessor::getStateInformation(juce::MemoryBlock& destData) {
    auto state = apvts.copyState();
    auto xml = state.createXml();
    copyXmlToBinary(*xml, destData);
}

void VamosProcessor::setStateInformation(const void* data, int sizeInBytes) {
    auto xml = getXmlFromBinary(data, sizeInBytes);
    if (xml != nullptr && xml->hasTagName(apvts.state.getType()))
        apvts.replaceState(juce::ValueTree::fromXml(*xml));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() {
    return new VamosProcessor();
}
