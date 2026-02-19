import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SCENE_DURATIONS, TRANSITION_DURATION } from "./timing";
import { Intro } from "./scenes/01-Intro";
import { ProjectSetup } from "./scenes/02-ProjectSetup";
import { Phasor } from "./scenes/03-Phasor";
import { Oscillator } from "./scenes/04-Oscillator";
import { Envelope } from "./scenes/05-Envelope";
import { Voice } from "./scenes/06-Voice";
import { Synth } from "./scenes/07-Synth";
import { PluginIntegration } from "./scenes/08-PluginIntegration";
import { Outro } from "./scenes/09-Outro";
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
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.PROJECT_SETUP}>
        <ProjectSetup />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.PHASOR}>
        <Phasor />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.OSCILLATOR}>
        <Oscillator />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.ENVELOPE}>
        <Envelope />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.VOICE}>
        <Voice />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.SYNTH}>
        <Synth />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.PLUGIN}>
        <PluginIntegration />
      </TransitionSeries.Sequence>
      {transition}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.OUTRO}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
