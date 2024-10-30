import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Option } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

type StepOptionsProps<T> = {
	options: T;
	optionDefinitions: { [K in keyof T]: Option };
	onOptionChange: React.Dispatch<React.SetStateAction<T>>;
};

function StepOptions<T>({ options, optionDefinitions, onOptionChange }: StepOptionsProps<T>) {
	return (
		<div className='flex flex-col gap-0 py-4'>
			<p className='text-sm text-muted-foreground'>Options</p>
			<Separator />
			<div className='flex flex-col gap-4'>
				{(Object.keys(options) as Array<keyof T>).map(key => {
					const definition = optionDefinitions[key];
					const value = options[key];
					if (definition.type === 'checkbox' && typeof value === 'boolean') {
						return (
							<CheckboxOption
								key={key as string}
								id={key as string}
								checked={value}
								onChange={checked => onOptionChange({ ...options, [key]: checked })}
								label={definition.label}
							/>
						);
					}

					if (definition.type === 'slider' && typeof value === 'number') {
						return (
							<SliderOption
								key={key as string}
								id={key as string}
								value={value}
								onChange={newValue => onOptionChange({ ...options, [key]: newValue })}
								min={definition.min}
								max={definition.max}
								step={definition.step}
								label={definition.label}
							/>
						);
					}

					return null;
				})}
			</div>
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
		<div className='flex flex-row items-center gap-2'>
			<Checkbox id={id} checked={checked} onCheckedChange={onChange} />
			<label className='cursor-pointer text-sm text-muted-foreground' htmlFor={id}>
				{label}
			</label>
		</div>
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

function SliderOption({ id, min, max, step, value, onChange, label }: SliderOptionProps) {
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
