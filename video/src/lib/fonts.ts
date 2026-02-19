import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const jetbrains = loadJetBrainsMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

const inter = loadInter("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

export const FONT_MONO = jetbrains.fontFamily;
export const FONT_SANS = inter.fontFamily;
