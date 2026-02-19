import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";

type SceneContainerProps = {
  children: React.ReactNode;
  showScanlines?: boolean;
  showProgressBar?: boolean;
  sceneIndex?: number;
  totalScenes?: number;
};

export const SceneContainer: React.FC<SceneContainerProps> = ({
  children,
  showScanlines = true,
  showProgressBar = true,
  sceneIndex = 0,
  totalScenes = 9,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = frame / durationInFrames;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.BG_DEEP,
        overflow: "hidden",
      }}
    >
      {children}

      {/* Scanline overlay */}
      {showScanlines && (
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
      )}

      {/* Progress bar */}
      {showProgressBar && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 3,
            width: `${progress * 100}%`,
            backgroundColor: COLORS.CYAN,
            boxShadow: `0 0 10px ${COLORS.CYAN}`,
          }}
        />
      )}

      {/* Scene indicator */}
      {showProgressBar && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 24,
            fontSize: 14,
            fontFamily: "monospace",
            color: COLORS.TEXT_DIM,
            opacity: interpolate(frame, [0, 20], [0, 0.6], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          {sceneIndex + 1}/{totalScenes}
        </div>
      )}
    </AbsoluteFill>
  );
};
