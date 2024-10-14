import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { GenerateOptions as GenerateOptionsType } from '@/lib/types';

interface GenerateOptionsProps {
	options: GenerateOptionsType;
	optionValues: Record<string, boolean | number>;
	onOptionChange: (key: string, value: boolean | number) => void;
}

function StepOptions({
	options,
	optionValues,
	onOptionChange,
}: GenerateOptionsProps) {
	return (
		<div className='mb-4 space-y-4'>
			{Object.entries(options).map(([key, option]) => (
				<div key={key} className='flex items-center space-x-2'>
					{option.type === 'checkbox' && (
						<CheckboxOption
							id={key}
							checked={optionValues[key] as boolean}
							onChange={checked => onOptionChange(key, checked)}
							label={option.label}
						/>
					)}
					{option.type === 'slider' && (
						<SliderOption
							id={key}
							min={option.min}
							max={option.max}
							step={option.step}
							value={optionValues[key] as number}
							onChange={value => onOptionChange(key, value)}
							label={option.label}
						/>
					)}
				</div>
			))}
		</div>
	);
}

interface CheckboxOptionProps {
	id: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
}

function CheckboxOption({ id, checked, onChange, label }: CheckboxOptionProps) {
	return (
		<>
			<Checkbox id={id} checked={checked} onCheckedChange={onChange} />
			<label className='text-sm text-muted-foreground' htmlFor={id}>
				{label}
			</label>
		</>
	);
}

interface SliderOptionProps {
	id: string;
	min: number;
	max: number;
	step: number;
	value: number;
	onChange: (value: number) => void;
	label: string;
}

function SliderOption({
	id,
	min,
	max,
	step,
	value,
	onChange,
	label,
}: SliderOptionProps) {
	return (
		<div className='flex w-full flex-col gap-1'>
			<label className='text-sm text-muted-foreground' htmlFor={id}>
				{label}: {value}
			</label>
			<div className='flex w-full flex-row items-center justify-between gap-4'>
				<div className='text-sm text-muted-foreground'>{min}</div>
				<Slider
					className='cursor-pointer'
					id={id}
					min={min}
					max={max}
					step={step}
					value={[value]}
					onValueChange={values => onChange(values[0])}
				/>
				<div className='text-sm text-muted-foreground'>{max}</div>
			</div>
		</div>
	);
}

export default StepOptions;
