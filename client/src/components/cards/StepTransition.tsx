import { Icons } from '@/components/icons';
import JsonEditor from '@/components/JsonEditor';
import { TimestampText } from '@shared/types/api/schema';

type StepTransitionProps = {
	data: TimestampText[];
	jsonEditorTitle: string;
	onUpdate: (data: TimestampText[]) => void;
};

export default function StepTransition({ data, jsonEditorTitle, onUpdate }: StepTransitionProps) {
	return (
		<div className='flex flex-col items-center justify-center'>
			<Icons.moveRight className='h-8 w-8' strokeWidth={0.8} color='gray' />
			<div className='absolute pt-24'>
				{data && data.length > 0 && <JsonEditor title={jsonEditorTitle} data={data} onUpdate={onUpdate} />}
			</div>
		</div>
	);
}
