#include "Voice.h"
#include "Synth.h" // for SynthParams
#include <cmath>
#include <algorithm>

namespace vamos {

float Voice::midiToFreq(int note) {
    // Standard equal temperament: A4 (MIDI 69) = 440 Hz
    return 440.0f * std::pow(2.0f, (static_cast<float>(note) - 69.0f) / 12.0f);
}

void Voice::setSampleRate(float sr) {
    sampleRate = sr;
    osc1.setSampleRate(sr);
    osc2.setSampleRate(sr);
    noise.setSampleRate(sr);
    filter.setSampleRate(sr);
    ampEnv.setSampleRate(sr);
    modEnv.setSampleRate(sr);
    cycEnv.setSampleRate(sr);
    lfo.setSampleRate(sr);
    drift.setSampleRate(sr);

    // Recalculate glide rate if glide is active
    if (glideTime > 0.0f)
        glideRate = 1.0f - std::exp(-1.0f / (glideTime * sampleRate));
}

void Voice::setGlideTime(float seconds) {
    glideTime = seconds;
    if (glideTime > 0.0f && sampleRate > 0.0f)
        glideRate = 1.0f - std::exp(-1.0f / (glideTime * sampleRate));
    else
        glideRate = 1.0f; // instant
}

void Voice::setParameters(const SynthParams& p) {
    // Oscillator types and shape
    osc1.setType(p.osc1Type);
    osc1.setShape(p.osc1Shape);
    osc2.setType(p.osc2Type);
    osc2Detune = p.osc2Detune;
    osc2Transpose = p.osc2Transpose;

    // Mixer
    mixer.setOsc1Gain(p.osc1Gain);
    mixer.setOsc2Gain(p.osc2Gain);
    mixer.setNoiseLevel(p.noiseLevel);
    mixer.setOsc1On(p.osc1On);
    mixer.setOsc2On(p.osc2On);
    mixer.setNoiseOn(p.noiseOn);

    // Envelope 1
    ampEnv.setParams({p.env1Attack, p.env1Decay, p.env1Sustain, p.env1Release});

    // Filter
    paramFilterType = p.filterType;
    paramFilterFreq = p.filterFreq;
    paramFilterRes = p.filterRes;
    paramFilterTracking = p.filterTracking;

    // LFO
    lfo.setShape(p.lfoShape);
    lfo.setRate(p.lfoRate);
    lfo.setAmount(p.lfoAmount);

    // Drift
    driftDepth = p.driftDepth;

    // Global (Phase 7)
    volVelMod = p.volVelMod;
    globalTranspose = p.transpose;
    resetOscPhase = p.resetOscPhase;
    pitchBendRange = p.pitchBendRange;
}

void Voice::noteOn(int midiNote, float velocity) {
    // If glide is active and voice was already playing, start from current pitch
    bool wasActive = isActive();
    float prevFreq = currentFreq;

    currentNote = midiNote;
    currentVelocity = velocity;
    targetFreq = midiToFreq(midiNote);

    if (wasActive && glideTime > 0.0f) {
        // Glide from previous pitch
        currentFreq = prevFreq;
    } else {
        // Jump to new pitch immediately
        currentFreq = targetFreq;
    }

    // Set initial frequencies (will be updated per-sample in process())
    osc1.setFrequency(currentFreq);

    float osc2Freq = midiToFreq(midiNote + osc2Transpose);
    if (osc2Detune != 0.0f)
        osc2Freq *= std::pow(2.0f, osc2Detune / 1200.0f);
    osc2.setFrequency(osc2Freq);

    // Optionally reset oscillator phase on note-on
    if (resetOscPhase) {
        osc1.resetPhase();
        osc2.resetPhase();
    }

    // Reset filter state for new note
    filter.reset();

    // Trigger amp envelope
    ampEnv.noteOn();

    // Mod envelope (Env2): Drift default A=0.001, D=0.6, S=0.2, R=0.6
    modEnv.setParams({0.001f, 0.6f, 0.2f, 0.6f});
    modEnv.noteOn();

    // Cycling envelope
    cycEnv.reset();

    // LFO: handle retrigger
    lfo.noteOn();
}

void Voice::noteOnLegato(int midiNote) {
    // Legato: change pitch without retriggering envelopes
    currentNote = midiNote;
    targetFreq = midiToFreq(midiNote);

    // If no glide, jump immediately
    if (glideTime <= 0.0f)
        currentFreq = targetFreq;
    // Otherwise glide will happen in process()
}

void Voice::noteOff() {
    ampEnv.noteOff();
    modEnv.noteOff();
}

float Voice::process() {
    if (!isActive()) return 0.0f;

    // ================================================================
    // 0. Glide: smoothly move currentFreq toward targetFreq
    // ================================================================
    if (glideTime > 0.0f && currentFreq != targetFreq) {
        currentFreq += (targetFreq - currentFreq) * glideRate;
        // Snap when very close
        if (std::abs(currentFreq - targetFreq) < 0.01f)
            currentFreq = targetFreq;
    }

    // ================================================================
    // 0b. Analog drift: slow random pitch wander (in cents)
    // ================================================================
    float driftCents = drift.process(driftDepth);

    // ================================================================
    // 1. Tick all modulators and build ModContext
    // ================================================================
    float env1Val = ampEnv.getLevel();
    float modEnvVal = modEnv.process();
    float cycEnvVal = cycEnv.process();
    float lfoVal = lfo.process();

    modCtx.env1 = env1Val;
    modCtx.env2Cyc = (env2Mode == Envelope2Mode::Env) ? modEnvVal : cycEnvVal;
    modCtx.lfo = lfoVal;
    modCtx.velocity = currentVelocity;
    modCtx.modwheel = 0.0f;
    modCtx.pressure = 0.0f;
    modCtx.slide = 0.0f;
    modCtx.key = (static_cast<float>(currentNote) - 60.0f) / 60.0f;

    // ================================================================
    // 2. Apply pitch modulation
    // ================================================================
    constexpr float kPitchRange = 48.0f;
    float pitchModSemitones =
        modCtx.get(modMatrix.pitchModSource1) * modMatrix.pitchModAmount1 * kPitchRange
      + modCtx.get(modMatrix.pitchModSource2) * modMatrix.pitchModAmount2 * kPitchRange;

    // Osc2 detune modulation from general matrix
    float osc2DetuneMod = modMatrix.resolveTarget(ModTarget::Osc2Detune, modCtx);
    constexpr float kDetuneRange = 100.0f;

    // Use currentFreq (with glide) instead of raw MIDI note freq
    // Apply drift + detune offset (from voice mode) in cents
    // Also apply global transpose and pitch bend
    float totalCentsOffset = driftCents + detuneOffset;
    float totalSemitonesOffset = pitchModSemitones + pitchBendValue;
    float baseFreq1 = currentFreq
        * std::pow(2.0f, totalCentsOffset / 1200.0f)
        * std::pow(2.0f, static_cast<float>(globalTranspose) / 12.0f);
    float modulatedFreq1 = baseFreq1 * std::pow(2.0f, totalSemitonesOffset / 12.0f);
    osc1.setFrequency(std::clamp(modulatedFreq1, 8.0f, 20000.0f));

    float baseFreq2 = midiToFreq(currentNote + osc2Transpose + globalTranspose);
    if (osc2Detune != 0.0f)
        baseFreq2 *= std::pow(2.0f, osc2Detune / 1200.0f);
    // Apply drift to osc2 as well
    baseFreq2 *= std::pow(2.0f, (driftCents + detuneOffset) / 1200.0f);
    float totalDetuneCents = osc2DetuneMod * kDetuneRange;
    float modulatedFreq2 = baseFreq2
        * std::pow(2.0f, pitchModSemitones / 12.0f)
        * std::pow(2.0f, totalDetuneCents / 1200.0f);
    osc2.setFrequency(std::clamp(modulatedFreq2, 8.0f, 20000.0f));

    // ================================================================
    // 3. Apply shape modulation to Osc1
    // ================================================================
    float shapeMod = modCtx.get(modMatrix.shapeModSource) * modMatrix.shapeModAmount;
    shapeMod += modMatrix.resolveTarget(ModTarget::Osc1Shape, modCtx);
    osc1.setShape(std::clamp(shapeMod, -1.0f, 1.0f));

    // ================================================================
    // 4. Apply mixer gain modulation
    // ================================================================
    float osc1GainMod = modMatrix.resolveTarget(ModTarget::Osc1Gain, modCtx);
    float osc2GainMod = modMatrix.resolveTarget(ModTarget::Osc2Gain, modCtx);
    float noiseGainMod = modMatrix.resolveTarget(ModTarget::NoiseGain, modCtx);

    float modOsc1Gain = std::clamp(mixer.getOsc1Gain() + osc1GainMod, 0.0f, 2.0f);
    float modOsc2Gain = std::clamp(mixer.getOsc2Gain() + osc2GainMod, 0.0f, 2.0f);
    float modNoiseGain = std::clamp(mixer.getNoiseLevel() + noiseGainMod, 0.0f, 2.0f);

    // ================================================================
    // 5. Apply LFO rate and CycEnv rate modulation
    // ================================================================
    float lfoRateMod = modMatrix.resolveTarget(ModTarget::LFORate, modCtx);
    if (lfoRateMod != 0.0f) {
        float modRate = lfo.getRate() * std::pow(2.0f, lfoRateMod);
        lfo.setRate(std::clamp(modRate, 0.01f, 100.0f));
    }

    float cycRateMod = modMatrix.resolveTarget(ModTarget::CycEnvRate, modCtx);
    if (cycRateMod != 0.0f) {
        float modRate = cycEnv.getRate() * std::pow(2.0f, cycRateMod);
        cycEnv.setRate(std::clamp(modRate, 0.01f, 100.0f));
    }

    // ================================================================
    // 6. Apply filter modulation
    // ================================================================
    constexpr float kFilterRange = 120.0f;

    float filterModSemitones =
        modCtx.get(modMatrix.filterModSource1) * modMatrix.filterModAmount1 * kFilterRange
      + modCtx.get(modMatrix.filterModSource2) * modMatrix.filterModAmount2 * kFilterRange;
    filterModSemitones += modMatrix.resolveTarget(ModTarget::LPFrequency, modCtx) * kFilterRange;

    FilterParams fp;
    fp.type = paramFilterType;
    fp.frequency = paramFilterFreq;
    fp.resonance = paramFilterRes;
    fp.hiPassFrequency = 10.0f;
    fp.tracking = paramFilterTracking;
    fp.oscThrough1 = true;
    fp.oscThrough2 = true;
    fp.noiseThrough = true;

    float modulatedCutoff = fp.frequency * std::pow(2.0f, filterModSemitones / 12.0f);
    modulatedCutoff = std::clamp(modulatedCutoff, 20.0f, 20000.0f);
    fp.frequency = modulatedCutoff;

    float hpMod = modMatrix.resolveTarget(ModTarget::HPFrequency, modCtx) * kFilterRange;
    float modulatedHP = fp.hiPassFrequency * std::pow(2.0f, hpMod / 12.0f);
    fp.hiPassFrequency = std::clamp(modulatedHP, 10.0f, 20000.0f);

    float resMod = modMatrix.resolveTarget(ModTarget::LPResonance, modCtx);
    fp.resonance = std::clamp(fp.resonance + resMod, 0.0f, 1.0f);

    filter.setParams(fp);

    // ================================================================
    // 7. Generate audio through the signal chain
    // ================================================================
    float osc1Out = osc1.process();
    float osc2Out = osc2.process();
    float noiseOut = noise.process();

    float osc1Mixed = mixer.isOsc1On() ? modOsc1Gain * osc1Out : 0.0f;
    float osc2Mixed = mixer.isOsc2On() ? modOsc2Gain * osc2Out : 0.0f;
    float noiseMixed = mixer.isNoiseOn() ? modNoiseGain * noiseOut : 0.0f;

    float filterOut = filter.process(osc1Mixed, osc2Mixed, noiseMixed, currentNote);

    float envOut = ampEnv.process();

    // Velocity scaling: volVelMod controls how much velocity affects volume
    float velGain = 1.0f - volVelMod * (1.0f - currentVelocity);

    float output = filterOut * envOut * velGain;

    // ================================================================
    // 8. Apply MainVolume modulation (multiplicative)
    // ================================================================
    float volMod = modMatrix.resolveTarget(ModTarget::MainVolume, modCtx);
    if (volMod != 0.0f) {
        output *= std::clamp(1.0f + volMod, 0.0f, 2.0f);
    }

    return output;
}

} // namespace vamos
