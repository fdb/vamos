// Episode 1: Foundation — scene durations driven by narration audio lengths

export const SCENE_DURATIONS = {
  INTRO: 1368, // 45.6s
  PROJECT_SETUP: 1552, // 51.7s
  PHASOR: 1036, // 34.5s
  OSCILLATOR: 2877, // 95.9s
  ENVELOPE: 1747, // 58.2s
  VOICE: 1330, // 44.3s
  SYNTH: 1235, // 41.2s
  PLUGIN: 2712, // 90.4s
  OUTRO: 754, // 25.1s
} as const;

export const TRANSITION_DURATION = 15;

// Total duration accounting for 8 transitions between 9 scenes
export const TOTAL_DURATION =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  8 * TRANSITION_DURATION;
