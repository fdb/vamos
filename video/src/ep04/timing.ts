// Episode 4: The Filter — scene durations from TTS audio lengths

export const SCENE_DURATIONS = {
  INTRO: 870,       // intro-0 (517f) + intro-1 (300f) + gaps + buffer
  SALLEN_KEY: 1920, // sallen-0 (580f) + sallen-1 (569f) + sallen-2 (698f) + gaps + buffer
  GALLERY: 2100,    // gallery-0 (545f) + gallery-1 (861f) + gallery-2 (616f) + gaps + buffer
  ROUTING: 1140,    // routing-0 (551f) + routing-1 (533f) + gaps + buffer
  OUTRO: 620,       // outro-0 (579f) + visual buffer
} as const;

export const TRANSITION_DURATION = 15;

// Total duration accounting for 4 transitions between 5 scenes
export const TOTAL_DURATION =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  4 * TRANSITION_DURATION;
