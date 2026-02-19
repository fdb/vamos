// All C++/CMake code snippets used across scenes

export const CMAKE_FETCH_CONTENT = `cmake_minimum_required(VERSION 3.24)
project(Vamos VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)

include(FetchContent)
FetchContent_Declare(JUCE
  GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
  GIT_TAG 8.0.6
)
FetchContent_MakeAvailable(JUCE)`;

export const JUCE_PLUGIN_TARGET = `juce_add_plugin(Vamos
  PRODUCT_NAME "Vamos"
  PLUGIN_MANUFACTURER_CODE Vamo
  PLUGIN_CODE Vms1
  FORMATS VST3 AU Standalone
  IS_SYNTH TRUE
  NEEDS_MIDI_INPUT TRUE
)`;

export const PHASOR_CODE = `class Phasor {
  float phase = 0.0f;
  float increment = 0.0f;

public:
  void setFrequency(float freq, float sampleRate) {
    increment = freq / sampleRate;
  }

  float next() {
    float value = phase;
    phase += increment;
    if (phase >= 1.0f)
      phase -= 1.0f;
    return value;
  }
};`;

export const NAIVE_SAW = `float naiveSaw(float phase) {
  return 2.0f * phase - 1.0f;
}`;

export const POLYBLEP_CODE = `float polyBLEP(float t, float dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1.0f;
  }
  if (t > 1.0f - dt) {
    t = (t - 1.0f) / dt;
    return t * t + t + t + 1.0f;
  }
  return 0.0f;
}

float saw(float phase, float increment) {
  float value = 2.0f * phase - 1.0f;
  value -= polyBLEP(phase, increment);
  return value;
}`;

export const ENVELOPE_CODE = `class Envelope {
  enum Stage { Idle, Attack, Decay, Sustain, Release };
  Stage stage = Idle;
  float level = 0.0f;
  float attackCoeff, decayCoeff, releaseCoeff;
  float sustainLevel = 0.7f;

  // Overshoot target: 1.2 so curve reaches 1.0
  static constexpr float ATTACK_TARGET = 1.2f;

public:
  void noteOn() { stage = Attack; }
  void noteOff() { stage = Release; }

  float next() {
    switch (stage) {
      case Attack:
        level += attackCoeff * (ATTACK_TARGET - level);
        if (level >= 1.0f) { level = 1.0f; stage = Decay; }
        break;
      case Decay:
        level += decayCoeff * (sustainLevel - level);
        break;
      case Release:
        level += releaseCoeff * (0.0f - level);
        if (level < 0.001f) { level = 0.0f; stage = Idle; }
        break;
    }
    return level;
  }
};`;

export const VOICE_CODE = `class Voice {
  Oscillator osc1, osc2;
  Envelope ampEnv;
  Filter filter;

  void noteOn(int midiNote, float velocity) {
    float freq = 440.0f * std::pow(2.0f,
      (midiNote - 69) / 12.0f);
    osc1.setFrequency(freq);
    osc2.setFrequency(freq);
    ampEnv.noteOn();
  }

  float process() {
    float osc = osc1.next() + osc2.next();
    float filtered = filter.process(osc);
    return filtered * ampEnv.next();
  }
};`;

export const SYNTH_CODE = `class Synth {
  static constexpr int NUM_VOICES = 8;
  std::array<Voice, NUM_VOICES> voices;

  void noteOn(int note, float velocity) {
    // Find free voice or steal oldest
    Voice& v = findFreeVoice();
    v.noteOn(note, velocity);
  }

  void processBlock(float* output, int numSamples) {
    for (int i = 0; i < numSamples; ++i) {
      float mix = 0.0f;
      for (auto& voice : voices)
        mix += voice.process();
      output[i] = mix;
    }
  }
};`;

export const PROCESS_BLOCK_CODE = `void PluginProcessor::processBlock(
    AudioBuffer<float>& buffer,
    MidiBuffer& midi)
{
  SynthParams params;
  params.osc1Type = *apvts.getRawParameterValue("osc1Type");
  params.filterFreq = *apvts.getRawParameterValue("filterFreq");
  // ... pack all 30+ parameters

  synth.setParameters(params);
  synth.processBlock(buffer, midi);
}`;

export const FILE_TREE_DATA = [
  { path: "src/", type: "dir" as const, depth: 0 },
  { path: "src/dsp/", type: "dir" as const, depth: 1 },
  { path: "src/dsp/Phasor.h", type: "file" as const, depth: 2 },
  { path: "src/dsp/Oscillator.h", type: "file" as const, depth: 2 },
  { path: "src/dsp/Envelope.h", type: "file" as const, depth: 2 },
  { path: "src/dsp/Filter.h", type: "file" as const, depth: 2 },
  { path: "src/dsp/Voice.h", type: "file" as const, depth: 2 },
  { path: "src/dsp/Synth.h", type: "file" as const, depth: 2 },
  { path: "src/PluginProcessor.cpp", type: "file" as const, depth: 1 },
  { path: "src/PluginEditor.cpp", type: "file" as const, depth: 1 },
  { path: "CMakeLists.txt", type: "file" as const, depth: 0 },
];
