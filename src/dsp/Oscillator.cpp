#include "Oscillator.h"
#include <algorithm>

namespace vamos {

float Oscillator::polyBlep(float t, float dt) {
    // PolyBLEP: polynomial bandlimited step function.
    // Smooths the discontinuity at phase=0 (where saw wave jumps).
    // Applied to the 1-sample window around the discontinuity.
    if (t < dt) {
        // Just past the discontinuity
        float x = t / dt;
        return x + x - x * x - 1.0f;
    }
    if (t > 1.0f - dt) {
        // Just before the discontinuity
        float x = (t - 1.0f) / dt;
        return x * x + x + x + 1.0f;
    }
    return 0.0f;
}

float Oscillator::generateSaw(float phase, float dt) {
    // Naive saw: ramps from -1 to +1
    float saw = 2.0f * phase - 1.0f;
    // Apply PolyBLEP to smooth the discontinuity at phase wrap
    saw -= polyBlep(phase, dt);

    // Shape: morph from saw toward triangle (round the corners)
    if (shape > 0.0f) {
        // Generate triangle for crossfading
        float tri = 4.0f * phase - 1.0f;
        if (phase > 0.5f)
            tri = 3.0f - 4.0f * phase;
        saw = saw * (1.0f - shape) + tri * shape;
    }

    return saw;
}

float Oscillator::generateSine(float phase) {
    return std::sin(2.0f * std::numbers::pi_v<float> * phase);
}

float Oscillator::generateSquare(float phase, float dt) {
    // PolyBLEP square wave (50% duty cycle) used for triangle integration
    float square = (phase < 0.5f) ? 1.0f : -1.0f;
    square += polyBlep(phase, dt);
    float shifted = phase + 0.5f;
    if (shifted >= 1.0f) shifted -= 1.0f;
    square -= polyBlep(shifted, dt);
    return square;
}

float Oscillator::generateTriangle(float phase, float dt) {
    // Integrate a PolyBLEP square wave for proper anti-aliased triangle.
    // The leaky integrator smooths out the square wave into a triangle shape.
    float square = generateSquare(phase, dt);

    // Leaky integrator: output += dt * square, with small leak for DC stability
    // Scale factor: 4*dt normalizes the amplitude
    triIntegrator = triIntegrator * 0.999f + square * 4.0f * dt;

    // Clamp to prevent drift from accumulating
    triIntegrator = std::clamp(triIntegrator, -1.0f, 1.0f);

    return triIntegrator;
}

float Oscillator::generateRectangle(float phase, float dt) {
    // Rectangle/square wave with pulse width control from shape.
    // shape=0 gives 50% duty (square), shape varies width.
    float pw = 0.5f + shape * 0.49f; // range 0.5 to 0.99
    float square = (phase < pw) ? 1.0f : -1.0f;
    // Apply PolyBLEP at both edges
    square += polyBlep(phase, dt);
    float shifted = phase + (1.0f - pw);
    if (shifted >= 1.0f) shifted -= 1.0f;
    square -= polyBlep(shifted, dt);
    return square;
}

float Oscillator::generatePulse(float phase, float dt) {
    // Pulse wave: narrow pulse, distinct from Rectangle.
    // shape controls width from very thin (~5%) to nearly square (~45%).
    float pw = 0.05f + shape * 0.40f; // range 0.05 to 0.45
    float pulse = (phase < pw) ? 1.0f : -1.0f;
    // Apply PolyBLEP at both edges
    pulse += polyBlep(phase, dt);
    float shifted = phase + (1.0f - pw);
    if (shifted >= 1.0f) shifted -= 1.0f;
    pulse -= polyBlep(shifted, dt);
    return pulse;
}

float Oscillator::generateSharkTooth(float phase, float dt) {
    // Asymmetric triangle where shape controls the slope ratio.
    // shape=0: left-leaning (fast rise, slow fall) like a ramp
    // shape=0.5: symmetric triangle
    // shape=1: right-leaning (slow rise, fast fall) like inverted ramp
    float midpoint = 0.1f + shape * 0.8f; // range 0.1 to 0.9

    float out;
    if (phase < midpoint) {
        // Rising edge
        out = 2.0f * phase / midpoint - 1.0f;
    } else {
        // Falling edge
        out = 1.0f - 2.0f * (phase - midpoint) / (1.0f - midpoint);
    }

    // Apply PolyBLEP at the peak (midpoint) and trough (phase wrap)
    // to reduce aliasing from the slope discontinuities
    float shiftedPeak = phase - midpoint;
    if (shiftedPeak < 0.0f) shiftedPeak += 1.0f;

    // The derivative jumps at phase=0 and phase=midpoint.
    // We apply a PolyBLEP-like correction proportional to the slope change.
    float slopeRise = 2.0f / midpoint;
    float slopeFall = -2.0f / (1.0f - midpoint);
    float slopeChange = slopeRise - slopeFall;

    // Integrated PolyBLEP for slope discontinuities (second-order correction)
    // This is approximated by scaling the standard PolyBLEP by dt
    out -= slopeChange * dt * 0.5f * polyBlep(shiftedPeak, dt);
    out -= (slopeFall - slopeRise) * dt * 0.5f * polyBlep(phase, dt);

    return std::clamp(out, -1.0f, 1.0f);
}

float Oscillator::generateSaturated(float phase, float dt) {
    // tanh waveshaping on a saw wave. shape controls drive amount.
    // shape=0: mild saturation (drive=1.5), shape=1: heavy saturation (drive=6)
    float saw = 2.0f * phase - 1.0f;
    saw -= polyBlep(phase, dt);

    float drive = 1.5f + shape * 4.5f;
    return std::tanh(drive * saw);
}

float Oscillator::process() {
    float phase = phasor.tick(frequency, sampleRate);
    float dt = phasor.getIncrement();

    switch (oscType) {
        case OscillatorType1::Saw:        return generateSaw(phase, dt);
        case OscillatorType1::Sine:       return generateSine(phase);
        case OscillatorType1::Triangle:   return generateTriangle(phase, dt);
        case OscillatorType1::Rectangle:  return generateRectangle(phase, dt);
        case OscillatorType1::Pulse:      return generatePulse(phase, dt);
        case OscillatorType1::SharkTooth: return generateSharkTooth(phase, dt);
        case OscillatorType1::Saturated:  return generateSaturated(phase, dt);
    }
    return 0.0f;
}

} // namespace vamos
