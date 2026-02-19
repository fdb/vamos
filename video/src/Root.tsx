import { Composition } from "remotion";
import { Video } from "./ep01/Video";
import { VideoSchema } from "./types";
import { FPS, WIDTH, HEIGHT } from "./lib/timing";
import { TOTAL_DURATION } from "./ep01/timing";

export const RemotionRoot: React.FC = () => {
  return (
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
  );
};
