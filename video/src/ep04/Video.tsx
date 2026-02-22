import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SCENE_DURATIONS, TRANSITION_DURATION } from "./timing";
import { Intro } from "./scenes/01-Intro";
import { SallenKey } from "./scenes/02-SallenKey";
import { Gallery } from "./scenes/03-Gallery";
import { Routing } from "./scenes/04-Routing";
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
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.SALLEN_KEY}>
        <SallenKey />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.GALLERY}>
        <Gallery />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.ROUTING}>
        <Routing />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.OUTRO}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
