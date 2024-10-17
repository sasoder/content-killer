export type DescriptionOptions = {
  sample: boolean;
};

export type CommentaryOptions = {
  intro: boolean;
  outro: boolean;
  temperature: number;
};

export type AudioOptions = {
  stability: number;
};

export type VideoOptions = {
  bw: boolean;
  playSound: boolean;
  subtitlesEnabled: boolean;
  subtitlesSize: number;
};