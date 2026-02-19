import { AbsoluteFill } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_MONO, FONT_SANS } from "../lib/fonts";

export const Thumbnail: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.BG_DEEP,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Scanline overlay */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            ${COLORS.SCANLINE} 2px,
            ${COLORS.SCANLINE} 4px
          )`,
          pointerEvents: "none",
          opacity: 0.4,
        }}
      />

      {/* Radial cyan glow behind title */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${COLORS.CYAN}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Episode label */}
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 24,
          color: COLORS.TEXT_DIM,
          letterSpacing: 8,
          marginBottom: 12,
        }}
      >
        EPISODE 1
      </div>

      {/* VAMOS title */}
      <div
        style={{
          fontFamily: FONT_SANS,
          fontSize: 120,
          fontWeight: 800,
          color: COLORS.CYAN,
          lineHeight: 1,
          textShadow: `0 0 40px ${COLORS.CYAN}66, 0 0 80px ${COLORS.CYAN}33`,
          marginBottom: 16,
        }}
      >
        VAMOS
      </div>

      {/* Subtitles */}
      <div
        style={{
          fontFamily: FONT_SANS,
          fontSize: 32,
          fontWeight: 600,
          color: COLORS.TEXT_PRIMARY,
          marginBottom: 4,
        }}
      >
        Building a Polyphonic Synthesizer
      </div>
      <div
        style={{
          fontFamily: FONT_SANS,
          fontSize: 32,
          fontWeight: 600,
          color: COLORS.TEXT_PRIMARY,
          marginBottom: 36,
        }}
      >
        from Scratch
      </div>

      {/* Tech badges */}
      <div style={{ display: "flex", gap: 16 }}>
        {["C++20", "JUCE 8", "VST3 / AU"].map((label) => (
          <div
            key={label}
            style={{
              fontFamily: FONT_MONO,
              fontSize: 18,
              color: COLORS.CYAN,
              border: `1px solid ${COLORS.CYAN}44`,
              borderRadius: 6,
              padding: "8px 20px",
              background: `${COLORS.CYAN}0A`,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Foundation label at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          fontFamily: FONT_MONO,
          fontSize: 20,
          color: COLORS.AMBER,
          letterSpacing: 12,
        }}
      >
        FOUNDATION
      </div>
    </AbsoluteFill>
  );
};
