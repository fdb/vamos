// Episode 3: Noise, Mixer & Osc2 — scene durations from TTS audio lengths

export const SCENE_DURATIONS = {
  INTRO: 900, // intro-0 (440f) + intro-1 (368f) + gaps + buffer
  OSC2: 1560, // osc2-0 (531f) + osc2-1 (464f) + osc2-2 (442f) + gaps + buffer
  NOISE: 1650, // noise-0 (578f) + noise-1 (554f) + noise-2 (424f) + gaps + buffer
  MIXER: 870, // mixer-0 (391f) + mixer-1 (378f) + gaps + buffer
  OUTRO: 600, // outro-0 (486f) + visual buffer
} as const;

export const TRANSITION_DURATION = 15;

// Total duration accounting for 4 transitions between 5 scenes
export const TOTAL_DURATION =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  4 * TRANSITION_DURATION;
