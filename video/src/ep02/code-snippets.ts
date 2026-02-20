// Episode 2: Waveforms — code snippets from actual C++ source (src/dsp/Oscillator.cpp)

export const OSCILLATOR_TYPES_CODE = `enum class OscillatorType1 {
    Saw,        // PolyBLEP saw, Shape → triangle morph
    Triangle,   // Integrated PolyBLEP square
    Sine,       // Pure std::sin()
    Rectangle,  // PWM square, Shape → pulse width
    Pulse,      // Narrow PWM variant
    SharkTooth, // Asymmetric triangle, Shape → peak position
    Saturated   // tanh waveshaping, Shape → drive
};`;

export const RECTANGLE_CODE = `float Oscillator::generateRectangle(float phase, float dt) {
    // Shape controls pulse width: 50% (square) to 99%
    float pw = 0.5f + shape * 0.49f;
    float square = (phase < pw) ? 1.0f : -1.0f;

    // PolyBLEP at both edges: rising (phase=0) and falling (phase=pw)
    square += polyBlep(phase, dt);
    float shifted = phase + (1.0f - pw);
    if (shifted >= 1.0f) shifted -= 1.0f;
    square -= polyBlep(shifted, dt);
    return square;
}`;

export const PULSE_CODE = `float Oscillator::generatePulse(float phase, float dt) {
    // Narrow pulse: 5% to 45% width (vs Rectangle's 50-99%)
    float pw = 0.05f + shape * 0.40f;
    float pulse = (phase < pw) ? 1.0f : -1.0f;
    // Same dual-PolyBLEP technique
    pulse += polyBlep(phase, dt);
    float shifted = phase + (1.0f - pw);
    if (shifted >= 1.0f) shifted -= 1.0f;
    pulse -= polyBlep(shifted, dt);
    return pulse;
}`;

export const TRIANGLE_INTEGRATION_CODE = `float Oscillator::generateTriangle(float phase, float dt) {
    // Generate a PolyBLEP square wave (already anti-aliased)
    float square = generateSquare(phase, dt);

    // Leaky integrator: square → triangle
    // 0.999 leak prevents DC drift, 4*dt normalizes amplitude
    triIntegrator = triIntegrator * 0.999f + square * 4.0f * dt;
    return triIntegrator;
}`;

export const SATURATED_CODE = `float Oscillator::generateSaturated(float phase, float dt) {
    // Start with a clean PolyBLEP saw
    float saw = 2.0f * phase - 1.0f;
    saw -= polyBlep(phase, dt);

    // Shape controls drive: 1.5x (warm) to 6x (gritty)
    float drive = 1.5f + shape * 4.5f;
    return std::tanh(drive * saw);
}`;

export const SHAPE_SAW_CODE = `float Oscillator::generateSaw(float phase, float dt) {
    float saw = 2.0f * phase - 1.0f;
    saw -= polyBlep(phase, dt);

    // Shape: crossfade from saw toward triangle
    if (shape > 0.0f) {
        float tri = (phase < 0.5f)
            ? 4.0f * phase - 1.0f
            : 3.0f - 4.0f * phase;
        saw = saw * (1.0f - shape) + tri * shape;
    }
    return saw;
}`;

export const SHARKTOOTH_CODE = `float Oscillator::generateSharkTooth(float phase, float dt) {
    // Shape moves the peak: 0.1 (left-leaning) to 0.9 (right-leaning)
    float midpoint = 0.1f + shape * 0.8f;

    float out;
    if (phase < midpoint)
        out = 2.0f * phase / midpoint - 1.0f;       // rising edge
    else
        out = 1.0f - 2.0f * (phase - midpoint) / (1.0f - midpoint);  // falling
    return out;
}`;
