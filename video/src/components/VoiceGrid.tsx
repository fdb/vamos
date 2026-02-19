import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";
import { FONT_MONO, FONT_SANS } from "../lib/fonts";
import { SPRING_BOUNCY, SPRING_SMOOTH } from "../lib/timing";

type VoiceEvent = {
  frame: number;
  voice: number;
  type: "noteOn" | "noteOff" | "steal";
  note?: string;
};

type VoiceGridProps = {
  events: VoiceEvent[];
  delay?: number;
};

const NOTE_COLORS = [
  COLORS.CYAN,
  COLORS.GREEN,
  COLORS.PINK,
  COLORS.AMBER,
  COLORS.VIOLET,
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
];

export const VoiceGrid: React.FC<VoiceGridProps> = ({
  events,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  // Compute voice states at current frame
  const voiceStates = Array.from({ length: 8 }, () => ({
    active: false,
    note: "",
    color: COLORS.TEXT_DIM,
    stealing: false,
    age: 0,
  }));

  for (const event of events) {
    if (event.frame > adjustedFrame) break;

    const v = voiceStates[event.voice];
    if (event.type === "noteOn") {
      v.active = true;
      v.note = event.note || "";
      v.color = NOTE_COLORS[event.voice % NOTE_COLORS.length];
      v.stealing = false;
      v.age = adjustedFrame - event.frame;
    } else if (event.type === "noteOff") {
      v.active = false;
      v.note = "";
    } else if (event.type === "steal") {
      v.stealing = true;
      v.note = event.note || "";
      v.color = NOTE_COLORS[event.voice % NOTE_COLORS.length];
      v.age = 0;
    }
  }

  // Resolve steal flash (2-frame flash)
  for (const event of events) {
    if (
      event.type === "steal" &&
      adjustedFrame >= event.frame &&
      adjustedFrame < event.frame + 8
    ) {
      voiceStates[event.voice].stealing = true;
    } else if (event.type === "steal" && adjustedFrame >= event.frame + 8) {
      voiceStates[event.voice].stealing = false;
      voiceStates[event.voice].active = true;
    }
  }

  const gridReveal = spring({
    frame: frame - delay,
    fps,
    config: SPRING_SMOOTH,
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        opacity: gridReveal,
      }}
    >
      {voiceStates.map((state, i) => {
        const cellScale = spring({
          frame: frame - delay - i * 4,
          fps,
          config: SPRING_BOUNCY,
        });

        const borderColor = state.stealing
          ? COLORS.PINK
          : state.active
            ? state.color
            : `${COLORS.TEXT_DIM}44`;

        const bgColor = state.stealing
          ? `${COLORS.PINK}22`
          : state.active
            ? `${state.color}11`
            : `${COLORS.BG_PANEL}`;

        return (
          <div
            key={i}
            style={{
              transform: `scale(${cellScale})`,
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              padding: "12px 16px",
              backgroundColor: bgColor,
              boxShadow: state.active
                ? `0 0 12px ${state.color}33`
                : "none",
              minHeight: 70,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: COLORS.TEXT_DIM,
                }}
              >
                V{i + 1}
              </span>
              {state.active && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: state.stealing ? COLORS.PINK : COLORS.GREEN,
                    boxShadow: `0 0 6px ${state.stealing ? COLORS.PINK : COLORS.GREEN}`,
                  }}
                />
              )}
            </div>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 20,
                fontWeight: 700,
                color: state.active ? state.color : COLORS.TEXT_DIM,
                opacity: state.active ? 1 : 0.3,
                textAlign: "center",
              }}
            >
              {state.note || "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
};
