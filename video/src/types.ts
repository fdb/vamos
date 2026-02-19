import { z } from "zod";

export const VideoSchema = z.object({
  title: z.string().default("VAMOS"),
  episode: z.number().default(1),
  episodeTitle: z.string().default("Foundation"),
});

export type VideoProps = z.infer<typeof VideoSchema>;
