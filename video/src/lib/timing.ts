export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Spring configs
export const SPRING_SMOOTH = { damping: 200 } as const;
export const SPRING_BOUNCY = { damping: 12, mass: 0.5 } as const;
export const SPRING_SNAPPY = { damping: 20, stiffness: 200 } as const;

// Animation timing
export const TYPEWRITER_CHARS_PER_FRAME = 2;
export const CURSOR_BLINK_FRAMES = 15;
export const STAGGER_OFFSET = 30;
export const PREMOUNT_FRAMES = 30;
