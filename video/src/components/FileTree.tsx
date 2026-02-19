import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_MONO } from "../lib/fonts";
import { SPRING_SMOOTH, STAGGER_OFFSET } from "../lib/timing";

type FileEntry = {
  path: string;
  type: "dir" | "file";
  depth: number;
};

type FileTreeProps = {
  entries: FileEntry[];
  delay?: number;
  highlightPaths?: string[];
};

export const FileTree: React.FC<FileTreeProps> = ({
  entries,
  delay = 0,
  highlightPaths = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        backgroundColor: COLORS.CODE_BG,
        borderRadius: 8,
        padding: "16px 24px",
        border: `1px solid ${COLORS.CYAN}22`,
        fontFamily: FONT_MONO,
        fontSize: 16,
      }}
    >
      {entries.map((entry, i) => {
        const entryDelay = delay + i * 8;
        const progress = spring({
          frame: frame - entryDelay,
          fps,
          config: SPRING_SMOOTH,
        });

        const opacity = interpolate(frame - entryDelay, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const translateX = interpolate(progress, [0, 1], [-20, 0]);
        const isHighlighted = highlightPaths.includes(entry.path);
        const icon = entry.type === "dir" ? "📁" : "📄";
        const name = entry.path.split("/").filter(Boolean).pop() || entry.path;
        const isDir = entry.type === "dir";

        return (
          <div
            key={entry.path}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingLeft: entry.depth * 24,
              height: 30,
              opacity,
              transform: `translateX(${translateX}px)`,
              color: isHighlighted
                ? COLORS.CYAN
                : isDir
                  ? COLORS.AMBER
                  : COLORS.TEXT_PRIMARY,
            }}
          >
            <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>
              {icon}
            </span>
            <span
              style={{
                fontWeight: isDir ? 600 : 400,
              }}
            >
              {isDir ? `${name}/` : name}
            </span>
            {isHighlighted && (
              <span
                style={{
                  fontSize: 12,
                  color: COLORS.CYAN,
                  opacity: 0.7,
                  marginLeft: 8,
                }}
              >
                ← new
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
