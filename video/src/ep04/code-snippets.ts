// Episode 4: The Filter — code snippets from actual C++ source

// Filter.h:37-59 — SallenKeyFilter::process()
export const SALLEN_KEY_CODE = `float process(float input, float cutoffHz,
               float resonance, float sampleRate) {
    float g = std::tan(PI * cutoffHz / sampleRate);
    float k = 2.0f * (1.0f - resonance);

    float g1 = g / (1.0f + g);
    float hp = (input - (k + g) * s1 - s2)
             / (1.0f + g * (k + g));
    float bp = g1 * hp + s1;
    float lp = g1 * bp + s2;

    s1 = 2.0f * bp - s1;
    s2 = 2.0f * lp - s2;
    s1 = std::tanh(s1);  // MS-20 saturation

    return lp;
}`;

// Filter.cpp:109-112 — Type II: two cascaded stages
export const CASCADE_CODE = `float processTypeII(float input, float cutoff) {
    float stage1 = sallenKey2a.process(
        input, cutoff, params.resonance, sampleRate);
    return sallenKey2b.process(
        stage1, cutoff, params.resonance, sampleRate);
}`;

// Filter.cpp:7-18 — Vowel formant frequencies
export const VOWEL_FORMANTS_CODE = `// Vowel formant frequencies (F1, F2, F3) — male voice
static constexpr float kVowelFormants[5][3] = {
    //       F1     F2     F3
    /* a */ { 800,  1200,  2800 },
    /* e */ { 400,  2200,  2800 },
    /* i */ { 350,  2700,  3200 },
    /* o */ { 500,   800,  2800 },
    /* u */ { 350,   600,  2800 },
};`;

// Filter.cpp:206-222 — Resampling filter (simplified)
export const RESAMPLING_CODE = `float processResampling(float input, float cutoff) {
    float decimation = sampleRate / cutoff;

    resampleCounter += 1.0f;
    if (resampleCounter >= decimation) {
        resampleCounter -= decimation;
        resampleHoldValue = input;
    }
    return resampleHoldValue;
}`;

// Filter.cpp:58-102 — Routing logic (condensed for readability)
export const ROUTING_CODE = `float Filter::process(float osc1, float osc2,
                      float noise, int midiNote) {
    float cutoff = applyTracking(params.frequency, midiNote);

    float toFilter = 0.0f, bypassed = 0.0f;

    if (params.oscThrough1) toFilter += osc1;
    else                    bypassed += osc1;
    if (params.oscThrough2) toFilter += osc2;
    else                    bypassed += osc2;
    if (params.noiseThrough) toFilter += noise;
    else                     bypassed += noise;

    float filtered = processSelected(toFilter, cutoff);
    return processHiPass(filtered + bypassed);
}`;
