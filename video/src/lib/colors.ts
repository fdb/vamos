export const COLORS = {
  BG_DEEP: "#0a0a0a",
  BG_PANEL: "#0F0F1E",
  CYAN: "#00E5FF",
  PINK: "#FF2D7B",
  GREEN: "#39FF14",
  AMBER: "#FFAA00",
  VIOLET: "#BB44FF",
  TEXT_PRIMARY: "#E0E0F0",
  TEXT_DIM: "#8888AA",
  CODE_BG: "#0F0F1E",
  SCANLINE: "rgba(0, 229, 255, 0.03)",
} as const;

export type ColorToken = keyof typeof COLORS;
