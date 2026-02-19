import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_MONO } from "../lib/fonts";
import { SPRING_BOUNCY } from "../lib/timing";

type BadgeProps = {
  label: string;
  color?: string;
  delay?: number;
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = COLORS.CYAN,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: SPRING_BOUNCY,
  });

  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 16px",
        borderRadius: 20,
        border: `1px solid ${color}`,
        backgroundColor: `${color}11`,
        fontFamily: FONT_MONO,
        fontSize: 16,
        color,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 0 8px ${color}33`,
      }}
    >
      {label}
    </div>
  );
};
