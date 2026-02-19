import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_MONO } from "../lib/fonts";
import { tokenize, getTokenColor } from "../lib/syntax";
import { TYPEWRITER_CHARS_PER_FRAME, CURSOR_BLINK_FRAMES } from "../lib/timing";

type CodeBlockProps = {
  code: string;
  lang?: "cpp" | "cmake";
  delay?: number;
  mode?: "typewriter" | "fadePerLine" | "instant";
  highlightLines?: number[];
  showLineNumbers?: boolean;
  fontSize?: number;
  charsPerFrame?: number;
};

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  lang = "cpp",
  delay = 0,
  mode = "typewriter",
  highlightLines = [],
  showLineNumbers = true,
  fontSize = 16,
  charsPerFrame = TYPEWRITER_CHARS_PER_FRAME,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);
  const lines = code.split("\n");

  const getVisibleChars = () => {
    if (mode === "instant") return code.length;
    if (mode === "typewriter") return adjustedFrame * charsPerFrame;
    return code.length;
  };

  const visibleChars = getVisibleChars();

  const getLineOpacity = (lineIndex: number) => {
    if (mode !== "fadePerLine") return 1;
    const lineStart = lineIndex * 10;
    return interpolate(adjustedFrame, [lineStart, lineStart + 15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  // Cursor blink
  const cursorOpacity =
    mode === "typewriter" && visibleChars < code.length
      ? interpolate(
          adjustedFrame % CURSOR_BLINK_FRAMES,
          [0, CURSOR_BLINK_FRAMES / 2, CURSOR_BLINK_FRAMES],
          [1, 0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )
      : 0;

  let charCount = 0;

  return (
    <div
      style={{
        backgroundColor: COLORS.CODE_BG,
        borderRadius: 8,
        padding: "20px 24px",
        border: `1px solid ${COLORS.CYAN}22`,
        fontFamily: FONT_MONO,
        fontSize,
        lineHeight: 1.6,
        overflow: "hidden",
      }}
    >
      {lines.map((line, lineIndex) => {
        const isHighlighted = highlightLines.includes(lineIndex + 1);
        const lineOpacity = getLineOpacity(lineIndex);
        const tokens = tokenize(line, lang);

        const lineContent = tokens.map((token, tokenIndex) => {
          const tokenStart = charCount;
          charCount += token.text.length;

          if (mode === "typewriter") {
            if (tokenStart >= visibleChars) return null;
            const visibleText = token.text.slice(
              0,
              Math.max(0, visibleChars - tokenStart)
            );
            if (!visibleText) return null;

            return (
              <span key={tokenIndex} style={{ color: getTokenColor(token.type) }}>
                {visibleText}
              </span>
            );
          }

          return (
            <span key={tokenIndex} style={{ color: getTokenColor(token.type) }}>
              {token.text}
            </span>
          );
        });

        // Account for newline character
        charCount += 1;

        // Show cursor at end of visible text
        const showCursorHere =
          mode === "typewriter" &&
          visibleChars >= charCount - line.length - 1 &&
          visibleChars < charCount;

        return (
          <div
            key={lineIndex}
            style={{
              display: "flex",
              opacity: lineOpacity,
              backgroundColor: isHighlighted
                ? `${COLORS.CYAN}11`
                : "transparent",
              borderLeft: isHighlighted
                ? `2px solid ${COLORS.CYAN}`
                : "2px solid transparent",
              paddingLeft: 8,
              marginLeft: -10,
            }}
          >
            {showLineNumbers && (
              <span
                style={{
                  color: COLORS.TEXT_DIM,
                  opacity: 0.4,
                  width: 36,
                  textAlign: "right",
                  marginRight: 16,
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                {lineIndex + 1}
              </span>
            )}
            <span style={{ flex: 1, whiteSpace: "pre" }}>
              {lineContent}
              {showCursorHere && (
                <span
                  style={{
                    color: COLORS.CYAN,
                    opacity: cursorOpacity,
                  }}
                >
                  ▌
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};
