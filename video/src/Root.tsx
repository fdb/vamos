import { Composition } from "remotion";
import { Video } from "./Video";
import { VideoSchema } from "./types";
import { FPS, WIDTH, HEIGHT, TOTAL_DURATION } from "./lib/timing";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Video"
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
