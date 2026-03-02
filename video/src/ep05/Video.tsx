import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SCENE_DURATIONS, TRANSITION_DURATION } from "./timing";
import { Intro } from "./scenes/01-Intro";
import { LFO } from "./scenes/02-LFO";
import { CyclingEnv } from "./scenes/03-CyclingEnv";
import { ModMatrix } from "./scenes/04-ModMatrix";
import { Outro } from "./scenes/05-Outro";
import "../styles.css";

const transition = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
  />
);

export const Video: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.INTRO}>
        <Intro />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.LFO}>
        <LFO />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.CYCLING_ENV}>
        <CyclingEnv />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.MOD_MATRIX}>
        <ModMatrix />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.OUTRO}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
