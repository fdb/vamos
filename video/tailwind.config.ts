import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "vamos-bg": "#0a0a0a",
        "vamos-panel": "#0F0F1E",
        "vamos-cyan": "#00E5FF",
        "vamos-pink": "#FF2D7B",
        "vamos-green": "#39FF14",
        "vamos-amber": "#FFAA00",
        "vamos-violet": "#BB44FF",
      },
    },
  },
  plugins: [],
} satisfies Config;
