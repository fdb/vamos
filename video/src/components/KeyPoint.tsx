import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_SANS } from "../lib/fonts";
import { SPRING_SMOOTH } from "../lib/timing";

type KeyPointProps = {
  text: string;
  delay?: number;
  icon?: string;
  color?: string;
};

export const KeyPoint: React.FC<KeyPointProps> = ({
  text,
  delay = 0,
  icon = "▸",
  color = COLORS.CYAN,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateX = interpolate(progress, [0, 1], [-30, 0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        opacity,
        transform: `translateX(${translateX}px)`,
        marginBottom: 16,
      }}
    >
      <span
        style={{
          color,
          fontSize: 22,
          lineHeight: "32px",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontFamily: FONT_SANS,
          fontSize: 24,
          color: COLORS.TEXT_PRIMARY,
          lineHeight: "32px",
        }}
      >
        {text}
      </span>
    </div>
  );
};
