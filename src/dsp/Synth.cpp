#include "Synth.h"
#include <limits>
#include <cmath>

namespace vamos {

void Synth::setSampleRate(float sr) {
    sampleRate = sr;
    for (auto& v : voices)
        v.setSampleRate(sr);
}

void Synth::setParameters(const SynthParams& params) {
    currentParams = params;

    // Update voice mode state
    voiceMode = params.voiceMode;
    legato = params.legato;
    stereoVoiceDepth = params.stereoVoiceDepth;
    unisonVoiceDepth = params.unisonVoiceDepth;
    pitchBendRange = params.pitchBendRange;

    // Pass per-voice parameters (drift, glide, etc.)
    for (auto& v : voices) {
        v.setParameters(params);
        v.setGlideTime(params.glideTime);
    }
}

int Synth::allocateVoice() {
    // 1. Find an idle voice
    for (int i = 0; i < kMaxVoices; ++i) {
        if (!voices[i].isActive())
            return i;
    }

    // 2. Steal the oldest active voice
    int oldest = 0;
    int oldestAge = std::numeric_limits<int>::max();
    for (int i = 0; i < kMaxVoices; ++i) {
        if (voiceAge[i] < oldestAge) {
            oldestAge = voiceAge[i];
            oldest = i;
        }
    }
    return oldest;
}

// ============================================================================
// Held note stack for mono mode legato
// ============================================================================

void Synth::pushHeldNote(int note) {
    // Remove if already present (re-press)
    removeHeldNote(note);
    if (heldNoteCount < kMaxHeldNotes) {
        heldNotes[heldNoteCount++] = note;
    }
}

void Synth::removeHeldNote(int note) {
    for (int i = 0; i < heldNoteCount; ++i) {
        if (heldNotes[i] == note) {
            // Shift remaining notes down
            for (int j = i; j < heldNoteCount - 1; ++j)
                heldNotes[j] = heldNotes[j + 1];
            --heldNoteCount;
            return;
        }
    }
}

// ============================================================================
// noteOn dispatch
// ============================================================================

void Synth::noteOn(int midiNote, float velocity) {
    switch (voiceMode) {
        case VoiceMode::Poly:   noteOnPoly(midiNote, velocity); break;
        case VoiceMode::Mono:   noteOnMono(midiNote, velocity); break;
        case VoiceMode::Stereo: noteOnStereo(midiNote, velocity); break;
        case VoiceMode::Unison: noteOnUnison(midiNote, velocity); break;
    }
}

void Synth::noteOff(int midiNote) {
    switch (voiceMode) {
        case VoiceMode::Poly:   noteOffPoly(midiNote); break;
        case VoiceMode::Mono:   noteOffMono(midiNote); break;
        case VoiceMode::Stereo: noteOffStereo(midiNote); break;
        case VoiceMode::Unison: noteOffUnison(midiNote); break;
    }
}

// ============================================================================
// Poly mode: 1 voice per note, up to 8 notes
// ============================================================================

void Synth::noteOnPoly(int midiNote, float velocity) {
    int idx = allocateVoice();
    voices[idx].setDetuneOffset(0.0f);
    voices[idx].setPan(0.0f);
    voices[idx].noteOn(midiNote, velocity);
    voiceAge[idx] = ++ageCounter;
}

void Synth::noteOffPoly(int midiNote) {
    for (int i = 0; i < kMaxVoices; ++i) {
        if (voices[i].isActive() && voices[i].getCurrentNote() == midiNote)
            voices[i].noteOff();
    }
}

// ============================================================================
// Mono mode: 1 voice, with legato support
// ============================================================================

void Synth::noteOnMono(int midiNote, float velocity) {
    bool wasActive = voices[0].isActive();
    pushHeldNote(midiNote);

    voices[0].setDetuneOffset(0.0f);
    voices[0].setPan(0.0f);

    if (wasActive && legato) {
        // Legato: just change pitch, don't retrigger envelopes
        voices[0].noteOnLegato(midiNote);
    } else {
        voices[0].noteOn(midiNote, velocity);
    }
    voiceAge[0] = ++ageCounter;
}

void Synth::noteOffMono(int midiNote) {
    removeHeldNote(midiNote);

    if (heldNoteCount > 0) {
        // There are still held notes -- glide back to the most recent one
        int prevNote = heldNotes[heldNoteCount - 1];
        if (legato) {
            voices[0].noteOnLegato(prevNote);
        } else {
            voices[0].noteOn(prevNote, 1.0f);
        }
    } else {
        voices[0].noteOff();
    }
}

// ============================================================================
// Stereo mode: 2 voices per note (L/R detuned), max 4 simultaneous notes
// ============================================================================

void Synth::noteOnStereo(int midiNote, float velocity) {
    // Allocate pairs: voices 0+1, 2+3, 4+5, 6+7
    // Find a free pair
    int pairIdx = -1;
    for (int p = 0; p < 4; ++p) {
        int v0 = p * 2;
        int v1 = p * 2 + 1;
        if (!voices[v0].isActive() && !voices[v1].isActive()) {
            pairIdx = p;
            break;
        }
    }

    // If no free pair, steal the oldest pair
    if (pairIdx < 0) {
        int oldestPair = 0;
        int oldestPairAge = std::numeric_limits<int>::max();
        for (int p = 0; p < 4; ++p) {
            int v0 = p * 2;
            int pairAge = std::min(voiceAge[v0], voiceAge[v0 + 1]);
            if (pairAge < oldestPairAge) {
                oldestPairAge = pairAge;
                oldestPair = p;
            }
        }
        pairIdx = oldestPair;
    }

    int v0 = pairIdx * 2;
    int v1 = pairIdx * 2 + 1;

    // StereoVoiceDepth controls detune in semitones; convert to cents
    float depthCents = stereoVoiceDepth * 100.0f; // 0.1 = 10 cents

    // Left voice: detune down, pan left
    voices[v0].setDetuneOffset(-depthCents);
    voices[v0].setPan(-1.0f);
    voices[v0].noteOn(midiNote, velocity);
    voiceAge[v0] = ++ageCounter;

    // Right voice: detune up, pan right
    voices[v1].setDetuneOffset(+depthCents);
    voices[v1].setPan(+1.0f);
    voices[v1].noteOn(midiNote, velocity);
    voiceAge[v1] = ++ageCounter;
}

void Synth::noteOffStereo(int midiNote) {
    for (int i = 0; i < kMaxVoices; ++i) {
        if (voices[i].isActive() && voices[i].getCurrentNote() == midiNote)
            voices[i].noteOff();
    }
}

// ============================================================================
// Unison mode: 4 voices per note, max 2 simultaneous notes
// ============================================================================

void Synth::noteOnUnison(int midiNote, float velocity) {
    // Allocate quads: voices 0-3, 4-7
    int quadIdx = -1;
    for (int q = 0; q < 2; ++q) {
        int base = q * 4;
        bool free = true;
        for (int i = 0; i < 4; ++i) {
            if (voices[base + i].isActive()) {
                free = false;
                break;
            }
        }
        if (free) { quadIdx = q; break; }
    }

    // Steal oldest quad if none free
    if (quadIdx < 0) {
        int oldestQuad = 0;
        int oldestQuadAge = std::numeric_limits<int>::max();
        for (int q = 0; q < 2; ++q) {
            int base = q * 4;
            int quadAge = voiceAge[base];
            for (int i = 1; i < 4; ++i)
                quadAge = std::min(quadAge, voiceAge[base + i]);
            if (quadAge < oldestQuadAge) {
                oldestQuadAge = quadAge;
                oldestQuad = q;
            }
        }
        quadIdx = oldestQuad;
    }

    int base = quadIdx * 4;

    // UnisonVoiceDepth: spread in cents
    // Voices spread symmetrically: [-1.5*d, -0.5*d, +0.5*d, +1.5*d]
    // where d = unisonVoiceDepth * 20 cents
    float d = unisonVoiceDepth * 20.0f;
    float offsets[4] = { -1.5f * d, -0.5f * d, +0.5f * d, +1.5f * d };
    // Spread panning evenly across stereo field
    float pans[4] = { -0.75f, -0.25f, +0.25f, +0.75f };

    for (int i = 0; i < 4; ++i) {
        voices[base + i].setDetuneOffset(offsets[i]);
        voices[base + i].setPan(pans[i]);
        voices[base + i].noteOn(midiNote, velocity);
        voiceAge[base + i] = ++ageCounter;
    }
}

void Synth::noteOffUnison(int midiNote) {
    for (int i = 0; i < kMaxVoices; ++i) {
        if (voices[i].isActive() && voices[i].getCurrentNote() == midiNote)
            voices[i].noteOff();
    }
}

// ============================================================================
// Process: render one stereo frame with per-voice panning
// ============================================================================

std::pair<float, float> Synth::process() {
    float left = 0.0f;
    float right = 0.0f;

    for (auto& v : voices) {
        float mono = v.process();
        if (mono == 0.0f) continue;

        float pan = v.getPan();
        // Equal-power panning: left = cos(angle), right = sin(angle)
        // Simplified linear panning for efficiency:
        // pan = -1: full left, pan = 0: center, pan = +1: full right
        float leftGain = 0.5f * (1.0f - pan);
        float rightGain = 0.5f * (1.0f + pan);
        left += mono * leftGain;
        right += mono * rightGain;
    }

    // Basic scaling factor to avoid clipping with many voices
    left *= 0.5f;
    right *= 0.5f;

    return {left, right};
}

void Synth::setPitchBend(float semitones) {
    for (auto& v : voices)
        v.setPitchBend(semitones);
}

} // namespace vamos
