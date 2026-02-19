import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_SANS } from "../lib/fonts";
import { SPRING_SMOOTH } from "../lib/timing";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  delay?: number;
  color?: string;
};

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  delay = 0,
  color = COLORS.CYAN,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const underlineWidth = interpolate(progress, [0, 1], [0, 100]);

  return (
    <div style={{ opacity, marginBottom: 48 }}>
      <h2
        style={{
          fontFamily: FONT_SANS,
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.TEXT_PRIMARY,
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>

      {/* Neon underline */}
      <div
        style={{
          height: 3,
          width: `${underlineWidth}%`,
          maxWidth: 200,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}, 0 0 20px ${color}66`,
          marginTop: 8,
          borderRadius: 2,
        }}
      />

      {subtitle && (
        <p
          style={{
            fontFamily: FONT_SANS,
            fontSize: 22,
            color: COLORS.TEXT_DIM,
            marginTop: 12,
            marginBottom: 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
