// Episode 3: Noise, Mixer & Osc2 — code snippets from actual C++ source

// Voice.cpp:99-102 — Oscillator 2 frequency with transpose + detune
export const OSC2_FREQ_CODE = `float osc2Freq = midiToFreq(midiNote + osc2Transpose);
if (osc2Detune != 0.0f)
    osc2Freq *= std::pow(2.0f, osc2Detune / 1200.0f);
osc2.setFrequency(osc2Freq);`;

// Noise.cpp:10-17 — xorshift32 white noise generator
export const WHITE_NOISE_CODE = `float Noise::generateWhite() {
    // xorshift32 PRNG
    rngState ^= rngState << 13;
    rngState ^= rngState >> 17;
    rngState ^= rngState << 5;
    // Convert to float in [-1, 1]
    return static_cast<float>(static_cast<int32_t>(rngState)) / 2147483648.0f;
}`;

// Noise.cpp:19-36 — Paul Kellet pink noise filter
export const PINK_NOISE_CODE = `float Noise::generatePink() {
    // Paul Kellet's pink noise filter — 6 first-order IIR filters
    // approximating -3dB/octave rolloff
    float white = generateWhite();

    b0 = 0.99886f * b0 + white * 0.0555179f;
    b1 = 0.99332f * b1 + white * 0.0750759f;
    b2 = 0.96900f * b2 + white * 0.1538520f;
    b3 = 0.86650f * b3 + white * 0.3104856f;
    b4 = 0.55000f * b4 + white * 0.5329522f;
    b5 = -0.7616f * b5 - white * 0.0168980f;

    float pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362f;
    b6 = white * 0.115926f;

    return pink * 0.11f;  // Scale to approximately [-1, 1]
}`;

// Voice.cpp:281-289 — mixer signal generation chain
export const MIXER_PROCESS_CODE = `float osc1Out = osc1.process();
float osc2Out = osc2.process();
float noiseOut = noise.process();

float osc1Mixed = mixer.isOsc1On() ? modOsc1Gain * osc1Out : 0.0f;
float osc2Mixed = mixer.isOsc2On() ? modOsc2Gain * osc2Out : 0.0f;
float noiseMixed = mixer.isNoiseOn() ? modNoiseGain * noiseOut : 0.0f;

float filterOut = filter.process(osc1Mixed, osc2Mixed, noiseMixed, currentNote);`;
