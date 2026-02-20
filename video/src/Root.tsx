import { Composition, Still } from "remotion";
import { Video } from "./ep01/Video";
import { Thumbnail } from "./ep01/Thumbnail";
import { Video as Video02 } from "./ep02/Video";
import { Video as Video03 } from "./ep03/Video";
import { VideoSchema } from "./types";
import { FPS, WIDTH, HEIGHT } from "./lib/timing";
import { TOTAL_DURATION } from "./ep01/timing";
import { TOTAL_DURATION as TOTAL_DURATION_EP02 } from "./ep02/timing";
import { TOTAL_DURATION as TOTAL_DURATION_EP03 } from "./ep03/timing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Ep01-Foundation"
        component={Video}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={VideoSchema}
        defaultProps={{
          title: "VAMOS",
          episode: 1,
          episodeTitle: "Foundation",
        }}
      />
      <Still id="Ep01-Thumbnail" component={Thumbnail} width={1280} height={720} />
      <Composition
        id="Ep02-Waveforms"
        component={Video02}
        durationInFrames={TOTAL_DURATION_EP02}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={VideoSchema}
        defaultProps={{
          title: "VAMOS",
          episode: 2,
          episodeTitle: "Waveforms",
        }}
      />
      <Composition
        id="Ep03-NoiseMixer"
        component={Video03}
        durationInFrames={TOTAL_DURATION_EP03}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={VideoSchema}
        defaultProps={{
          title: "VAMOS",
          episode: 3,
          episodeTitle: "Noise, Mixer & Osc2",
        }}
      />
    </>
  );
};
