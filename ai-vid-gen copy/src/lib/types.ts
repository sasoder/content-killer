export type OptionBase = {
	label: string;
	key: string;
};

export type CheckboxOption = OptionBase & {
	type: 'checkbox';
	default: boolean;
};

export type SliderOption = OptionBase & {
	type: 'slider';
	default: number;
	min: number;
	max: number;
	step: number;
};

export type GenerateOption = CheckboxOption | SliderOption;

export type GenerateOptions = Record<string, GenerateOption>;

export type OptionValues<T extends GenerateOptions> = {
	[K in keyof T]: T[K]['type'] extends 'checkbox' ? boolean : number;
};
