// Episode 5: Modulators — scene durations (from TTS audio lengths)
// Gap between segments: 20f (~0.67s). Buffer at scene end: 30f.

export const SCENE_DURATIONS = {
  INTRO: 839,        // intro-0 (462f) + intro-1 (327f) + gap + buffer
  LFO: 1574,         // lfo-0 (392f) + lfo-1 (629f) + lfo-2 (483f) + gaps + buffer
  CYCLING_ENV: 1440, // cycenv-0 (663f) + cycenv-1 (727f) + gap + buffer
  MOD_MATRIX: 1750,  // modmatrix-0 (529f) + modmatrix-1 (571f) + modmatrix-2 (580f) + gaps + buffer
  OUTRO: 643,        // outro-0 (613f) + buffer
} as const;

export const TRANSITION_DURATION = 15;

// Total duration accounting for 4 transitions between 5 scenes
export const TOTAL_DURATION =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  4 * TRANSITION_DURATION;
