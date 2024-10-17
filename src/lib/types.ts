type OptionType = 'checkbox' | 'slider';

interface BaseOption {
	label: string;
	type: OptionType;
}

interface CheckboxOption extends BaseOption {
	type: 'checkbox';
}

interface SliderOption extends BaseOption {
	type: 'slider';
	min: number;
	max: number;
	step: number;
}

export type Option = CheckboxOption | SliderOption;
