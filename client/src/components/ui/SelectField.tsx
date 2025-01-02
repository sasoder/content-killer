import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SelectFieldProps {
	id?: string;
	label: string;
	value: string;
	options: string[];
	onValueChange: (value: string) => void;
	placeholder?: string;
}

const SelectField = ({ id, label, value, options, onValueChange, placeholder }: SelectFieldProps) => {
	return (
		<div className='flex flex-col gap-2'>
			<Label htmlFor={id} className='text-sm font-medium'>
				{label}
			</Label>
			<Select value={value} onValueChange={onValueChange}>
				<SelectTrigger className='capitalize' id={id}>
					<SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
				</SelectTrigger>
				<SelectContent>
					{options.map(option => (
						<SelectItem className='capitalize' key={option} value={option}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export default SelectField;
