import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { SPRING_SMOOTH } from "../lib/timing";

type NeonBoxProps = {
  children: React.ReactNode;
  color?: string;
  delay?: number;
  width?: number | string;
};

export const NeonBox: React.FC<NeonBoxProps> = ({
  children,
  color = COLORS.CYAN,
  delay = 0,
  width = "auto",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width,
        padding: "20px 28px",
        borderRadius: 8,
        border: `1px solid ${color}44`,
        backgroundColor: `${COLORS.BG_PANEL}CC`,
        boxShadow: `0 0 20px ${color}22, inset 0 0 20px ${color}08`,
        transform: `translateY(${interpolate(reveal, [0, 1], [20, 0])}px)`,
        opacity,
      }}
    >
      {children}
    </div>
  );
};
