// Episode 2: Waveforms — scene durations driven by narration audio lengths

export const SCENE_DURATIONS = {
  INTRO: 966, // 32.2s
  GALLERY: 1266, // 42.2s
  RECTANGLE: 1627, // 54.2s
  TRIANGLE: 1939, // 64.6s
  SATURATED: 1591, // 53.0s
  SHAPE: 1090, // 36.3s
  OUTRO: 630, // 21.0s
} as const;

export const TRANSITION_DURATION = 15;

// Total duration accounting for 6 transitions between 7 scenes
export const TOTAL_DURATION =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  6 * TRANSITION_DURATION;
