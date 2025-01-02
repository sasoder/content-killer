import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import SelectField from '@/components/ui/SelectField';
import { OptionDefinition } from '@/lib/options/optionDefinitions';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface StepOptionsProps<T> {
	options: T;
	onOptionChange: (options: T) => void;
	optionDefinitions: Record<keyof T, OptionDefinition>;
	type: string;
}

const StepOptions = <T extends Record<string, any>>({
	options,
	onOptionChange,
	optionDefinitions,
	type,
}: StepOptionsProps<T>) => {
	const handleOptionChange = (key: keyof T, value: any) => {
		onOptionChange({
			...options,
			[key]: value,
		});
	};

	return (
		<div className='flex flex-col gap-2'>
			<div className='flex flex-col'>
				<div className='text-muted-foreground text-sm font-medium capitalize'>{type} Options</div>
				<Separator className='my-1 mb-0' />
			</div>

			<div className='flex flex-col gap-2'>
				{Object.entries(optionDefinitions).map(([key, definition]) => {
					const value = options[key];

					if (definition.type === 'boolean') {
						return (
							<div key={key} className='flex items-center gap-2'>
								<Checkbox
									id={`${type}-${key}`}
									checked={value}
									className='mt-0.5'
									onCheckedChange={checked => handleOptionChange(key, checked)}
								/>
								<Label
									htmlFor={`${type}-${key}`}
									className={cn(
										'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
									)}
								>
									{definition.label}
								</Label>
							</div>
						);
					}

					if (definition.type === 'number') {
						return (
							<div key={key} className='flex flex-col'>
								<Label htmlFor={`${type}-${key}`} className='text-sm font-medium'>
									{definition.label}
								</Label>
								<div className='flex items-center gap-1'>
									<Slider
										id={`${type}-${key}`}
										min={definition.min}
										max={definition.max}
										step={definition.step}
										value={[value]}
										onValueChange={([newValue]) => handleOptionChange(key, newValue)}
									/>
									<span className='text-muted-foreground w-12 text-sm tabular-nums'>{value}</span>
								</div>
							</div>
						);
					}

					if (definition.type === 'string' && definition.options) {
						return (
							<SelectField
								key={key}
								id={`${type}-${key}`}
								label={definition.label}
								value={value}
								options={definition.options}
								onValueChange={newValue => handleOptionChange(key, newValue)}
							/>
						);
					}

					// skip other string type options that don't have predefined choices
					return null;
				})}
			</div>
		</div>
	);
};

export default StepOptions;
