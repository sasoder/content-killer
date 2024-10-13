export type TimestampText = {
  timestamp: string;
  text: string;
};

export type TimestampTextList = {
  items: TimestampText[];
};

export type OptionBase = {
  label: string;
  key: string;
};

export type CheckboxOption = OptionBase & {
  type: "checkbox";
  default: boolean;
};

export type SliderOption = OptionBase & {
  type: "slider";
  default: number;
  min: number;
  max: number;
  step: number;
};

export type GenerateOption = CheckboxOption | SliderOption;

export type GenerateOptions = {
  [key: string]: GenerateOption;
};
