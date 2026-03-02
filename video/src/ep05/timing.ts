// Episode 5: Modulators — scene durations (estimated, updated after TTS)
// Word counts → frame estimates at ~11 frames/word:
//   intro: 38+31 = 69 words ≈ 760f + gaps + buffer
//   lfo: 38+57+45 = 140 words ≈ 1540f + gaps + buffer
//   cycenv: 55+53 = 108 words ≈ 1190f + gaps + buffer
//   modmatrix: 42+47+52 = 141 words ≈ 1550f + gaps + buffer
//   outro: 55 words ≈ 605f + buffer

export const SCENE_DURATIONS = {
  INTRO: 900,        // intro-0 + intro-1 + gaps + buffer
  LFO: 1800,         // lfo-0 + lfo-1 + lfo-2 + gaps + buffer
  CYCLING_ENV: 1400, // cycenv-0 + cycenv-1 + gaps + buffer
  MOD_MATRIX: 1800,  // modmatrix-0 + modmatrix-1 + modmatrix-2 + gaps + buffer
  OUTRO: 700,        // outro-0 + visual buffer
} as const;

export const TRANSITION_DURATION = 15;

// Total duration accounting for 4 transitions between 5 scenes
export const TOTAL_DURATION =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  4 * TRANSITION_DURATION;
