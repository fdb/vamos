import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SCENE_DURATIONS, TRANSITION_DURATION } from "./timing";
import { Intro } from "./scenes/01-Intro";
import { Gallery } from "./scenes/02-Gallery";
import { Rectangle } from "./scenes/03-Rectangle";
import { Triangle } from "./scenes/04-Triangle";
import { Saturated } from "./scenes/05-Saturated";
import { Shape } from "./scenes/06-Shape";
import { Outro } from "./scenes/07-Outro";
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
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.GALLERY}>
        <Gallery />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.RECTANGLE}>
        <Rectangle />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.TRIANGLE}>
        <Triangle />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.SATURATED}>
        <Saturated />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.SHAPE}>
        <Shape />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.OUTRO}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
