<div align="center">

# Vamos

**Vamos is two things at once.**

A polyphonic synthesizer you can actually play — and an experiment in building it
in the open, with AI, one episode at a time.

<br>

<img src=".github/vamos-ui.png" alt="Vamos synthesizer UI" width="720">

<br>
<br>

`C++20` &nbsp; `JUCE 8` &nbsp; `VST3 / AU` &nbsp; `CMake` &nbsp; `Remotion`

</div>

<br>

## Thing one: the synth

Vamos is a polyphonic software synthesizer plugin written in C++20 with [JUCE](https://juce.com/), inspired by Ableton's Drift. Eight voices, dual oscillators with PolyBLEP anti-aliasing, eight filter types, exponential ADSR envelopes, an LFO, a cycling envelope, and a modulation matrix with flexible routing. It runs as VST3, Audio Unit, and standalone app. It works in your DAW.

```
Osc1 + Osc2 + Noise → Mixer → Filter → Amp Envelope → Pan → Output
                                  ↑
              ModMatrix (Env1, Env2/CycEnv, LFO, Velocity, Modwheel, etc.)
```

The code is split into two layers:

- **DSP layer** (`src/dsp/`) — Pure C++20, zero JUCE dependencies. Oscillators, envelopes, filters, voices, and the synth engine all live here and can be tested independently.
- **Plugin layer** (`src/PluginProcessor.cpp`, `src/PluginEditor.cpp`) — JUCE integration. Bridges the DSP engine to the AudioProcessor, manages 30+ parameters via APVTS, and renders the GUI.

Each piece of the synth was built in a distinct phase, documented in `docs/`:

| Phase | Topic |
|-------|-------|
| 1 | Foundation — phasor, oscillator, envelope, voice, synth, plugin |
| 2 | Sound sources — 7 waveform types, noise generator |
| 3 | Filter — Sallen-Key, SVF, vowel, comb, DJ, and more |
| 4 | Modulators — LFO, cycling envelope |
| 5 | Modulation — mod matrix, routing, per-voice modulation |
| 6 | Voice architecture — mono, unison, stereo modes, voice stealing |
| 7 | Parameters and GUI — APVTS integration, custom LookAndFeel |

## Thing two: the videos

Every phase becomes an episode. The [`video/`](video/) directory contains a [Remotion](https://www.remotion.dev/) project — a React-based framework for making videos with code — that turns each development phase into a narrated, animated explainer.

The videos aren't made in a timeline editor. Narration text, scene timing, voiceover audio, animated visualizations, subtitles, chapter markers, and thumbnails are all generated from structured data in TypeScript. The same code-driven approach that builds the synth also builds the content about it.

```
narration.ts  →  ElevenLabs TTS  →  timing.ts  →  Remotion scenes  →  MP4
                                                                       ↓
                                              VTT subtitles, chapters, thumbnail
```

See [`video/README.md`](video/README.md) for how the pipeline works.

## How they feed each other

The synth gives the videos something real to explain — not a toy example, but actual DSP code that runs in a DAW. The phase documents (`docs/`) capture the architectural thinking behind each step, and that thinking becomes the backbone of each episode's narration.

The videos, in turn, force clarity back into the code. If you can't explain a design decision in plain language — why the envelope overshoots to 1.2, why PolyBLEP costs only two multiplications per sample, why we separate DSP from the plugin layer — it's probably not clean enough yet. The act of producing the episode becomes a review of the code itself.

And both sides share an aesthetic. The synth's dark UI with cyan accents at `#00E5FF` is the same palette used in the video's animated diagrams, code walkthroughs, and thumbnails. One visual language, two outputs.

## Build

Requires CMake 3.22+ and a C++20 compiler. JUCE and Catch2 are fetched automatically via CMake's FetchContent (first configure takes ~2 minutes).

```bash
./scripts/dev.sh              # Debug build + launch standalone
./scripts/dev.sh --release    # Release build + launch
./scripts/dev.sh --test       # Build and run all tests
```

Build artifacts end up in `build/{Debug,Release}/Vamos_artefacts/{Standalone,VST3,AU}/`.

## Tests

Two test executables with different dependency profiles:

```bash
# DSP-only tests — no JUCE, fast
cmake --build build/Debug --target VamosTests -j$(sysctl -n hw.ncpu)
./build/Debug/tests/VamosTests

# Plugin integration tests — links JUCE
cmake --build build/Debug --target VamosPluginTests -j$(sysctl -n hw.ncpu)
./build/Debug/tests/VamosPluginTests
```

Both use Catch2 v3. Run a specific test by name or tag:

```bash
./build/Debug/tests/VamosTests "[Oscillator]"
./build/Debug/tests/VamosTests "Saw wave"
```

## License

This project is not yet licensed for distribution. Source code is provided for educational purposes.
