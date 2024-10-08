export type Commentary = {
  timestamp: string;
  commentary: string;
};

export type CommentaryList = {
  comments: Commentary[];
};

export type Description = {
  timestamp: string;
  speaker: string;
  description: string;
};

export type DescriptionList = {
  descriptions: Description[];
};
