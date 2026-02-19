export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Scene durations in frames
export const SCENE_DURATIONS = {
  INTRO: 1050, // 35s
  PROJECT_SETUP: 1500, // 50s
  PHASOR: 1650, // 55s
  OSCILLATOR: 2100, // 70s
  ENVELOPE: 1800, // 60s
  VOICE: 1500, // 50s
  SYNTH: 1650, // 55s
  PLUGIN: 1050, // 35s
  OUTRO: 300, // 10s
} as const;

export const TRANSITION_DURATION = 15;

// Total duration accounting for 8 transitions between 9 scenes
export const TOTAL_DURATION =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  8 * TRANSITION_DURATION;

// Spring configs
export const SPRING_SMOOTH = { damping: 200 } as const;
export const SPRING_BOUNCY = { damping: 12, mass: 0.5 } as const;
export const SPRING_SNAPPY = { damping: 20, stiffness: 200 } as const;

// Animation timing
export const TYPEWRITER_CHARS_PER_FRAME = 2;
export const CURSOR_BLINK_FRAMES = 15;
export const STAGGER_OFFSET = 30;
export const PREMOUNT_FRAMES = 30;
