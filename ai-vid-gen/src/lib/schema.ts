export type TimestampText = {
  timestamp: string;
  text: string;
};

export type TimestampTextList = {
  items: TimestampText[];
};

export type DescriptionOptions = {
  sample?: boolean;
};

export type CommentaryOptions = {
  intro?: boolean;
  outro?: boolean;
  temperature?: number;
};

export type AudioOptions = {
  speed?: number;
};
